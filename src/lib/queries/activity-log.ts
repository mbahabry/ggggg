import { prisma } from "@/lib/prisma";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import type { Prisma } from "@/generated/prisma/client";

export async function getActivityLogList(filters: { q?: string; entityType?: string; page: number }) {
  const clauses: Prisma.ActivityLogWhereInput[] = [];
  if (filters.q) {
    clauses.push({
      OR: [
        { description: { contains: filters.q, mode: "insensitive" } },
        { userName: { contains: filters.q, mode: "insensitive" } },
      ],
    });
  }
  if (filters.entityType) clauses.push({ entityType: filters.entityType });

  const where: Prisma.ActivityLogWhereInput = clauses.length ? { AND: clauses } : {};
  const page = filters.page;

  const [total, logs, entityTypes] = await Promise.all([
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * DEFAULT_PAGE_SIZE,
      take: DEFAULT_PAGE_SIZE,
    }),
    prisma.activityLog.findMany({
      select: { entityType: true },
      distinct: ["entityType"],
    }),
  ]);

  return {
    logs,
    total,
    totalPages: Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE)),
    entityTypes: entityTypes.map((e) => e.entityType),
  };
}
