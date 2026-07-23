"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-log";
import { nextTripNumber } from "@/lib/sequence";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import {
  tripSchema,
  tripAssignSchema,
  tripStatusUpdateSchema,
  type TripInput,
} from "@/lib/validations/trip";
import { checkAssignmentConflict, validateAssignment, applyTripStatusTransition } from "@/lib/business/trip-service";
import type { TripStatus } from "@/generated/prisma/client";

export async function createTrip(input: TripInput): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "manageTrips")) {
    return fail("ليس لديك صلاحية لإنشاء رحلة");
  }

  const parsed = tripSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "بيانات غير صالحة");
  }
  const data = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      if (data.driverId && data.truckId) {
        const assignError = await validateAssignment(tx, {
          driverId: data.driverId,
          truckId: data.truckId,
        });
        if (assignError) return assignError;
      } else if (data.driverId || data.truckId) {
        const conflictError = await checkAssignmentConflict(tx, {
          driverId: data.driverId || null,
          truckId: data.truckId || null,
        });
        if (conflictError) return conflictError;
      }

      const tripNumber = await nextTripNumber(tx);
      const initialStatus: TripStatus = data.driverId && data.truckId ? "PENDING_ACCEPTANCE" : "DRAFT";

      const created = await tx.trip.create({
        data: {
          tripNumber,
          customerId: data.customerId,
          originCity: data.originCity,
          originAddress: data.originAddress || null,
          destinationCity: data.destinationCity,
          destinationAddress: data.destinationAddress || null,
          pickupDateTime: new Date(data.pickupDateTime),
          expectedDeliveryDate: new Date(data.expectedDeliveryDate),
          cargoType: data.cargoType,
          cargoWeightTons: data.cargoWeightTons,
          value: data.value,
          driverId: data.driverId || null,
          truckId: data.truckId || null,
          notes: data.notes || null,
          status: initialStatus,
          createdById: session.user.id,
        },
      });

      await tx.tripStatusHistory.create({
        data: {
          tripId: created.id,
          fromStatus: null,
          toStatus: initialStatus,
          changedById: session.user.id,
          note: "تم إنشاء الرحلة",
        },
      });

      await logActivity({
        tx,
        userId: session.user.id,
        userName: session.user.name,
        action: "CREATE",
        entityType: "Trip",
        entityId: created.id,
        newValue: { tripNumber, status: initialStatus },
        description: `إنشاء رحلة جديدة رقم ${tripNumber}`,
      });

      return created;
    });

    if (typeof result === "string") return fail(result);

    revalidatePath("/trips");
    revalidatePath("/dispatch");
    revalidatePath("/");
    return ok({ id: result.id });
  } catch {
    return fail("حدث خطأ أثناء إنشاء الرحلة");
  }
}

export async function assignTripAction(input: unknown): Promise<ActionResult<undefined>> {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "manageTrips")) {
    return fail("ليس لديك صلاحية لتعيين الرحلات");
  }

  const parsed = tripAssignSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "بيانات غير صالحة");
  }
  const { tripId, driverId, truckId } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({ where: { id: tripId } });
      if (!trip) return "الرحلة غير موجودة";
      if (!["DRAFT", "PENDING_ACCEPTANCE"].includes(trip.status)) {
        return "لا يمكن تعديل تعيين رحلة بدأت بالفعل";
      }

      const assignError = await validateAssignment(tx, { driverId, truckId, excludeTripId: tripId });
      if (assignError) return assignError;

      const [driver, truck] = await Promise.all([
        tx.driver.findUnique({ where: { id: driverId } }),
        tx.truck.findUnique({ where: { id: truckId } }),
      ]);

      const newStatus: TripStatus = "PENDING_ACCEPTANCE";

      await tx.trip.update({
        where: { id: tripId },
        data: { driverId, truckId, status: newStatus },
      });

      if (trip.status !== newStatus) {
        await tx.tripStatusHistory.create({
          data: {
            tripId,
            fromStatus: trip.status,
            toStatus: newStatus,
            changedById: session.user.id,
            note: "تعيين سائق وشاحنة للرحلة",
          },
        });
      }

      await logActivity({
        tx,
        userId: session.user.id,
        userName: session.user.name,
        action: "ASSIGN",
        entityType: "Trip",
        entityId: tripId,
        oldValue: { driverId: trip.driverId, truckId: trip.truckId },
        newValue: { driverId, truckId },
        description: `تعيين السائق ${driver?.name} والشاحنة ${truck?.internalNumber} للرحلة ${trip.tripNumber}`,
      });

      return null;
    });

    if (result) return fail(result);

    revalidatePath("/trips");
    revalidatePath("/dispatch");
    revalidatePath("/");
    return ok(undefined);
  } catch {
    return fail("حدث خطأ أثناء تعيين الرحلة");
  }
}

