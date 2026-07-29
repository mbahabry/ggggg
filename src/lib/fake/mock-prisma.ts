import { FakeDecimal } from "./decimal";
import { DECIMAL_FIELDS } from "./relations";
import { buildFakeDb } from "./seed-data";
import {
  aggregate,
  count,
  findFirst,
  findMany,
  findUnique,
  groupBy,
  type Db,
  type Row,
} from "./engine";

const MODEL_NAMES = [
  "user",
  "truck",
  "driver",
  "customer",
  "trip",
  "tripStatusHistory",
  "maintenanceRequest",
  "financeTransaction",
  "alert",
  "activityLog",
] as const;

type ModelName = (typeof MODEL_NAMES)[number];

const globalForFake = globalThis as unknown as { __fakeDb?: Db };
const db: Db = globalForFake.__fakeDb ?? buildFakeDb();
if (!globalForFake.__fakeDb) globalForFake.__fakeDb = db;

function newId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const stamp = Date.now().toString(36);
  return `${prefix}-${stamp}${rand}`;
}

function wrapDecimals(model: ModelName, data: Row): Row {
  const fields = DECIMAL_FIELDS[model];
  if (!fields) return data;
  const out: Row = { ...data };
  for (const f of fields) {
    const v = out[f];
    if (v !== null && v !== undefined && !(v instanceof FakeDecimal)) {
      out[f] = new FakeDecimal(v as number | string);
    }
  }
  return out;
}

const RELATION_TO_FK: Record<string, Record<string, string>> = {
  trip: {
    driver: "driverId",
    truck: "truckId",
    customer: "customerId",
    createdBy: "createdById",
  },
  driver: {
    truck: "truckId",
    user: "userId",
  },
  maintenanceRequest: {
    truck: "truckId",
    reportedByDriver: "reportedByDriverId",
    createdBy: "createdById",
  },
  financeTransaction: {
    customer: "customerId",
    truck: "truckId",
    driver: "driverId",
    trip: "tripId",
    createdBy: "createdById",
  },
  tripStatusHistory: {
    trip: "tripId",
    changedBy: "changedById",
    changedByDriver: "changedByDriverId",
  },
  user: {
    driver: "driverId",
  },
  activityLog: {
    user: "userId",
  },
};

function normalizeWriteData(model: ModelName, data: Row): Row {
  const out: Row = {};
  const relMap = RELATION_TO_FK[model] ?? {};
  for (const [key, value] of Object.entries(data)) {
    const fk = relMap[key];
    if (fk && value && typeof value === "object") {
      const v = value as Row;
      if (v.connect && typeof v.connect === "object" && "id" in v.connect) {
        out[fk] = (v.connect as Row).id;
      } else if (v.disconnect === true) {
        out[fk] = null;
      } else if (v.create) {
        out[fk] = null;
      }
      continue;
    }
    out[key] = value;
  }
  return out;
}

