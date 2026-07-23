"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-log";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { truckSchema, type TruckInput } from "@/lib/validations/truck";

export async function createTruckAction(input: TruckInput): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "manageTrucks")) {
    return fail("ليس لديك صلاحية لإضافة شاحنة");
  }

  const parsed = truckSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "بيانات غير صالحة");
  const data = parsed.data;

  const [dupInternal, dupPlate, dupChassis] = await Promise.all([
    prisma.truck.findUnique({ where: { internalNumber: data.internalNumber } }),
    prisma.truck.findUnique({ where: { plateNumber: data.plateNumber } }),
    prisma.truck.findUnique({ where: { chassisNumber: data.chassisNumber } }),
  ]);
  if (dupInternal) return fail("رقم الشاحنة الداخلي مستخدم بالفعل");
  if (dupPlate) return fail("رقم اللوحة مستخدم بالفعل");
  if (dupChassis) return fail("رقم الهيكل مستخدم بالفعل");

  try {
    const truck = await prisma.truck.create({
      data: {
        internalNumber: data.internalNumber,
        plateNumber: data.plateNumber,
        truckType: data.truckType,
        model: data.model,
        year: data.year,
        capacityTons: data.capacityTons,
        chassisNumber: data.chassisNumber,
        odometerKm: data.odometerKm,
        status: data.status,
        formExpiry: new Date(data.formExpiry),
        insuranceExpiry: new Date(data.insuranceExpiry),
        inspectionExpiry: new Date(data.inspectionExpiry),
        imageUrl: data.imageUrl || null,
        notes: data.notes || null,
      },
    });

    await logActivity({
      userId: session.user.id,
      userName: session.user.name,
      action: "CREATE",
      entityType: "Truck",
      entityId: truck.id,
      newValue: { internalNumber: data.internalNumber, plateNumber: data.plateNumber },
      description: `إضافة شاحنة جديدة رقم ${data.internalNumber}`,
    });

    revalidatePath("/trucks");
    revalidatePath("/");
    return ok({ id: truck.id });
  } catch {
    return fail("حدث خطأ أثناء إضافة الشاحنة");
  }
}

export async function updateTruckAction(
  id: string,
  input: TruckInput
): Promise<ActionResult<undefined>> {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "manageTrucks")) {
    return fail("ليس لديك صلاحية لتعديل الشاحنة");
  }

  const parsed = truckSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "بيانات غير صالحة");
  const data = parsed.data;

  const existing = await prisma.truck.findUnique({ where: { id } });
  if (!existing) return fail("الشاحنة غير موجودة");

  const conflictingTrip = await prisma.trip.findFirst({
    where: {
      truckId: id,
      status: { in: ["TO_PICKUP", "LOADED", "TO_DROPOFF"] },
    },
  });
  if (conflictingTrip && data.status !== "ON_TRIP" && data.status !== existing.status) {
    return fail("لا يمكن تغيير حالة شاحنة في رحلة جارية حاليا");
  }

  try {
    await prisma.truck.update({
      where: { id },
      data: {
        internalNumber: data.internalNumber,
        plateNumber: data.plateNumber,
        truckType: data.truckType,
        model: data.model,
        year: data.year,
        capacityTons: data.capacityTons,
        chassisNumber: data.chassisNumber,
        odometerKm: data.odometerKm,
        status: data.status,
        formExpiry: new Date(data.formExpiry),
        insuranceExpiry: new Date(data.insuranceExpiry),
        inspectionExpiry: new Date(data.inspectionExpiry),
        imageUrl: data.imageUrl || null,
        notes: data.notes || null,
      },
    });

    await logActivity({
      userId: session.user.id,
      userName: session.user.name,
      action: "UPDATE",
      entityType: "Truck",
      entityId: id,
      oldValue: { status: existing.status },
      newValue: { status: data.status },
      description: `تعديل بيانات الشاحنة ${data.internalNumber}`,
    });

    revalidatePath("/trucks");
    revalidatePath(`/trucks/${id}`);
    revalidatePath("/");
    return ok(undefined);
  } catch {
    return fail("حدث خطأ أثناء تعديل الشاحنة");
  }
}
