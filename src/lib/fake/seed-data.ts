import bcrypt from "bcryptjs";
import { d } from "./decimal";
import type { Db, Row } from "./engine";

const CITIES = ["الرياض", "جدة", "الدمام", "بريدة", "المدينة المنورة", "مكة المكرمة", "الجبيل", "ينبع", "الخبر", "تبوك"];
const FIRST_NAMES = ["محمد", "أحمد", "عبدالله", "خالد", "سعد", "فهد", "عبدالعزيز", "ناصر", "تركي", "سلطان", "بندر", "ماجد", "فيصل", "سامي", "وليد", "ياسر", "عمر", "إبراهيم"];
const LAST_NAMES = ["القحطاني", "الغامدي", "الحربي", "العتيبي", "الدوسري", "الشهري", "الزهراني", "المطيري", "السبيعي", "الرشيدي", "البقمي", "العنزي", "الشمري", "الجهني"];
const NATIONALITIES = ["سعودي", "سعودي", "سعودي", "سعودي", "مصري", "باكستاني", "بنغلاديشي", "يمني"];
const TRUCK_TYPES = ["مسطحة", "صندوق مغلق", "ثلاجة/براد", "قلاب", "ستائر جانبية"];
const TRUCK_MODELS = ["مرسيدس أكتروس", "فولفو FH", "مان TGX", "سكانيا R450", "ايسوزو FVR", "هينو 700"];
const CARGO_TYPES = ["مواد غذائية", "مواد بناء", "حديد وصلب", "أجهزة كهربائية", "مواد بتروكيماوية", "أثاث منزلي ومكتبي"];
const CUSTOMER_NAMES = [
  "شركة ألفا للصناعات الغذائية",
  "مصنع الرياض للمواد الغذائية",
  "شركة البحر الأحمر للتجارة",
  "مؤسسة الخليج للنقل والتوريد",
  "شركة نجد للاستثمار الصناعي",
  "مجموعة تبوك التجارية",
  "شركة الواحة للمقاولات العامة",
  "مصانع الجبيل للبتروكيماويات",
];
const FAULT_TYPES = ["عطل في المحرك", "تسريب زيت", "أعطال كهربائية", "تلف إطارات", "أعطال في نظام الفرامل", "صيانة دورية"];

let seedValue = 7;
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
  const dt = new Date();
  dt.setDate(dt.getDate() + days);
  dt.setHours(randInt(6, 20), randInt(0, 59), 0, 0);
  return dt;
}
function id(prefix: string, i: number): string {
  return `${prefix}-${String(i).padStart(4, "0")}`;
}

