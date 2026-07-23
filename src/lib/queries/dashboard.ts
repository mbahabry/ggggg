import { prisma } from "@/lib/prisma";
import { computeIsDelayed, NON_TERMINAL_TRIP_STATUSES } from "@/lib/business/trip-rules";
import { calculateFinancials } from "@/lib/business/finance-rules";
import type { TripStatus } from "@/generated/prisma/client";

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

const MONTH_LABELS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

export async function getDashboardData() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    truckGroups,
    driverGroups,
    tripsTodayCount,
    activeTripsForDelay,
    monthTransactions,
    sixMonthTransactions,
    tripStatusGroups,
    expiringDocsAlertCount,
    latestTrips,
  ] = await Promise.all([
    prisma.truck.groupBy({ by: ["status"], _count: true }),
    prisma.driver.groupBy({ by: ["status"], _count: true }),
    prisma.trip.count({ where: { pickupDateTime: { gte: startOfToday, lt: endOfToday } } }),
    prisma.trip.findMany({
      where: { status: { in: NON_TERMINAL_TRIP_STATUSES } },
      select: { id: true, status: true, expectedDeliveryDate: true },
    }),
    prisma.financeTransaction.findMany({
      where: { date: { gte: startOfMonth } },
      select: { type: true, amount: true },
    }),
    prisma.financeTransaction.findMany({
      where: { date: { gte: sixMonthsAgo } },
      select: { type: true, amount: true, date: true },
    }),
    prisma.trip.groupBy({ by: ["status"], _count: true }),
    prisma.alert.count({
      where: {
        isResolved: false,
        type: { in: ["DRIVER_LICENSE_EXPIRY", "TRUCK_FORM_EXPIRY", "TRUCK_INSURANCE_EXPIRY", "TRUCK_INSPECTION_EXPIRY"] },
      },
    }),
    prisma.trip.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { customer: true, driver: true, truck: true },
    }),
  ]);

  const truckCountByStatus = Object.fromEntries(truckGroups.map((g) => [g.status, g._count]));
  const driverCountByStatus = Object.fromEntries(driverGroups.map((g) => [g.status, g._count]));
  const truckTotal = truckGroups.reduce((s, g) => s + g._count, 0);
  const driverTotal = driverGroups.reduce((s, g) => s + g._count, 0);

  const delayedTripsCount = activeTripsForDelay.filter(computeIsDelayed).length;

  const monthFinancials = calculateFinancials(
    monthTransactions.map((t) => ({ type: t.type, amount: Number(t.amount) }))
  );

  const buckets = new Map<string, { revenue: number; expense: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.set(monthKey(d), { revenue: 0, expense: 0 });
  }
  for (const t of sixMonthTransactions) {
    const key = monthKey(t.date);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    if (t.type === "REVENUE") bucket.revenue += Number(t.amount);
    else bucket.expense += Number(t.amount);
  }
  const revenueChartData = [...buckets.entries()].map(([key, val]) => {
    const [, month] = key.split("-");
    return {
      month: MONTH_LABELS[Number(month) - 1],
      revenue: Math.round(val.revenue),
      expense: Math.round(val.expense),
    };
  });

  const tripStatusData = tripStatusGroups.map((g) => ({
    status: g.status as TripStatus,
    count: g._count,
  }));

  return {
    truck: {
      total: truckTotal,
      available: truckCountByStatus["AVAILABLE"] ?? 0,
      onTrip: truckCountByStatus["ON_TRIP"] ?? 0,
      maintenance: truckCountByStatus["MAINTENANCE"] ?? 0,
      stopped: truckCountByStatus["STOPPED"] ?? 0,
    },
    driver: {
      total: driverTotal,
      available: driverCountByStatus["AVAILABLE"] ?? 0,
      onTrip: driverCountByStatus["ON_TRIP"] ?? 0,
      leave: driverCountByStatus["LEAVE"] ?? 0,
      suspended: driverCountByStatus["SUSPENDED"] ?? 0,
    },
    tripsToday: tripsTodayCount,
    delayedTrips: delayedTripsCount,
    monthRevenue: monthFinancials.revenue,
    monthExpense: monthFinancials.expense,
    netProfit: monthFinancials.net,
    expiringDocsCount: expiringDocsAlertCount,
    revenueChartData,
    tripStatusData,
    latestTrips,
  };
}
