import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Reference data (realistic Saudi names/cities, no real personal data)
// ---------------------------------------------------------------------------

const CITIES = [
  "الرياض",
  "جدة",
  "الدمام",
  "بريدة",
  "المدينة المنورة",
  "مكة المكرمة",
  "الجبيل",
  "ينبع",
  "الخبر",
  "تبوك",
  "حائل",
  "أبها",
];

const FIRST_NAMES = [
  "محمد",
  "أحمد",
  "عبدالله",
  "خالد",
  "سعد",
  "فهد",
  "عبدالعزيز",
  "ناصر",
  "تركي",
  "سلطان",
  "بندر",
  "ماجد",
  "فيصل",
  "سامي",
  "وليد",
  "ياسر",
  "عمر",
  "طلال",
  "راشد",
  "حمد",
  "إبراهيم",
  "عبدالرحمن",
  "مشعل",
  "ثامر",
  "عادل",
  "رائد",
  "زياد",
  "هاني",
  "جمال",
  "صالح",
];

const LAST_NAMES = [
  "القحطاني",
  "الغامدي",
  "الحربي",
  "العتيبي",
  "الدوسري",
  "الشهري",
  "الزهراني",
  "المطيري",
  "السبيعي",
  "الرشيدي",
  "البقمي",
  "العنزي",
  "الشمري",
  "الجهني",
  "الثبيتي",
  "السلمي",
  "القرني",
  "الحازمي",
  "اليامي",
  "العمري",
  "الحسني",
  "المالكي",
  "الزهيري",
  "العصيمي",
];

const NATIONALITIES_WEIGHTED = [
  ...Array(45).fill("سعودي"),
  ...Array(8).fill("مصري"),
  ...Array(7).fill("باكستاني"),
  ...Array(4).fill("بنغلاديشي"),
  ...Array(3).fill("يمني"),
  ...Array(3).fill("سوداني"),
];

const TRUCK_TYPES = ["مسطحة", "صندوق مغلق", "ثلاجة/براد", "قلاب", "ستائر جانبية", "وايت نقل سوائل"];
const TRUCK_MODELS = [
  "مرسيدس أكتروس",
  "فولفو FH",
  "مان TGX",
  "سكانيا R450",
  "ايسوزو FVR",
  "هينو 700",
  "نيسان UD",
  "رينو T-Series",
];

const CARGO_TYPES = [
  "مواد غذائية",
  "مواد بناء",
  "حديد وصلب",
  "أجهزة كهربائية",
  "مواد بتروكيماوية",
  "أثاث منزلي ومكتبي",
  "منسوجات وملابس",
  "معدات صناعية",
  "منتجات زراعية",
  "أدوية ومستلزمات طبية",
];

const CUSTOMERS_DATA = [
  { name: "شركة ألفا للصناعات الغذائية", city: "الرياض" },
  { name: "مصنع الرياض للمواد الغذائية", city: "الرياض" },
  { name: "شركة البحر الأحمر للتجارة", city: "جدة" },
  { name: "مؤسسة الخليج للنقل والتوريد", city: "الدمام" },
  { name: "شركة نجد للاستثمار الصناعي", city: "الرياض" },
  { name: "مجموعة تبوك التجارية", city: "تبوك" },
  { name: "شركة الواحة للمقاولات العامة", city: "بريدة" },
  { name: "مصانع الجبيل للبتروكيماويات", city: "الجبيل" },
  { name: "شركة القصيم الزراعية", city: "بريدة" },
  { name: "مؤسسة ينبع للخدمات اللوجستية", city: "ينبع" },
  { name: "شركة أسواق التموين الحديثة", city: "جدة" },
  { name: "مصنع الدمام للحديد والصلب", city: "الدمام" },
  { name: "شركة مكة للتوزيع الغذائي", city: "مكة المكرمة" },
  { name: "مؤسسة المدينة للتجارة العامة", city: "المدينة المنورة" },
  { name: "الشركة الشرقية للصناعات البلاستيكية", city: "الخبر" },
];

// ---------------------------------------------------------------------------
// Small deterministic PRNG so re-running the seed produces the same dataset
// ---------------------------------------------------------------------------