function applyDefaults(model: ModelName, data: Row): Row {
  const now = new Date();
  const out: Row = { ...data };

  if (out.id === undefined) {
    const prefixMap: Record<ModelName, string> = {
      user: "usr",
      truck: "trk",
      driver: "drv",
      customer: "cus",
      trip: "trp",
      tripStatusHistory: "ash",
      maintenanceRequest: "mnt",
      financeTransaction: "fin",
      alert: "alt",
      activityLog: "act",
    };
    out.id = newId(prefixMap[model]);
  }
  if (out.createdAt === undefined) out.createdAt = now;
  if (out.updatedAt === undefined) out.updatedAt = now;

  const modelDefaults: Record<ModelName, Row> = {
    user: { isActive: true, phone: null },
    truck: {
      status: "AVAILABLE",
      odometerKm: 0,
      imageUrl: null,
      notes: null,
    },
    driver: {
      status: "AVAILABLE",
      rating: new FakeDecimal(5),
      violationsCount: 0,
      notes: null,
      truckId: null,
      userId: null,
    },
    customer: {
      commercialRegister: null,
      taxNumber: null,
      contactName: null,
      email: null,
      address: null,
    },
    trip: {
      status: "DRAFT",
      driverId: null,
      truckId: null,
      notes: null,
      originAddress: null,
      destinationAddress: null,
      proofOfDeliveryUrl: null,
      actualStartAt: null,
      actualEndAt: null,
    },
    tripStatusHistory: {
      changedById: null,
      changedByDriverId: null,
      fromStatus: null,
      note: null,
      changedAt: now,
    },
    maintenanceRequest: {
      status: "NEW",
      priority: "MEDIUM",
      reportedAt: now,
      reportedByDriverId: null,
      serviceCenter: null,
      cost: null,
      nextMaintenanceDate: null,
      odometerAtService: null,
      completedAt: null,
    },
    financeTransaction: {
      currency: "SAR",
      isPaid: true,
      dueDate: null,
      customerId: null,
      truckId: null,
      driverId: null,
      tripId: null,
    },
    alert: {
      isRead: false,
      isResolved: false,
      relatedTruckId: null,
      relatedDriverId: null,
      relatedTripId: null,
      relatedFinanceId: null,
      dueDate: null,
    },
    activityLog: {
      userId: null,
      entityId: null,
      oldValue: null,
      newValue: null,
    },
  };

  const defaults = modelDefaults[model];
  for (const [k, v] of Object.entries(defaults)) {
    if (out[k] === undefined) out[k] = v;
  }
  return out;
}

function whereMatchesRow(row: Row, where: Row): boolean {
  for (const [k, v] of Object.entries(where)) {
    if (row[k] !== v) return false;
  }
  return true;
}

function makeModel(name: ModelName) {
  return {
    findMany: async (args: Row = {}) => findMany(db, name, args),
    findFirst: async (args: Row = {}) => findFirst(db, name, args),
    findUnique: async (args: Row) => findUnique(db, name, args),
    count: async (args: Row = {}) => count(db, name, args),
    groupBy: async (args: Row) => groupBy(db, name, args),
    aggregate: async (args: Row = {}) => aggregate(db, name, args),
    create: async (args: Row) => {
      const normalized = normalizeWriteData(name, args.data as Row);
      const withDefaults = applyDefaults(name, normalized);
      const wrapped = wrapDecimals(name, withDefaults);
      db[name].push(wrapped);
      return args.include || args.select
        ? findUnique(db, name, { where: { id: wrapped.id }, ...args })!
        : { ...wrapped };
    },
    update: async (args: Row) => {
      const where = args.where as Row;
      const row = db[name].find((r) => whereMatchesRow(r, where));
      if (!row) throw new Error(`Record to update not found in ${name}`);
      const normalized = normalizeWriteData(name, args.data as Row);
      const wrapped = wrapDecimals(name, normalized);
      for (const [k, v] of Object.entries(wrapped)) row[k] = v;
      row.updatedAt = new Date();
      return { ...row };
    },
    delete: async (args: Row) => {
      const where = args.where as Row;
      const idx = db[name].findIndex((r) => whereMatchesRow(r, where));
      if (idx === -1) throw new Error(`Record to delete not found in ${name}`);
      const [removed] = db[name].splice(idx, 1);
      return removed;
    },
    deleteMany: async (args: Row = {}) => {
      const where = args.where as Row | undefined;
      let deleted = 0;
      for (let i = db[name].length - 1; i >= 0; i--) {
        if (!where || whereMatchesRow(db[name][i], where)) {
          db[name].splice(i, 1);
          deleted++;
        }
      }
      return { count: deleted };
    },
  };
}

const models = Object.fromEntries(MODEL_NAMES.map((m) => [m, makeModel(m)])) as Record<
  ModelName,
  ReturnType<typeof makeModel>
>;

type MockClient = Record<ModelName, ReturnType<typeof makeModel>> & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $transaction: <T>(cb: (tx: any) => Promise<T>) => Promise<T>;
  $disconnect: () => Promise<void>;
  $connect: () => Promise<void>;
};

export const mockPrisma: MockClient = {
  ...models,
  $transaction: async <T>(cb: (tx: MockClient) => Promise<T>): Promise<T> => cb(mockPrisma),
  $disconnect: async () => {},
  $connect: async () => {},
};

export type MockPrisma = typeof mockPrisma;
