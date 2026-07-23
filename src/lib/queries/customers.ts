import { prisma } from "@/lib/prisma";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import type { Prisma } from "@/generated/prisma/client";

export async function getCustomersList(filters: { q?: string; page: number }) {
  const where: Prisma.CustomerWhereInput = filters.q
    ? {
        OR: [
          { name: { contains: filters.q, mode: "insensitive" } },
          { phone: { contains: filters.q, mode: "insensitive" } },
        ],
      }
    : {};
  const page = filters.page;

  const [total, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * DEFAULT_PAGE_SIZE,
      take: DEFAULT_PAGE_SIZE,
    }),
  ]);

  const customerIds = customers.map((c) => c.id);
  const [tripCounts, revenueSums, paidSums] = await Promise.all([
    prisma.trip.groupBy({ by: ["customerId"], _count: true, where: { customerId: { in: customerIds } } }),
    prisma.financeTransaction.groupBy({
      by: ["customerId"],
      _sum: { amount: true },
      where: { customerId: { in: customerIds }, type: "REVENUE" },
    }),
    prisma.financeTransaction.groupBy({
      by: ["customerId"],
      _sum: { amount: true },
      where: { customerId: { in: customerIds }, type: "REVENUE", isPaid: false },
    }),
  ]);

  const tripCountMap = new Map(tripCounts.map((t) => [t.customerId, t._count]));
  const revenueMap = new Map(revenueSums.map((r) => [r.customerId, Number(r._sum.amount ?? 0)]));
  const outstandingMap = new Map(paidSums.map((r) => [r.customerId, Number(r._sum.amount ?? 0)]));

  const customersWithStats = customers.map((c) => ({
    ...c,
    tripsCount: tripCountMap.get(c.id) ?? 0,
    totalDealsValue: revenueMap.get(c.id) ?? 0,
    outstandingBalance: outstandingMap.get(c.id) ?? 0,
  }));

  return {
    customers: customersWithStats,
    total,
    totalPages: Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE)),
  };
}
