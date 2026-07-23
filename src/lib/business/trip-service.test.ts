import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { checkAssignmentConflict, validateAssignment, applyTripStatusTransition } from "./trip-service";

// Integration tests exercising the real database. Every fixture uses a unique
// run id so this suite never collides with (or needs to wipe) seeded demo data.
const RUN_ID = `test-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const createdTripIds: string[] = [];
const createdDriverIds: string[] = [];
const createdTruckIds: string[] = [];
let customerId: string;
let userId: string;

async function makeTruck(status: "AVAILABLE" | "ON_TRIP" | "MAINTENANCE" | "STOPPED" = "AVAILABLE") {
  const i = createdTruckIds.length;
  const truck = await prisma.truck.create({
    data: {
      internalNumber: `${RUN_ID}-TRK-${i}`,
      plateNumber: `${RUN_ID}-PLT-${i}`,
      truckType: "مسطحة",
      model: "اختبار",
      year: 2022,
      capacityTons: 20,
      chassisNumber: `${RUN_ID}-CHS-${i}`,
      status,
      formExpiry: new Date(Date.now() + 365 * 86_400_000),
      insuranceExpiry: new Date(Date.now() + 365 * 86_400_000),
      inspectionExpiry: new Date(Date.now() + 365 * 86_400_000),
    },
  });
  createdTruckIds.push(truck.id);
  return truck;
}

async function makeDriver(status: "AVAILABLE" | "ON_TRIP" | "LEAVE" | "SUSPENDED" = "AVAILABLE") {
  const i = createdDriverIds.length;
  const driver = await prisma.driver.create({
    data: {
      name: `سائق اختبار ${i}`,
      phone: `${RUN_ID}-PHN-${i}`,
      nationalId: `${RUN_ID}-NID-${i}`,
      nationality: "سعودي",
      licenseNumber: `${RUN_ID}-LIC-${i}`,
      licenseExpiry: new Date(Date.now() + 365 * 86_400_000),
      status,
    },
  });
  createdDriverIds.push(driver.id);
  return driver;
}

type TripOverrides = {
  status?: "DRAFT" | "PENDING_ACCEPTANCE" | "ACCEPTED" | "TO_PICKUP" | "LOADED" | "TO_DROPOFF" | "DELIVERED" | "CANCELLED";
  value?: number;
  driverId?: string;
  truckId?: string;
};

async function makeTrip(overrides: TripOverrides = {}) {
  const trip = await prisma.trip.create({
    data: {
      tripNumber: `${RUN_ID}-TRP-${createdTripIds.length}`,
      customerId,
      originCity: "الرياض",
      destinationCity: "جدة",
      pickupDateTime: new Date(),
      expectedDeliveryDate: new Date(Date.now() + 2 * 86_400_000),
      cargoType: "مواد غذائية",
      cargoWeightTons: 10,
      value: 5000,
      status: "DRAFT",
      createdById: userId,
      ...overrides,
    },
  });
  createdTripIds.push(trip.id);
  return trip;
}

beforeAll(async () => {
  const customer = await prisma.customer.create({
    data: { name: `عميل اختبار ${RUN_ID}`, phone: `${RUN_ID}-CUST` },
  });
  customerId = customer.id;

  const user = await prisma.user.create({
    data: {
      name: "مستخدم اختبار",
      email: `${RUN_ID}@test.local`,
      passwordHash: "not-used-in-tests",
      role: "OPS_MANAGER",
    },
  });
  userId = user.id;
});

afterAll(async () => {
  await prisma.financeTransaction.deleteMany({ where: { tripId: { in: createdTripIds } } });
  await prisma.tripStatusHistory.deleteMany({ where: { tripId: { in: createdTripIds } } });
  await prisma.trip.deleteMany({ where: { id: { in: createdTripIds } } });
  await prisma.driver.deleteMany({ where: { id: { in: createdDriverIds } } });
  await prisma.truck.deleteMany({ where: { id: { in: createdTruckIds } } });
  await prisma.customer.deleteMany({ where: { id: customerId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.$disconnect();
});

describe("validateAssignment", () => {
  it("rejects assigning a truck that is under maintenance", async () => {
    const truck = await makeTruck("MAINTENANCE");
    const driver = await makeDriver("AVAILABLE");

    const error = await prisma.$transaction((tx) =>
      validateAssignment(tx, { driverId: driver.id, truckId: truck.id })
    );

    expect(error).toMatch(/الشاحنة غير متاحة/);
  });

  it("rejects assigning a driver who is on leave", async () => {
    const truck = await makeTruck("AVAILABLE");
    const driver = await makeDriver("LEAVE");

    const error = await prisma.$transaction((tx) =>
      validateAssignment(tx, { driverId: driver.id, truckId: truck.id })
    );

    expect(error).toMatch(/السائق غير متاح/);
  });

  it("rejects assigning a driver/truck already committed to another active trip", async () => {
    const truck = await makeTruck("AVAILABLE");
    const driver = await makeDriver("AVAILABLE");

    const existingTrip = await makeTrip({
      status: "ACCEPTED",
      driverId: driver.id,
      truckId: truck.id,
    });

    const newTrip = await makeTrip();

    const error = await prisma.$transaction((tx) =>
      validateAssignment(tx, { driverId: driver.id, truckId: truck.id, excludeTripId: newTrip.id })
    );

    expect(error).toContain(existingTrip.tripNumber);
  });

  it("allows assignment when the driver and truck are both available and unconflicted", async () => {
    const truck = await makeTruck("AVAILABLE");
    const driver = await makeDriver("AVAILABLE");

    const error = await prisma.$transaction((tx) =>
      validateAssignment(tx, { driverId: driver.id, truckId: truck.id })
    );

    expect(error).toBeNull();
  });
});

describe("checkAssignmentConflict", () => {
  it("excludes the trip being edited from its own conflict check", async () => {
    const truck = await makeTruck("AVAILABLE");
    const driver = await makeDriver("AVAILABLE");
    const trip = await makeTrip({
      status: "ACCEPTED",
      driverId: driver.id,
      truckId: truck.id,
    });

    const error = await prisma.$transaction((tx) =>
      checkAssignmentConflict(tx, { driverId: driver.id, truckId: truck.id, excludeTripId: trip.id })
    );

    expect(error).toBeNull();
  });
});

describe("applyTripStatusTransition", () => {
  it("rejects an out-of-order transition", async () => {
    const trip = await makeTrip({ status: "DRAFT" });

    const error = await prisma.$transaction((tx) =>
      applyTripStatusTransition(tx, {
        tripId: trip.id,
        newStatus: "DELIVERED",
        actingUserId: userId,
        changedById: userId,
        changedByDriverId: null,
      })
    );

    expect(error).toMatch(/لا يمكن تغيير حالة الرحلة/);
  });

  it("marks the driver and truck ON_TRIP when the trip starts (TO_PICKUP)", async () => {
    const truck = await makeTruck("AVAILABLE");
    const driver = await makeDriver("AVAILABLE");
    const trip = await makeTrip({
      status: "ACCEPTED",
      driverId: driver.id,
      truckId: truck.id,
    });

    const error = await prisma.$transaction((tx) =>
      applyTripStatusTransition(tx, {
        tripId: trip.id,
        newStatus: "TO_PICKUP",
        actingUserId: userId,
        changedById: userId,
        changedByDriverId: null,
      })
    );
    expect(error).toBeNull();

    const [updatedDriver, updatedTruck, updatedTrip] = await Promise.all([
      prisma.driver.findUniqueOrThrow({ where: { id: driver.id } }),
      prisma.truck.findUniqueOrThrow({ where: { id: truck.id } }),
      prisma.trip.findUniqueOrThrow({ where: { id: trip.id } }),
    ]);

    expect(updatedDriver.status).toBe("ON_TRIP");
    expect(updatedTruck.status).toBe("ON_TRIP");
    expect(updatedTrip.actualStartAt).not.toBeNull();
  });

  it("releases the driver and truck back to AVAILABLE and books revenue on delivery", async () => {
    const truck = await makeTruck("AVAILABLE");
    const driver = await makeDriver("AVAILABLE");
    const trip = await makeTrip({
      status: "TO_DROPOFF",
      value: 12345,
      driverId: driver.id,
      truckId: truck.id,
    });
    // Simulate the trip having already started (as TO_PICKUP would have set it).
    await prisma.$transaction([
      prisma.driver.update({ where: { id: driver.id }, data: { status: "ON_TRIP" } }),
      prisma.truck.update({ where: { id: truck.id }, data: { status: "ON_TRIP" } }),
    ]);

    const error = await prisma.$transaction((tx) =>
      applyTripStatusTransition(tx, {
        tripId: trip.id,
        newStatus: "DELIVERED",
        actingUserId: userId,
        changedById: userId,
        changedByDriverId: null,
      })
    );
    expect(error).toBeNull();

    const [updatedDriver, updatedTruck, updatedTrip, revenue] = await Promise.all([
      prisma.driver.findUniqueOrThrow({ where: { id: driver.id } }),
      prisma.truck.findUniqueOrThrow({ where: { id: truck.id } }),
      prisma.trip.findUniqueOrThrow({ where: { id: trip.id } }),
      prisma.financeTransaction.findFirst({ where: { tripId: trip.id, type: "REVENUE" } }),
    ]);

    expect(updatedDriver.status).toBe("AVAILABLE");
    expect(updatedTruck.status).toBe("AVAILABLE");
    expect(updatedTrip.actualEndAt).not.toBeNull();
    expect(revenue).not.toBeNull();
    expect(Number(revenue?.amount)).toBe(12345);
  });

  it("releases the driver and truck when a trip is cancelled mid-route", async () => {
    const truck = await makeTruck("ON_TRIP");
    const driver = await makeDriver("ON_TRIP");
    const trip = await makeTrip({
      status: "LOADED",
      driverId: driver.id,
      truckId: truck.id,
    });

    const error = await prisma.$transaction((tx) =>
      applyTripStatusTransition(tx, {
        tripId: trip.id,
        newStatus: "CANCELLED",
        actingUserId: userId,
        changedById: userId,
        changedByDriverId: null,
      })
    );
    expect(error).toBeNull();

    const [updatedDriver, updatedTruck] = await Promise.all([
      prisma.driver.findUniqueOrThrow({ where: { id: driver.id } }),
      prisma.truck.findUniqueOrThrow({ where: { id: truck.id } }),
    ]);
    expect(updatedDriver.status).toBe("AVAILABLE");
    expect(updatedTruck.status).toBe("AVAILABLE");
  });
});
