import { describe, it, expect } from "vitest";
import {
  canTransitionTripStatus,
  computeIsDelayed,
  canAssignTruck,
  canAssignDriver,
  isTripStartStatus,
  isTripEndStatus,
} from "./trip-rules";

describe("canTransitionTripStatus", () => {
  it("allows the normal forward lifecycle", () => {
    expect(canTransitionTripStatus("DRAFT", "PENDING_ACCEPTANCE")).toBe(true);
    expect(canTransitionTripStatus("PENDING_ACCEPTANCE", "ACCEPTED")).toBe(true);
    expect(canTransitionTripStatus("ACCEPTED", "TO_PICKUP")).toBe(true);
    expect(canTransitionTripStatus("TO_PICKUP", "LOADED")).toBe(true);
    expect(canTransitionTripStatus("LOADED", "TO_DROPOFF")).toBe(true);
    expect(canTransitionTripStatus("TO_DROPOFF", "DELIVERED")).toBe(true);
  });

  it("allows a driver rejection to move a pending trip back to draft", () => {
    expect(canTransitionTripStatus("PENDING_ACCEPTANCE", "DRAFT")).toBe(true);
  });

  it("allows cancellation from any non-terminal status", () => {
    expect(canTransitionTripStatus("DRAFT", "CANCELLED")).toBe(true);
    expect(canTransitionTripStatus("ACCEPTED", "CANCELLED")).toBe(true);
    expect(canTransitionTripStatus("TO_DROPOFF", "CANCELLED")).toBe(true);
  });

  it("rejects skipping stages", () => {
    expect(canTransitionTripStatus("DRAFT", "TO_PICKUP")).toBe(false);
    expect(canTransitionTripStatus("ACCEPTED", "DELIVERED")).toBe(false);
  });

  it("rejects any transition out of terminal statuses", () => {
    expect(canTransitionTripStatus("DELIVERED", "TO_DROPOFF")).toBe(false);
    expect(canTransitionTripStatus("CANCELLED", "DRAFT")).toBe(false);
  });

  it("rejects a no-op transition to the same status", () => {
    expect(canTransitionTripStatus("ACCEPTED", "ACCEPTED")).toBe(false);
  });
});

describe("isTripStartStatus / isTripEndStatus", () => {
  it("flags TO_PICKUP as the start of consumption", () => {
    expect(isTripStartStatus("TO_PICKUP")).toBe(true);
    expect(isTripStartStatus("ACCEPTED")).toBe(false);
  });

  it("flags DELIVERED and CANCELLED as terminal/end statuses", () => {
    expect(isTripEndStatus("DELIVERED")).toBe(true);
    expect(isTripEndStatus("CANCELLED")).toBe(true);
    expect(isTripEndStatus("TO_DROPOFF")).toBe(false);
  });
});

describe("computeIsDelayed", () => {
  it("is not delayed when the expected delivery date is in the future", () => {
    const trip = { status: "TO_DROPOFF" as const, expectedDeliveryDate: new Date(Date.now() + 86_400_000) };
    expect(computeIsDelayed(trip)).toBe(false);
  });

  it("is delayed when the expected delivery date has passed and the trip is still active", () => {
    const trip = { status: "TO_DROPOFF" as const, expectedDeliveryDate: new Date(Date.now() - 86_400_000) };
    expect(computeIsDelayed(trip)).toBe(true);
  });

  it("is never delayed once delivered, even if the deadline passed", () => {
    const trip = { status: "DELIVERED" as const, expectedDeliveryDate: new Date(Date.now() - 86_400_000) };
    expect(computeIsDelayed(trip)).toBe(false);
  });

  it("is never delayed once cancelled", () => {
    const trip = { status: "CANCELLED" as const, expectedDeliveryDate: new Date(Date.now() - 86_400_000) };
    expect(computeIsDelayed(trip)).toBe(false);
  });

  it("a draft trip whose deadline passed before it even started is still flagged delayed", () => {
    const trip = { status: "DRAFT" as const, expectedDeliveryDate: new Date(Date.now() - 1000) };
    expect(computeIsDelayed(trip)).toBe(true);
  });
});

describe("canAssignTruck / canAssignDriver", () => {
  it("only AVAILABLE trucks can be assigned", () => {
    expect(canAssignTruck("AVAILABLE")).toBe(true);
    expect(canAssignTruck("ON_TRIP")).toBe(false);
    expect(canAssignTruck("MAINTENANCE")).toBe(false);
    expect(canAssignTruck("STOPPED")).toBe(false);
  });

  it("only AVAILABLE drivers can be assigned", () => {
    expect(canAssignDriver("AVAILABLE")).toBe(true);
    expect(canAssignDriver("ON_TRIP")).toBe(false);
    expect(canAssignDriver("LEAVE")).toBe(false);
    expect(canAssignDriver("SUSPENDED")).toBe(false);
  });
});
