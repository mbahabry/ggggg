import { prisma } from "@/lib/prisma";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import type { Prisma, DriverStatus } from "@/generated/prisma/client";

export async function getDriversList(filters: { q?: string; status?: DriverStatus; page: number }) {
  const clauses: Prisma.DriverWhereInput[] = [];
  if (filters.q) {
    clauses.push({
      OR: [
        { name: { contains: filters.q, mode: "insensitive" } },
        { phone: { contains: filters.q, mode: "insensitive" } },
        { licenseNumber: { contains: filters.q, mode: "insensitive" } },
      ],
    });
  }
  if (filters.status) clauses.push({ status: filters.status });

  const where: Prisma.DriverWhereInput = clauses.length ? { AND: clauses } : {};
  const page = filters.page;

  const [total, drivers, tripCounts, revenueSums] = await Promise.all([
    prisma.driver.count({ where }),
    prisma.driver.findMany({
      where,
      include: { truck: true },
      orderBy: { name: "asc" },
      skip: (page - 1) * DEFAULT_PAGE_SIZE,
      take: DEFAULT_PAGE_SIZE,
    }),
    prisma.trip.groupBy({ by: ["driverId"], _count: true, where: { driverId: { not: null } } }),
    prisma.financeTransaction.groupBy({
      by: ["driverId"],
      _sum: { amount: true },
      where: { driverId: { not: null }, type: "REVENUE" },
    }),
  ]);

  const tripCountMap = new Map(tripCounts.map((t) => [t.driverId, t._count]));
  const revenueMap = new Map(revenueSums.map((r) => [r.driverId, Number(r._sum.amount ?? 0)]));

  const driversWithStats = drivers.map((d) => ({
    ...d,
    tripsCount: tripCountMap.get(d.id) ?? 0,
    totalRevenue: revenueMap.get(d.id) ?? 0,
  }));

  return {
    drivers: driversWithStats,
    total,
    totalPages: Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE)),
  };
}

export async function getDriverDetail(id: string) {
  const driver = await prisma.driver.findUnique({
    where: { id },
    include: {
      truck: true,
      trips: { orderBy: { createdAt: "desc" }, take: 15, include: { customer: true } },
    },
  });
  if (!driver) return null;

  const [tripsCount, revenueSum] = await Promise.all([
    prisma.trip.count({ where: { driverId: id } }),
    prisma.financeTransaction.aggregate({
      where: { driverId: id, type: "REVENUE" },
      _sum: { amount: true },
    }),
  ]);

  return {
    ...driver,
    tripsCount,
    totalRevenue: Number(revenueSum._sum.amount ?? 0),
  };
}
