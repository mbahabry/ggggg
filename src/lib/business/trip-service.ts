import type { Prisma, TripStatus } from "@/generated/prisma/client";
import {
  canAssignDriver,
  canAssignTruck,
  canTransitionTripStatus,
  isTripEndStatus,
  isTripStartStatus,
  NON_TERMINAL_TRIP_STATUSES,
} from "@/lib/business/trip-rules";

/**
 * Ensures a driver/truck isn't already assigned to another trip that hasn't
 * reached a terminal state yet. Returns an Arabic error message, or null when clear.
 */
export async function checkAssignmentConflict(
  tx: Prisma.TransactionClient,
  { driverId, truckId, excludeTripId }: { driverId?: string | null; truckId?: string | null; excludeTripId?: string }
): Promise<string | null> {
  if (driverId) {
    const conflict = await tx.trip.findFirst({
      where: {
        driverId,
        status: { in: NON_TERMINAL_TRIP_STATUSES },
        ...(excludeTripId ? { id: { not: excludeTripId } } : {}),
      },
    });
    if (conflict) {
      return `السائق مرتبط بالفعل برحلة أخرى (${conflict.tripNumber}) لم تكتمل بعد`;
    }
  }
  if (truckId) {
    const conflict = await tx.trip.findFirst({
      where: {
        truckId,
        status: { in: NON_TERMINAL_TRIP_STATUSES },
        ...(excludeTripId ? { id: { not: excludeTripId } } : {}),
      },
    });
    if (conflict) {
      return `الشاحنة مرتبطة بالفعل برحلة أخرى (${conflict.tripNumber}) لم تكتمل بعد`;
    }
  }
  return null;
}

/**
 * Validates that a driver and truck can be assigned to a trip: both must be
 * individually AVAILABLE, and neither may already be tied to another active trip.
 */
export async function validateAssignment(
  tx: Prisma.TransactionClient,
  { driverId, truckId, excludeTripId }: { driverId: string; truckId: string; excludeTripId?: string }
): Promise<string | null> {
  const driver = await tx.driver.findUnique({ where: { id: driverId } });
  const truck = await tx.truck.findUnique({ where: { id: truckId } });
  if (!driver) return "السائق غير موجود";
  if (!truck) return "الشاحنة غير موجودة";
  if (!canAssignDriver(driver.status)) return "السائق غير متاح للتعيين";
  if (!canAssignTruck(truck.status)) return "الشاحنة غير متاحة للتعيين";

  return checkAssignmentConflict(tx, { driverId, truckId, excludeTripId });
}

/**
 * Applies the side effects of a trip status transition: validates the transition,
 * flips driver/truck availability at start/end, timestamps, and (on delivery)
 * books the trip revenue. Returns an error message, or null on success.
 */
export async function applyTripStatusTransition(
  tx: Prisma.TransactionClient,
  params: {
    tripId: string;
    newStatus: TripStatus;
    /** The signed-in user's id, always present, used to attribute the revenue record. */
    actingUserId: string;
    /** Set when a staff member (not the driver) made the change; recorded on the history entry. */
    changedById: string | null;
    /** Set when the driver themself made the change; recorded on the history entry. */
    changedByDriverId: string | null;
    note?: string | null;
  }
): Promise<string | null> {
  const trip = await tx.trip.findUnique({ where: { id: params.tripId } });
  if (!trip) return "الرحلة غير موجودة";

  if (!canTransitionTripStatus(trip.status, params.newStatus)) {
    return `لا يمكن تغيير حالة الرحلة من "${trip.status}" إلى "${params.newStatus}"`;
  }

  const updateData: Prisma.TripUpdateInput = { status: params.newStatus };

  if (isTripStartStatus(params.newStatus) && !trip.actualStartAt) {
    updateData.actualStartAt = new Date();
    if (trip.truckId) {
      await tx.truck.update({ where: { id: trip.truckId }, data: { status: "ON_TRIP" } });
    }
    if (trip.driverId) {
      await tx.driver.update({ where: { id: trip.driverId }, data: { status: "ON_TRIP" } });
    }
  }

  if (params.newStatus === "DRAFT") {
    updateData.driver = { disconnect: true };
    updateData.truck = { disconnect: true };
  }

  if (isTripEndStatus(params.newStatus)) {
    if (params.newStatus === "DELIVERED") updateData.actualEndAt = new Date();
    if (trip.truckId) {
      await tx.truck.update({ where: { id: trip.truckId }, data: { status: "AVAILABLE" } });
    }
    if (trip.driverId) {
      await tx.driver.update({ where: { id: trip.driverId }, data: { status: "AVAILABLE" } });
    }
  }

  await tx.trip.update({ where: { id: params.tripId }, data: updateData });

  await tx.tripStatusHistory.create({
    data: {
      tripId: params.tripId,
      fromStatus: trip.status,
      toStatus: params.newStatus,
      changedById: params.changedById,
      changedByDriverId: params.changedByDriverId,
      note: params.note ?? null,
    },
  });

  if (params.newStatus === "DELIVERED") {
    await tx.financeTransaction.create({
      data: {
        type: "REVENUE",
        category: "TRIP_REVENUE",
        amount: trip.value,
        description: `إيراد الرحلة ${trip.tripNumber}`,
        date: new Date(),
        customerId: trip.customerId,
        truckId: trip.truckId,
        driverId: trip.driverId,
        tripId: trip.id,
        isPaid: false,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdById: params.actingUserId,
      },
    });
  }

  return null;
}
