"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-log";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { driverSchema, type DriverInput } from "@/lib/validations/driver";

export async function createDriverAction(input: DriverInput): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "manageDrivers")) {
    return fail("ليس لديك صلاحية لإضافة سائق");
  }

  const parsed = driverSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "بيانات غير صالحة");
  const data = parsed.data;

  const [dupPhone, dupNational, dupLicense] = await Promise.all([
    prisma.driver.findUnique({ where: { phone: data.phone } }),
    prisma.driver.findUnique({ where: { nationalId: data.nationalId } }),
    prisma.driver.findUnique({ where: { licenseNumber: data.licenseNumber } }),
  ]);
  if (dupPhone) return fail("رقم الجوال مستخدم بالفعل");
  if (dupNational) return fail("رقم الهوية/الإقامة مستخدم بالفعل");
  if (dupLicense) return fail("رقم رخصة القيادة مستخدم بالفعل");

  if (data.truckId) {
    const truck = await prisma.truck.findUnique({ where: { id: data.truckId } });
    if (!truck) return fail("الشاحنة غير موجودة");
    const takenBy = await prisma.driver.findUnique({ where: { truckId: data.truckId } });
    if (takenBy) return fail("هذه الشاحنة مخصصة بالفعل لسائق آخر");
  }

  try {
    const driver = await prisma.driver.create({
      data: {
        name: data.name,
        phone: data.phone,
        nationalId: data.nationalId,
        nationality: data.nationality,
        licenseNumber: data.licenseNumber,
        licenseExpiry: new Date(data.licenseExpiry),
        status: data.status,
        truckId: data.truckId || null,
        rating: data.rating,
        violationsCount: data.violationsCount,
        notes: data.notes || null,
      },
    });

    await logActivity({
      userId: session.user.id,
      userName: session.user.name,
      action: "CREATE",
      entityType: "Driver",
      entityId: driver.id,
      newValue: { name: data.name, phone: data.phone },
      description: `إضافة سائق جديد: ${data.name}`,
    });

    revalidatePath("/drivers");
    revalidatePath("/");
    return ok({ id: driver.id });
  } catch {
    return fail("حدث خطأ أثناء إضافة السائق");
  }
}

export async function updateDriverAction(
  id: string,
  input: DriverInput
): Promise<ActionResult<undefined>> {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "manageDrivers")) {
    return fail("ليس لديك صلاحية لتعديل بيانات السائق");
  }

  const parsed = driverSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "بيانات غير صالحة");
  const data = parsed.data;

  const existing = await prisma.driver.findUnique({ where: { id } });
  if (!existing) return fail("السائق غير موجود");

  if (data.truckId && data.truckId !== existing.truckId) {
    const takenBy = await prisma.driver.findUnique({ where: { truckId: data.truckId } });
    if (takenBy && takenBy.id !== id) return fail("هذه الشاحنة مخصصة بالفعل لسائق آخر");
  }

  const activeTrip = await prisma.trip.findFirst({
    where: { driverId: id, status: { in: ["TO_PICKUP", "LOADED", "TO_DROPOFF"] } },
  });
  if (activeTrip && data.status !== "ON_TRIP") {
    return fail("لا يمكن تغيير حالة سائق في رحلة جارية حاليا");
  }

  try {
    await prisma.driver.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        nationalId: data.nationalId,
        nationality: data.nationality,
        licenseNumber: data.licenseNumber,
        licenseExpiry: new Date(data.licenseExpiry),
        status: data.status,
        truckId: data.truckId || null,
        rating: data.rating,
        violationsCount: data.violationsCount,
        notes: data.notes || null,
      },
    });

    await logActivity({
      userId: session.user.id,
      userName: session.user.name,
      action: "UPDATE",
      entityType: "Driver",
      entityId: id,
      oldValue: { status: existing.status },
      newValue: { status: data.status },
      description: `تعديل بيانات السائق ${data.name}`,
    });

    revalidatePath("/drivers");
    revalidatePath(`/drivers/${id}`);
    revalidatePath("/");
    return ok(undefined);
  } catch {
    return fail("حدث خطأ أثناء تعديل بيانات السائق");
  }
}