export function buildFakeDb(): Db {
  const db: Db = {
    user: [],
    truck: [],
    driver: [],
    customer: [],
    trip: [],
    tripStatusHistory: [],
    maintenanceRequest: [],
    financeTransaction: [],
    alert: [],
    activityLog: [],
  };

  const passwordHash = bcrypt.hashSync("Passw0rd!", 10);

  const admin: Row = {
    id: id("usr", 1),
    name: "خالد الإدارة",
    email: "admin@fleet.sa",
    passwordHash,
    role: "ADMIN",
    phone: "0500000001",
    isActive: true,
    createdAt: daysFromNow(-90),
    updatedAt: daysFromNow(-90),
  };
  const opsManager: Row = {
    id: id("usr", 2),
    name: "فهد العتيبي",
    email: "ops@fleet.sa",
    passwordHash,
    role: "OPS_MANAGER",
    phone: "0500000002",
    isActive: true,
    createdAt: daysFromNow(-90),
    updatedAt: daysFromNow(-90),
  };
  db.user.push(
    admin,
    opsManager,
    {
      id: id("usr", 3),
      name: "سارة المحاسبة",
      email: "accountant@fleet.sa",
      passwordHash,
      role: "ACCOUNTANT",
      phone: "0500000003",
      isActive: true,
      createdAt: daysFromNow(-90),
      updatedAt: daysFromNow(-90),
    },
    {
      id: id("usr", 4),
      name: "ماجد الصيانة",
      email: "maintenance@fleet.sa",
      passwordHash,
      role: "MAINTENANCE",
      phone: "0500000004",
      isActive: true,
      createdAt: daysFromNow(-90),
      updatedAt: daysFromNow(-90),
    }
  );

  // Trucks
  const TRUCK_COUNT = 24;
  for (let i = 1; i <= TRUCK_COUNT; i++) {
    let status: string = "AVAILABLE";
    if (i % 8 === 0) status = "MAINTENANCE";
    else if (i % 15 === 0) status = "STOPPED";

    let formExpiry = daysFromNow(randInt(60, 400));
    let insuranceExpiry = daysFromNow(randInt(60, 400));
    let inspectionExpiry = daysFromNow(randInt(60, 400));
    if (i % 6 === 0) formExpiry = daysFromNow(randInt(-10, 5));
    if (i % 9 === 0) insuranceExpiry = daysFromNow(randInt(-5, 12));

    db.truck.push({
      id: id("trk", i),
      internalNumber: `TRK-${String(i).padStart(3, "0")}`,
      plateNumber: `${randInt(1000, 9999)} ${pick(["أ ب ج", "د ه و", "ح ط ي"])}`,
      truckType: pick(TRUCK_TYPES),
      model: pick(TRUCK_MODELS),
      year: randInt(2015, 2024),
      capacityTons: d(randInt(10, 40)),
      chassisNumber: `CHS${100000 + i}`,
      odometerKm: randInt(20000, 480000),
      status,
      formExpiry,
      insuranceExpiry,
      inspectionExpiry,
      imageUrl: null,
      notes: null,
      createdAt: daysFromNow(-90),
      updatedAt: daysFromNow(-90),
    });
  }

  // Drivers
  const DRIVER_COUNT = 20;
  const usedNames = new Set<string>();
  let truckCursor = 0;
  const driverIds: string[] = [];
  for (let i = 1; i <= DRIVER_COUNT; i++) {
    let name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    while (usedNames.has(name)) name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    usedNames.add(name);

    let status: string = "AVAILABLE";
    if (i % 7 === 0) status = "LEAVE";
    else if (i % 13 === 0) status = "SUSPENDED";

    let licenseExpiry = daysFromNow(randInt(60, 500));
    if (i % 5 === 0) licenseExpiry = daysFromNow(randInt(-8, 10));

    let truckId: string | null = null;
    if (truckCursor < db.truck.length && i % 5 !== 0) {
      truckId = db.truck[truckCursor].id;
      truckCursor++;
    }

    const driverId = id("drv", i);
    driverIds.push(driverId);
    db.driver.push({
      id: driverId,
      name,
      phone: `05${randInt(10000000, 99999999)}`,
      nationalId: `1${100000000 + i * 137}`,
      nationality: pick(NATIONALITIES),
      licenseNumber: `DL${500000 + i}`,
      licenseExpiry,
      status,
      rating: d(Math.round((3 + rand() * 2) * 100) / 100),
      violationsCount: randInt(0, 4),
      notes: null,
      truckId,
      userId: null,
      createdAt: daysFromNow(-90),
      updatedAt: daysFromNow(-90),
    });
  }

  // Link the demo driver login to the first driver
  db.user.push({
    id: id("usr", 5),
    name: db.driver[0].name,
    email: "driver@fleet.sa",
    passwordHash,
    role: "DRIVER",
    phone: db.driver[0].phone,
    isActive: true,
    createdAt: daysFromNow(-90),
    updatedAt: daysFromNow(-90),
  });
  db.driver[0].userId = id("usr", 5);

  // Customers
  CUSTOMER_NAMES.forEach((name, i) => {
    db.customer.push({
      id: id("cus", i + 1),
      name,
      commercialRegister: `${randInt(1010000000, 1010999999)}`,
      taxNumber: `3${randInt(10000000000, 99999999999)}`,
      contactName: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      phone: `01${randInt(1000000, 9999999)}`,
      email: `contact${i + 1}@client-mail.sa`,
      address: `${pick(CITIES)} - حي الصناعية`,
      createdAt: daysFromNow(-90),
      updatedAt: daysFromNow(-90),
    });
  });

  // Trips
  const availableDrivers = db.driver.filter((dr) => dr.status === "AVAILABLE");
  const availableTrucks = db.truck.filter((t) => t.status === "AVAILABLE");
  const usedDriverIds = new Set<string>();
  const usedTruckIds = new Set<string>();
  let tripCount = 0;

  function createTrip(status: string, delayed = false, assign = false) {
    tripCount++;
    const tripNumber = `TRP-${String(tripCount).padStart(6, "0")}`;
    const customer = pick(db.customer);
    const origin = pick(CITIES);
    let destination = pick(CITIES);
    while (destination === origin) destination = pick(CITIES);

    const pickupDateTime = daysFromNow(status === "DRAFT" ? randInt(1, 10) : randInt(-20, 5));
    let expectedDeliveryDate: Date;
    if (delayed) {
      expectedDeliveryDate = daysFromNow(randInt(-8, -1));
    } else {
      const dt = new Date(pickupDateTime);
      dt.setDate(dt.getDate() + randInt(1, 4));
      expectedDeliveryDate = dt;
    }

    let driverId: string | null = null;
    let truckId: string | null = null;
    if (assign) {
      const driver = availableDrivers.find((dr) => !usedDriverIds.has(dr.id));
      const truck = availableTrucks.find((t) => !usedTruckIds.has(t.id));
      if (driver && truck) {
        driverId = driver.id;
        truckId = truck.id;
        usedDriverIds.add(driver.id);
        usedTruckIds.add(truck.id);
      }
    }

    const value = randInt(1500, 25000);
    const actualStartAt = ["TO_PICKUP", "LOADED", "TO_DROPOFF", "DELIVERED"].includes(status) ? pickupDateTime : null;
    const actualEndAt = status === "DELIVERED" ? daysFromNow(-randInt(1, 5)) : null;

    const tripId = id("trp", tripCount);
    db.trip.push({
      id: tripId,
      tripNumber,
      customerId: customer.id,
      originCity: origin,
      originAddress: `${origin} - المنطقة الصناعية`,
      destinationCity: destination,
      destinationAddress: `${destination} - المنطقة الصناعية`,
      pickupDateTime,
      expectedDeliveryDate,
      cargoType: pick(CARGO_TYPES),
      cargoWeightTons: d(randInt(3, 35)),
      value: d(value),
      driverId,
      truckId,
      status,
      notes: delayed ? "تأخر بسبب ازدحام مروري وأحوال جوية" : null,
      proofOfDeliveryUrl: null,
      actualStartAt,
      actualEndAt,
      createdById: opsManager.id,
      createdAt: daysFromNow(-randInt(1, 60)),
      updatedAt: daysFromNow(-1),
    });

    db.tripStatusHistory.push({
      id: id("ash", db.tripStatusHistory.length + 1),
      tripId,
      fromStatus: null,
      toStatus: status,
      changedById: opsManager.id,
      changedByDriverId: null,
      note: "تم إنشاء الرحلة (بيانات تجريبية)",
      changedAt: daysFromNow(-randInt(1, 60)),
    });

    if (status === "DELIVERED") {
      db.financeTransaction.push({
        id: id("fin", db.financeTransaction.length + 1),
        type: "REVENUE",
        category: "TRIP_REVENUE",
        amount: d(value),
        currency: "SAR",
        description: `إيراد الرحلة ${tripNumber}`,
        date: actualEndAt ?? new Date(),
        customerId: customer.id,
        truckId,
        driverId,
        tripId,
        isPaid: rand() > 0.35,
        dueDate: daysFromNow(randInt(-10, 20)),
        createdById: admin.id,
        createdAt: daysFromNow(-1),
        updatedAt: daysFromNow(-1),
      });
    }

    if (driverId && truckId) {
      const onTrip = ["TO_PICKUP", "LOADED", "TO_DROPOFF"].includes(status);
      const truckRow = db.truck.find((t) => t.id === truckId)!;
      const driverRow = db.driver.find((dr) => dr.id === driverId)!;
      truckRow.status = onTrip ? "ON_TRIP" : "AVAILABLE";
      driverRow.status = onTrip ? "ON_TRIP" : "AVAILABLE";
    }
  }

  const plan: [string, number, boolean, boolean?][] = [
    ["DRAFT", 5, false],
    ["PENDING_ACCEPTANCE", 4, true],
    ["ACCEPTED", 3, true],
    ["TO_PICKUP", 4, true],
    ["LOADED", 3, true],
    ["TO_DROPOFF", 4, true],
    ["TO_DROPOFF", 3, true, true],
    ["DELIVERED", 18, true],
    ["CANCELLED", 3, false],
  ];
  for (const [status, cnt, assign, delayed] of plan) {
    for (let i = 0; i < cnt; i++) createTrip(status, delayed, assign);
  }

  // Maintenance requests
  const SERVICE_CENTERS = ["مركز الصيانة المركزي - الرياض", "مركز صيانة الدمام", "ورشة جدة المعتمدة"];
  const MAINT_STATUSES = ["NEW", "INSPECTING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
  for (let i = 1; i <= 12; i++) {
    const truck = pick(db.truck);
    const status = i <= 5 ? "COMPLETED" : pick(MAINT_STATUSES);
    db.maintenanceRequest.push({
      id: id("mnt", i),
      requestNumber: `MNT-${String(i).padStart(6, "0")}`,
      truckId: truck.id,
      faultType: pick(FAULT_TYPES),
      description: `بلاغ عطل تجريبي رقم ${i} للشاحنة ${truck.internalNumber}`,
      priority: pick(["LOW", "MEDIUM", "HIGH", "URGENT"]),
      reportedAt: daysFromNow(-randInt(1, 90)),
      reportedByDriverId: null,
      serviceCenter: pick(SERVICE_CENTERS),
      cost: status === "COMPLETED" ? d(randInt(300, 8000)) : null,
      status,
      nextMaintenanceDate: status === "COMPLETED" ? daysFromNow(randInt(60, 180)) : null,
      odometerAtService: status === "COMPLETED" ? truck.odometerKm : null,
      completedAt: status === "COMPLETED" ? daysFromNow(-randInt(1, 60)) : null,
      createdById: admin.id,
      createdAt: daysFromNow(-randInt(1, 90)),
      updatedAt: daysFromNow(-1),
    });
  }

  // Finance: 3 months of extra revenue/expense
  const EXPENSE_CATEGORIES = ["FUEL", "MAINTENANCE", "DRIVER_PAYROLL", "FINES", "ADMIN", "OTHER"];
  const AMOUNT_RANGE: Record<string, [number, number]> = {
    FUEL: [40000, 120000],
    MAINTENANCE: [10000, 60000],
    DRIVER_PAYROLL: [80000, 250000],
    FINES: [500, 8000],
    ADMIN: [5000, 30000],
    OTHER: [1000, 15000],
  };
  for (let m = 2; m >= 0; m--) {
    const monthDate = new Date();
    monthDate.setMonth(monthDate.getMonth() - m);
    monthDate.setDate(15);

    for (let i = 0; i < 8; i++) {
      const dt = new Date(monthDate);
      dt.setDate(randInt(1, 27));
      db.financeTransaction.push({
        id: id("fin", db.financeTransaction.length + 1),
        type: "REVENUE",
        category: "TRIP_REVENUE",
        amount: d(randInt(15000, 90000)),
        currency: "SAR",
        description: `إيرادات تشغيلية - ${dt.toLocaleDateString("ar-SA")}`,
        date: dt,
        customerId: pick(db.customer).id,
        truckId: null,
        driverId: null,
        tripId: null,
        isPaid: rand() > 0.2,
        dueDate: dt,
        createdById: admin.id,
        createdAt: dt,
        updatedAt: dt,
      });
    }
    for (let i = 0; i < 10; i++) {
      const dt = new Date(monthDate);
      dt.setDate(randInt(1, 27));
      const category = pick(EXPENSE_CATEGORIES);
      const [min, max] = AMOUNT_RANGE[category];
      db.financeTransaction.push({
        id: id("fin", db.financeTransaction.length + 1),
        type: "EXPENSE",
        category,
        amount: d(randInt(min, max)),
        currency: "SAR",
        description: `مصروف ${category} - ${dt.toLocaleDateString("ar-SA")}`,
        date: dt,
        customerId: null,
        truckId: category === "FUEL" || category === "MAINTENANCE" ? pick(db.truck).id : null,
        driverId: category === "DRIVER_PAYROLL" || category === "FINES" ? pick(db.driver).id : null,
        tripId: null,
        isPaid: true,
        dueDate: null,
        createdById: admin.id,
        createdAt: dt,
        updatedAt: dt,
      });
    }
  }

  // A handful of alerts so the dashboard/alerts page aren't empty on first load
  const expiringTruck = db.truck.find((t) => t.formExpiry < daysFromNow(30)) ?? db.truck[0];
  const expiringDriver = db.driver.find((dr) => dr.licenseExpiry < daysFromNow(30)) ?? db.driver[0];
  const delayedTrip = db.trip.find((t) => t.notes === "تأخر بسبب ازدحام مروري وأحوال جوية");
  const maintTruck = db.truck.find((t) => t.status === "MAINTENANCE");

  let alertCount = 0;
  function pushAlert(row: Row) {
    alertCount++;
    db.alert.push({ id: id("alt", alertCount), isRead: false, isResolved: false, createdAt: new Date(), updatedAt: new Date(), ...row });
  }

  pushAlert({
    type: "TRUCK_FORM_EXPIRY",
    severity: "WARNING",
    title: `استمارة الشاحنة ${expiringTruck.internalNumber} قاربت على الانتهاء`,
    message: `تحقق من تجديد استمارة الشاحنة ${expiringTruck.internalNumber} قريبا`,
    relatedTruckId: expiringTruck.id,
    relatedDriverId: null,
    relatedTripId: null,
    relatedFinanceId: null,
    dueDate: expiringTruck.formExpiry,
  });
  pushAlert({
    type: "DRIVER_LICENSE_EXPIRY",
    severity: "WARNING",
    title: `رخصة القيادة للسائق ${expiringDriver.name} قاربت على الانتهاء`,
    message: `تحقق من تجديد رخصة قيادة ${expiringDriver.name} قريبا`,
    relatedTruckId: null,
    relatedDriverId: expiringDriver.id,
    relatedTripId: null,
    relatedFinanceId: null,
    dueDate: expiringDriver.licenseExpiry,
  });
  if (delayedTrip) {
    pushAlert({
      type: "TRIP_DELAYED",
      severity: "CRITICAL",
      title: `الرحلة ${delayedTrip.tripNumber} متأخرة`,
      message: `تجاوزت الرحلة ${delayedTrip.tripNumber} موعد التسليم المتوقع`,
      relatedTruckId: null,
      relatedDriverId: null,
      relatedTripId: delayedTrip.id,
      relatedFinanceId: null,
      dueDate: delayedTrip.expectedDeliveryDate,
    });
  }
  if (maintTruck) {
    pushAlert({
      type: "TRUCK_MAINTENANCE_NEEDED",
      severity: "WARNING",
      title: `الشاحنة ${maintTruck.internalNumber} تحت الصيانة`,
      message: `الشاحنة ${maintTruck.internalNumber} حاليا تحت الصيانة وغير متاحة للرحلات`,
      relatedTruckId: maintTruck.id,
      relatedDriverId: null,
      relatedTripId: null,
      relatedFinanceId: null,
      dueDate: null,
    });
  }

  db.activityLog.push({
    id: id("act", 1),
    userId: admin.id,
    userName: admin.name,
    action: "SEED",
    entityType: "System",
    entityId: null,
    oldValue: null,
    newValue: null,
    description: "تم تجهيز بيانات تجريبية (وضع بدون قاعدة بيانات)",
    createdAt: daysFromNow(-1),
  });

  return db;
}