let seedValue = 42;
function rand(): number {
  seedValue = (seedValue * 9301 + 49297) % 233280;
  return seedValue / 233280;
}
function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}
function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(randInt(6, 20), randInt(0, 59), 0, 0);
  return d;
}

async function main() {
  console.log("🗑  تنظيف قاعدة البيانات...");
  await prisma.activityLog.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.tripStatusHistory.deleteMany();
  await prisma.financeTransaction.deleteMany();
  await prisma.maintenanceRequest.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.truck.deleteMany();
  await prisma.user.deleteMany();

  // -------------------------------------------------------------------
  // Users (one demo account per role)
  // -------------------------------------------------------------------
  console.log("👤 إنشاء المستخدمين...");
  const passwordHash = await bcrypt.hash("Passw0rd!", 10);

  const admin = await prisma.user.create({
    data: {
      name: "خالد الإدارة",
      email: "admin@fleet.sa",
      passwordHash,
      role: "ADMIN",
      phone: "0500000001",
    },
  });

  const opsManager = await prisma.user.create({
    data: {
      name: "فهد العتيبي",
      email: "ops@fleet.sa",
      passwordHash,
      role: "OPS_MANAGER",
      phone: "0500000002",
    },
  });

  await prisma.user.create({
    data: {
      name: "سارة المحاسبة",
      email: "accountant@fleet.sa",
      passwordHash,
      role: "ACCOUNTANT",
      phone: "0500000003",
    },
  });

  await prisma.user.create({
    data: {
      name: "ماجد الصيانة",
      email: "maintenance@fleet.sa",
      passwordHash,
      role: "MAINTENANCE",
      phone: "0500000004",
    },
  });

  // -------------------------------------------------------------------
  // Trucks (80)
  // -------------------------------------------------------------------
  console.log("🚚 إنشاء الشاحنات...");
  const trucks = [];
  for (let i = 1; i <= 80; i++) {
    const internalNumber = `TRK-${String(i).padStart(3, "0")}`;
    // A handful of trucks get documents that are already expired or expiring soon.
    let formExpiry = daysFromNow(randInt(60, 400));
    let insuranceExpiry = daysFromNow(randInt(60, 400));
    let inspectionExpiry = daysFromNow(randInt(60, 400));
    if (i % 11 === 0) formExpiry = daysFromNow(randInt(-10, 5));
    if (i % 13 === 0) insuranceExpiry = daysFromNow(randInt(-5, 12));
    if (i % 17 === 0) inspectionExpiry = daysFromNow(randInt(-15, 25));

    let status: "AVAILABLE" | "ON_TRIP" | "MAINTENANCE" | "STOPPED" = "AVAILABLE";
    if (i % 9 === 0) status = "MAINTENANCE";
    else if (i % 23 === 0) status = "STOPPED";

    const truck = await prisma.truck.create({
      data: {
        internalNumber,
        plateNumber: `${randInt(1000, 9999)} ${pick(["أ ب ج", "د ه و", "ح ط ي", "ك ل م"])}`,
        truckType: pick(TRUCK_TYPES),
        model: pick(TRUCK_MODELS),
        year: randInt(2015, 2024),
        capacityTons: randInt(10, 40),
        chassisNumber: `CHS${String(100000 + i)}`,
        odometerKm: randInt(20000, 480000),
        status,
        formExpiry,
        insuranceExpiry,
        inspectionExpiry,
        notes: i % 15 === 0 ? "تحتاج فحص إطارات دوري" : null,
      },
    });
    trucks.push(truck);
  }

  // -------------------------------------------------------------------
  // Drivers (70)
  // -------------------------------------------------------------------
  console.log("🧑‍✈️ إنشاء السائقين...");
  const usedNames = new Set<string>();
  const drivers = [];
  let truckCursor = 0;
  for (let i = 1; i <= 70; i++) {
    let name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    while (usedNames.has(name)) name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    usedNames.add(name);

    let licenseExpiry = daysFromNow(randInt(60, 500));
    if (i % 10 === 0) licenseExpiry = daysFromNow(randInt(-8, 6));
    if (i % 19 === 0) licenseExpiry = daysFromNow(randInt(1, 13));

    let status: "AVAILABLE" | "ON_TRIP" | "LEAVE" | "SUSPENDED" = "AVAILABLE";
    if (i % 12 === 0) status = "LEAVE";
    else if (i % 27 === 0) status = "SUSPENDED";

    // Assign roughly one truck per driver, leaving a few unassigned trucks/drivers.
    let assignedTruckId: string | undefined;
    if (truckCursor < trucks.length && i % 6 !== 0) {
      assignedTruckId = trucks[truckCursor].id;
      truckCursor++;
    }

    const driver = await prisma.driver.create({
      data: {
        name,
        phone: `05${String(randInt(10000000, 99999999))}`,
        nationalId: `1${String(100000000 + i * 137)}`,
        nationality: pick(NATIONALITIES_WEIGHTED),
        licenseNumber: `DL${String(500000 + i)}`,
        licenseExpiry,
        status,
        truckId: assignedTruckId,
        rating: Math.round((3 + rand() * 2) * 100) / 100,
        violationsCount: randInt(0, 4),
      },
    });
    drivers.push(driver);
  }

  // Demo driver login, linked to the first driver record.
  await prisma.user.create({
    data: {
      name: drivers[0].name,
      email: "driver@fleet.sa",
      passwordHash,
      role: "DRIVER",
      phone: drivers[0].phone,
      driver: { connect: { id: drivers[0].id } },
    },
  });

  // -------------------------------------------------------------------
  // Customers (15)
  // -------------------------------------------------------------------
  console.log("🏢 إنشاء العملاء...");
  const customers: Awaited<ReturnType<typeof prisma.customer.create>>[] = [];
  for (let i = 0; i < CUSTOMERS_DATA.length; i++) {
    const c = CUSTOMERS_DATA[i];
    const customer = await prisma.customer.create({
      data: {
        name: c.name,
        commercialRegister: `${randInt(1010000000, 1010999999)}`,
        taxNumber: `3${randInt(10000000000, 99999999999)}`,
        contactName: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
        phone: `01${randInt(1000000, 9999999)}`,
        email: `contact${i + 1}@${["client-mail", "biz-mail", "corp-mail"][i % 3]}.sa`,
        address: `${c.city} - حي الصناعية`,
      },
    });
    customers.push(customer);
  }

  // -------------------------------------------------------------------
  // Trips (100) with a spread of statuses, some delayed, and full history
  // -------------------------------------------------------------------
  console.log("🚛 إنشاء الرحلات...");

  const availableDrivers = drivers.filter((d) => d.status === "AVAILABLE");
  const availableTrucks = trucks.filter((t) => t.status === "AVAILABLE");

  let tripCount = 0;
  const usedDriverIds = new Set<string>();
  const usedTruckIds = new Set<string>();

  async function createTripWithHistory(opts: {
    status:
      | "DRAFT"
      | "PENDING_ACCEPTANCE"
      | "ACCEPTED"
      | "TO_PICKUP"
      | "LOADED"
      | "TO_DROPOFF"
      | "DELIVERED"
      | "CANCELLED";
    delayed?: boolean;
    assignDriverTruck: boolean;
  }) {
    tripCount++;
    const tripNumber = `TRP-${String(tripCount).padStart(6, "0")}`;
    const customer = pick(customers);
    const origin = pick(CITIES);
    let destination = pick(CITIES);
    while (destination === origin) destination = pick(CITIES);

    const pickupOffsetDays = opts.status === "DRAFT" ? randInt(1, 10) : randInt(-30, 5);
    const pickupDateTime = daysFromNow(pickupOffsetDays);

    let expectedDeliveryDate: Date;
    if (opts.delayed) {
      expectedDeliveryDate = daysFromNow(randInt(-10, -1));
    } else {
      const d = new Date(pickupDateTime);
      d.setDate(d.getDate() + randInt(1, 4));
      expectedDeliveryDate = d;
    }

    let driverId: string | undefined;
    let truckId: string | undefined;
    if (opts.assignDriverTruck) {
      const driver = availableDrivers.find((d) => !usedDriverIds.has(d.id));
      const truck = availableTrucks.find((t) => !usedTruckIds.has(t.id));
      if (driver && truck) {
        driverId = driver.id;
        truckId = truck.id;
        usedDriverIds.add(driver.id);
        usedTruckIds.add(truck.id);
      }
    }

    const value = randInt(1500, 25000);

    const trip = await prisma.trip.create({
      data: {
        tripNumber,
        customerId: customer.id,
        originCity: origin,
        originAddress: `${origin} - المنطقة الصناعية`,
        destinationCity: destination,
        destinationAddress: `${destination} - المنطقة الصناعية`,
        pickupDateTime,
        expectedDeliveryDate,
        cargoType: pick(CARGO_TYPES),
        cargoWeightTons: randInt(3, 35),
        value,
        driverId,
        truckId,
        status: opts.status,
        notes: opts.delayed ? "تأخر بسبب ازدحام مروري وأحوال جوية" : null,
        actualStartAt: ["TO_PICKUP", "LOADED", "TO_DROPOFF", "DELIVERED"].includes(opts.status)
          ? pickupDateTime
          : null,
        actualEndAt: opts.status === "DELIVERED" ? daysFromNow(-randInt(1, 5)) : null,
        createdById: opsManager.id,
      },
    });

    await prisma.tripStatusHistory.create({
      data: {
        tripId: trip.id,
        fromStatus: null,
        toStatus: opts.status,
        changedById: opsManager.id,
        note: "تم إنشاء الرحلة (بيانات تجريبية)",
      },
    });

    if (opts.status === "DELIVERED") {
      await prisma.financeTransaction.create({
        data: {
          type: "REVENUE",
          category: "TRIP_REVENUE",
          amount: value,
          description: `إيراد الرحلة ${tripNumber}`,
          date: trip.actualEndAt ?? new Date(),
          customerId: customer.id,
          truckId,
          driverId,
          tripId: trip.id,
          isPaid: rand() > 0.35,
          dueDate: daysFromNow(randInt(-10, 20)),
          createdById: admin.id,
        },
      });
    }

    if (driverId) {
      await prisma.truck.update({
        where: { id: truckId! },
        data: { status: ["TO_PICKUP", "LOADED", "TO_DROPOFF"].includes(opts.status) ? "ON_TRIP" : "AVAILABLE" },
      });
      await prisma.driver.update({
        where: { id: driverId },
        data: { status: ["TO_PICKUP", "LOADED", "TO_DROPOFF"].includes(opts.status) ? "ON_TRIP" : "AVAILABLE" },
      });
    }

    return trip;
  }

  // 100 trips distributed across statuses
  const plan: { status: Parameters<typeof createTripWithHistory>[0]["status"]; count: number; delayed?: boolean; assign?: boolean }[] = [
    { status: "DRAFT", count: 10, assign: false },
    { status: "PENDING_ACCEPTANCE", count: 8, assign: true },
    { status: "ACCEPTED", count: 6, assign: true },
    { status: "TO_PICKUP", count: 8, assign: true },
    { status: "LOADED", count: 6, assign: true },
    { status: "TO_DROPOFF", count: 10, assign: true },
    { status: "TO_DROPOFF", count: 6, assign: true, delayed: true },
    { status: "DELIVERED", count: 40, assign: true },
    { status: "CANCELLED", count: 6, assign: false },
  ];

  for (const p of plan) {
    for (let i = 0; i < p.count; i++) {
      await createTripWithHistory({
        status: p.status,
        delayed: p.delayed,
        assignDriverTruck: p.assign ?? false,
      });
    }
  }

  console.log(`   تم إنشاء ${tripCount} رحلة`);

  // -------------------------------------------------------------------
  // Maintenance requests (20)
  // -------------------------------------------------------------------
  console.log("🔧 إنشاء طلبات الصيانة...");
  const faultTypes = [
    "عطل في المحرك",
    "تسريب زيت",
    "أعطال كهربائية",
    "تلف إطارات",
    "أعطال في نظام الفرامل",
    "صيانة دورية",
    "عطل في ناقل الحركة",
    "تكييف لا يعمل",
  ];
  const maintenanceStatuses: ("NEW" | "INSPECTING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED")[] = [
    "NEW",
    "INSPECTING",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
  ];
  const serviceCenters = ["مركز الصيانة المركزي - الرياض", "مركز صيانة الدمام", "ورشة جدة المعتمدة", "مركز صيانة الجبيل"];

  for (let i = 1; i <= 20; i++) {
    const truck = pick(trucks);
    const status = i <= 8 ? "COMPLETED" : pick(maintenanceStatuses);
    const requestNumber = `MNT-${String(i).padStart(6, "0")}`;
    await prisma.maintenanceRequest.create({
      data: {
        requestNumber,
        truckId: truck.id,
        faultType: pick(faultTypes),
        description: `بلاغ عطل تجريبي رقم ${i} للشاحنة ${truck.internalNumber}`,
        priority: pick(["LOW", "MEDIUM", "HIGH", "URGENT"]),
        reportedAt: daysFromNow(-randInt(1, 90)),
        serviceCenter: pick(serviceCenters),
        cost: status === "COMPLETED" ? randInt(300, 8000) : null,
        status,
        nextMaintenanceDate: status === "COMPLETED" ? daysFromNow(randInt(60, 180)) : null,
        odometerAtService: status === "COMPLETED" ? truck.odometerKm : null,
        completedAt: status === "COMPLETED" ? daysFromNow(-randInt(1, 60)) : null,
        createdById: admin.id,
      },
    });
  }

  // -------------------------------------------------------------------
  // Finance: 6 months of revenue & expense history
  // -------------------------------------------------------------------
  console.log("💰 إنشاء البيانات المالية لستة أشهر...");
  const expenseCategories: ("FUEL" | "MAINTENANCE" | "DRIVER_PAYROLL" | "FINES" | "ADMIN" | "OTHER")[] = [
    "FUEL",
    "MAINTENANCE",
    "DRIVER_PAYROLL",
    "FINES",
    "ADMIN",
    "OTHER",
  ];

  for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
    const monthDate = new Date();
    monthDate.setMonth(monthDate.getMonth() - monthOffset);
    monthDate.setDate(15);

    // Extra revenue entries beyond delivered-trip revenue, to build a realistic ~3.2M SAR/month picture.
    for (let i = 0; i < 12; i++) {
      const d = new Date(monthDate);
      d.setDate(randInt(1, 27));
      await prisma.financeTransaction.create({
        data: {
          type: "REVENUE",
          category: "TRIP_REVENUE",
          amount: randInt(15000, 90000),
          description: `إيرادات تشغيلية - ${d.toLocaleDateString("ar-SA")}`,
          date: d,
          customerId: pick(customers).id,
          isPaid: rand() > 0.2,
          dueDate: d,
          createdById: admin.id,
        },
      });
    }

    for (let i = 0; i < 18; i++) {
      const d = new Date(monthDate);
      d.setDate(randInt(1, 27));
      const category = pick(expenseCategories);
      const amountRange: Record<string, [number, number]> = {
        FUEL: [40000, 120000],
        MAINTENANCE: [10000, 60000],
        DRIVER_PAYROLL: [80000, 250000],
        FINES: [500, 8000],
        ADMIN: [5000, 30000],
        OTHER: [1000, 15000],
      };
      const [min, max] = amountRange[category];
      await prisma.financeTransaction.create({
        data: {
          type: "EXPENSE",
          category,
          amount: randInt(min, max),
          description: `مصروف ${category} - ${d.toLocaleDateString("ar-SA")}`,
          date: d,
          truckId: category === "FUEL" || category === "MAINTENANCE" ? pick(trucks).id : null,
          driverId: category === "DRIVER_PAYROLL" || category === "FINES" ? pick(drivers).id : null,
          isPaid: true,
          createdById: admin.id,
        },
      });
    }
  }

  // -------------------------------------------------------------------
  // Alerts (initial generation) + a manual activity log entry
  // -------------------------------------------------------------------
  console.log("🔔 توليد التنبيهات...");
  const { generateSystemAlerts } = await import("../src/lib/alerts-generator");
  await generateSystemAlerts();

  await prisma.activityLog.create({
    data: {
      userId: admin.id,
      userName: admin.name,
      action: "SEED",
      entityType: "System",
      description: "تم تجهيز البيانات التجريبية الأولية للنظام",
    },
  });

  console.log("✅ اكتملت عملية إدخال البيانات التجريبية بنجاح");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
