import { prisma } from "@/lib/prisma";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { calculateFinancials } from "@/lib/business/finance-rules";
import type { Prisma, FinanceType, FinanceCategory } from "@/generated/prisma/client";

export async function getFinanceList(filters: {
  type?: FinanceType;
  category?: FinanceCategory;
  page: number;
}) {
  const clauses: Prisma.FinanceTransactionWhereInput[] = [];
  if (filters.type) clauses.push({ type: filters.type });
  if (filters.category) clauses.push({ category: filters.category });

  const where: Prisma.FinanceTransactionWhereInput = clauses.length ? { AND: clauses } : {};
  const page = filters.page;

  const [total, transactions] = await Promise.all([
    prisma.financeTransaction.count({ where }),
    prisma.financeTransaction.findMany({
      where,
      include: { customer: true, truck: true, driver: true, trip: true },
      orderBy: { date: "desc" },
      skip: (page - 1) * DEFAULT_PAGE_SIZE,
      take: DEFAULT_PAGE_SIZE,
    }),
  ]);

  return { transactions, total, totalPages: Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE)) };
}

export async function getFinanceSummary() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [monthTx, allTimeTx, outstandingSum] = await Promise.all([
    prisma.financeTransaction.findMany({
      where: { date: { gte: startOfMonth } },
      select: { type: true, amount: true },
    }),
    prisma.financeTransaction.findMany({ select: { type: true, amount: true } }),
    prisma.financeTransaction.aggregate({
      where: { type: "REVENUE", isPaid: false },
      _sum: { amount: true },
    }),
  ]);

  const month = calculateFinancials(monthTx.map((t) => ({ type: t.type, amount: Number(t.amount) })));
  const allTime = calculateFinancials(allTimeTx.map((t) => ({ type: t.type, amount: Number(t.amount) })));

  return {
    month,
    allTime,
    outstanding: Number(outstandingSum._sum.amount ?? 0),
  };
}

export async function getReportByCustomer() {
  const customers = await prisma.customer.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const revenue = await prisma.financeTransaction.groupBy({
    by: ["customerId"],
    where: { type: "REVENUE", customerId: { not: null } },
    _sum: { amount: true },
    _count: true,
  });
  const revenueMap = new Map(revenue.map((r) => [r.customerId, r]));

  return customers
    .map((c) => ({
      id: c.id,
      name: c.name,
      totalRevenue: Number(revenueMap.get(c.id)?._sum.amount ?? 0),
      transactionsCount: revenueMap.get(c.id)?._count ?? 0,
    }))
    .filter((c) => c.transactionsCount > 0)
    .sort((a, b) => b.totalRevenue - a.totalRevenue);
}

export async function getReportByTruck() {
  const trucks = await prisma.truck.findMany({
    select: { id: true, internalNumber: true },
    orderBy: { internalNumber: "asc" },
  });
  const [revenue, expense] = await Promise.all([
    prisma.financeTransaction.groupBy({
      by: ["truckId"],
      where: { type: "REVENUE", truckId: { not: null } },
      _sum: { amount: true },
    }),
    prisma.financeTransaction.groupBy({
      by: ["truckId"],
      where: { type: "EXPENSE", truckId: { not: null } },
      _sum: { amount: true },
    }),
  ]);
  const revenueMap = new Map(revenue.map((r) => [r.truckId, Number(r._sum.amount ?? 0)]));
  const expenseMap = new Map(expense.map((r) => [r.truckId, Number(r._sum.amount ?? 0)]));

  return trucks
    .map((t) => {
      const rev = revenueMap.get(t.id) ?? 0;
      const exp = expenseMap.get(t.id) ?? 0;
      return { id: t.id, internalNumber: t.internalNumber, revenue: rev, expense: exp, net: rev - exp };
    })
    .filter((t) => t.revenue > 0 || t.expense > 0)
    .sort((a, b) => b.net - a.net);
}

export async function getReportByDriver() {
  const drivers = await prisma.driver.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const revenue = await prisma.financeTransaction.groupBy({
    by: ["driverId"],
    where: { type: "REVENUE", driverId: { not: null } },
    _sum: { amount: true },
    _count: true,
  });
  const revenueMap = new Map(revenue.map((r) => [r.driverId, r]));

  return drivers
    .map((d) => ({
      id: d.id,
      name: d.name,
      totalRevenue: Number(revenueMap.get(d.id)?._sum.amount ?? 0),
      transactionsCount: revenueMap.get(d.id)?._count ?? 0,
    }))
    .filter((d) => d.transactionsCount > 0)
    .sort((a, b) => b.totalRevenue - a.totalRevenue);
}

export async function getMonthlyReport() {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const transactions = await prisma.financeTransaction.findMany({
    where: { date: { gte: twelveMonthsAgo } },
    select: { type: true, amount: true, date: true },
  });

  const buckets = new Map<string, { revenue: number; expense: number }>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, { revenue: 0, expense: 0 });
  }
  for (const t of transactions) {
    const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, "0")}`;
    const bucket = buckets.get(key);
    if (!bucket) continue;
    if (t.type === "REVENUE") bucket.revenue += Number(t.amount);
    else bucket.expense += Number(t.amount);
  }

  return [...buckets.entries()].map(([month, val]) => ({
    month,
    revenue: Math.round(val.revenue),
    expense: Math.round(val.expense),
    net: Math.round(val.revenue - val.expense),
  }));
}
