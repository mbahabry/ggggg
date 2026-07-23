import { prisma } from "@/lib/prisma";

export async function getDriverOwnTrips(driverId: string) {
  const trips = await prisma.trip.findMany({
    where: { driverId },
    include: { customer: true, truck: true },
    orderBy: { createdAt: "desc" },
  });

  return {
    pendingAcceptance: trips.filter((t) => t.status === "PENDING_ACCEPTANCE"),
    active: trips.filter((t) => ["ACCEPTED", "TO_PICKUP", "LOADED", "TO_DROPOFF"].includes(t.status)),
    history: trips.filter((t) => ["DELIVERED", "CANCELLED"].includes(t.status)),
  };
}

export async function getDriverOwnTripDetail(driverId: string, tripId: string) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { customer: true, truck: true, statusHistory: { orderBy: { changedAt: "asc" } } },
  });
  if (!trip || trip.driverId !== driverId) return null;
  return trip;
}
