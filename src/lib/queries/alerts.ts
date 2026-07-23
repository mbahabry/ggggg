import { prisma } from "@/lib/prisma";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import type { Prisma, AlertSeverity } from "@/generated/prisma/client";

export async function getAlertsList(filters: { severity?: AlertSeverity; resolved?: boolean; page: number }) {
  const clauses: Prisma.AlertWhereInput[] = [];
  if (filters.severity) clauses.push({ severity: filters.severity });
  clauses.push({ isResolved: filters.resolved ?? false });

  const where: Prisma.AlertWhereInput = { AND: clauses };
  const page = filters.page;

  const [total, alerts, counts] = await Promise.all([
    prisma.alert.count({ where }),
    prisma.alert.findMany({
      where,
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * DEFAULT_PAGE_SIZE,
      take: DEFAULT_PAGE_SIZE,
    }),
    prisma.alert.groupBy({ by: ["severity"], where: { isResolved: false }, _count: true }),
  ]);

  const countMap = Object.fromEntries(counts.map((c) => [c.severity, c._count]));

  return {
    alerts,
    total,
    totalPages: Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE)),
    unresolvedCounts: {
      critical: countMap["CRITICAL"] ?? 0,
      warning: countMap["WARNING"] ?? 0,
      info: countMap["INFO"] ?? 0,
    },
  };
}
