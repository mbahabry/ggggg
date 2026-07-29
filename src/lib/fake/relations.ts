export type RelationDef = {
  type: "belongsTo" | "hasOne" | "hasMany";
  model: string;
  fk: string;
};

// Keyed by the same camelCase model property names Prisma exposes (prisma.trip, prisma.truck, ...).
export const RELATIONS: Record<string, Record<string, RelationDef>> = {
  trip: {
    customer: { type: "belongsTo", model: "customer", fk: "customerId" },
    driver: { type: "belongsTo", model: "driver", fk: "driverId" },
    truck: { type: "belongsTo", model: "truck", fk: "truckId" },
    createdBy: { type: "belongsTo", model: "user", fk: "createdById" },
    statusHistory: { type: "hasMany", model: "tripStatusHistory", fk: "tripId" },
    financeTransactions: { type: "hasMany", model: "financeTransaction", fk: "tripId" },
  },
  truck: {
    assignedDriver: { type: "hasOne", model: "driver", fk: "truckId" },
    maintenanceRequests: { type: "hasMany", model: "maintenanceRequest", fk: "truckId" },
    trips: { type: "hasMany", model: "trip", fk: "truckId" },
  },
  driver: {
    truck: { type: "belongsTo", model: "truck", fk: "truckId" },
    trips: { type: "hasMany", model: "trip", fk: "driverId" },
    user: { type: "hasOne", model: "user", fk: "driverId" },
  },
  customer: {
    trips: { type: "hasMany", model: "trip", fk: "customerId" },
    financeTransactions: { type: "hasMany", model: "financeTransaction", fk: "customerId" },
  },
  maintenanceRequest: {
    truck: { type: "belongsTo", model: "truck", fk: "truckId" },
    reportedByDriver: { type: "belongsTo", model: "driver", fk: "reportedByDriverId" },
  },
  financeTransaction: {
    customer: { type: "belongsTo", model: "customer", fk: "customerId" },
    truck: { type: "belongsTo", model: "truck", fk: "truckId" },
    driver: { type: "belongsTo", model: "driver", fk: "driverId" },
    trip: { type: "belongsTo", model: "trip", fk: "tripId" },
  },
  user: {
    driver: { type: "hasOne", model: "driver", fk: "userId" },
  },
  tripStatusHistory: {
    changedBy: { type: "belongsTo", model: "user", fk: "changedById" },
    changedByDriver: { type: "belongsTo", model: "driver", fk: "changedByDriverId" },
    trip: { type: "belongsTo", model: "trip", fk: "tripId" },
  },
  alert: {},
  activityLog: {
    user: { type: "belongsTo", model: "user", fk: "userId" },
  },
};

export const DECIMAL_FIELDS: Record<string, string[]> = {
  truck: ["capacityTons"],
  driver: ["rating"],
  trip: ["cargoWeightTons", "value"],
  maintenanceRequest: ["cost"],
  financeTransaction: ["amount"],
};

// Fields whose sort order must follow schema declaration order, not alphabetical.
export const ENUM_ORDINALS: Record<string, Record<string, number>> = {
  severity: { INFO: 0, WARNING: 1, CRITICAL: 2 },
};
