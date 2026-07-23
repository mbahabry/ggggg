import type { TripStatus } from "@/generated/prisma/client";

/**
 * Allowed forward/side transitions for a trip's lifecycle.
 * PENDING_ACCEPTANCE -> DRAFT models a driver rejecting the trip (it goes back to unassigned).
 */
export const TRIP_TRANSITIONS: Record<TripStatus, TripStatus[]> = {
  DRAFT: ["PENDING_ACCEPTANCE", "CANCELLED"],
  PENDING_ACCEPTANCE: ["ACCEPTED", "DRAFT", "CANCELLED"],
  ACCEPTED: ["TO_PICKUP", "CANCELLED"],
  TO_PICKUP: ["LOADED", "CANCELLED"],
  LOADED: ["TO_DROPOFF", "CANCELLED"],
  TO_DROPOFF: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function canTransitionTripStatus(from: TripStatus, to: TripStatus): boolean {
  if (from === to) return false;
  return TRIP_TRANSITIONS[from]?.includes(to) ?? false;
}

/** The status at which a trip actually starts consuming the driver/truck. */
export function isTripStartStatus(status: TripStatus): boolean {
  return status === "TO_PICKUP";
}

/** Terminal statuses that release the driver/truck back to available. */
export function isTripEndStatus(status: TripStatus): boolean {
  return status === "DELIVERED" || status === "CANCELLED";
}

export const NON_TERMINAL_TRIP_STATUSES: TripStatus[] = [
  "DRAFT",
  "PENDING_ACCEPTANCE",
  "ACCEPTED",
  "TO_PICKUP",
  "LOADED",
  "TO_DROPOFF",
];

/**
 * A trip is considered delayed automatically when it hasn't been delivered/cancelled
 * yet and its expected delivery date has passed.
 */
export function computeIsDelayed(trip: {
  status: TripStatus;
  expectedDeliveryDate: Date | string;
}): boolean {
  if (!NON_TERMINAL_TRIP_STATUSES.includes(trip.status)) return false;
  return new Date(trip.expectedDeliveryDate).getTime() < Date.now();
}

export function canAssignTruck(truckStatus: "AVAILABLE" | "ON_TRIP" | "MAINTENANCE" | "STOPPED"): boolean {
  return truckStatus === "AVAILABLE";
}

export function canAssignDriver(driverStatus: "AVAILABLE" | "ON_TRIP" | "LEAVE" | "SUSPENDED"): boolean {
  return driverStatus === "AVAILABLE";
}