export async function updateTripStatusAction(input: unknown): Promise<ActionResult<undefined>> {
  const session = await auth();
  if (!session?.user) return fail("يجب تسجيل الدخول");

  const parsed = tripStatusUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "بيانات غير صالحة");
  }
  const { tripId, status: newStatus, note } = parsed.data;

  const isOpsOrAdmin = can(session.user.role, "manageTrips");
  const isDriver = session.user.role === "DRIVER";

  if (!isOpsOrAdmin && !isDriver) {
    return fail("ليس لديك صلاحية لتحديث حالة الرحلة");
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({ where: { id: tripId } });
      if (!trip) return "الرحلة غير موجودة";

      if (isDriver && trip.driverId !== session.user.driverId) {
        return "لا يمكنك تحديث رحلة لا تخصك";
      }
      if (isDriver && newStatus === "CANCELLED") {
        return "لا يمكن للسائق إلغاء الرحلة";
      }

      const transitionError = await applyTripStatusTransition(tx, {
        tripId,
        newStatus,
        actingUserId: session.user.id,
        changedById: isDriver ? null : session.user.id,
        changedByDriverId: isDriver ? session.user.driverId : null,
        note,
      });
      if (transitionError) return transitionError;

      await logActivity({
        tx,
        userId: isDriver ? null : session.user.id,
        userName: session.user.name,
        action: "STATUS_CHANGE",
        entityType: "Trip",
        entityId: tripId,
        oldValue: { status: trip.status },
        newValue: { status: newStatus },
        description: `تغيير حالة الرحلة ${trip.tripNumber} من "${trip.status}" إلى "${newStatus}"`,
      });

      return null;
    });

    if (result) return fail(result);

    revalidatePath("/trips");
    revalidatePath(`/trips/${tripId}`);
    revalidatePath("/dispatch");
    revalidatePath("/driver");
    revalidatePath(`/driver/trips/${tripId}`);
    revalidatePath("/");
    return ok(undefined);
  } catch {
    return fail("حدث خطأ أثناء تحديث حالة الرحلة");
  }
}

export async function uploadProofOfDeliveryAction(
  tripId: string,
  url: string
): Promise<ActionResult<undefined>> {
  const session = await auth();
  if (!session?.user) return fail("يجب تسجيل الدخول");

  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) return fail("الرحلة غير موجودة");

  if (session.user.role === "DRIVER" && trip.driverId !== session.user.driverId) {
    return fail("لا يمكنك تعديل رحلة لا تخصك");
  }

  await prisma.trip.update({ where: { id: tripId }, data: { proofOfDeliveryUrl: url } });

  await logActivity({
    userId: session.user.role === "DRIVER" ? null : session.user.id,
    userName: session.user.name,
    action: "UPDATE",
    entityType: "Trip",
    entityId: tripId,
    newValue: { proofOfDeliveryUrl: url },
    description: `رفع إثبات تسليم للرحلة ${trip.tripNumber}`,
  });

  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/driver/trips/${tripId}`);
  return ok(undefined);
}

export async function cancelTripAction(tripId: string, note?: string): Promise<ActionResult<undefined>> {
  return updateTripStatusAction({ tripId, status: "CANCELLED", note: note || "تم إلغاء الرحلة" });
}
