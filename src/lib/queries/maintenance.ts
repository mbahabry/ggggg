import { prisma } from "@/lib/prisma";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import type { Prisma, MaintenanceStatus } from "@/generated/prisma/client";

export async function getMaintenanceList(filters: {
  q?: string;
  status?: MaintenanceStatus;
  page: number;
}) {
  const clauses: Prisma.MaintenanceRequestWhereInput[] = [];
  if (filters.q) {
    clauses.push({
      OR: [
        { requestNumber: { contains: filters.q, mode: "insensitive" } },
        { truck: { internalNumber: { contains: filters.q, mode: "insensitive" } } },
        { faultType: { contains: filters.q, mode: "insensitive" } },
      ],
    });
  }
  if (filters.status) clauses.push({ status: filters.status });

  const where: Prisma.MaintenanceRequestWhereInput = clauses.length ? { AND: clauses } : {};
  const page = filters.page;

  const [total, requests] = await Promise.all([
    prisma.maintenanceRequest.count({ where }),
    prisma.maintenanceRequest.findMany({
      where,
      include: { truck: true, reportedByDriver: true },
      orderBy: { reportedAt: "desc" },
      skip: (page - 1) * DEFAULT_PAGE_SIZE,
      take: DEFAULT_PAGE_SIZE,
    }),
  ]);

  return { requests, total, totalPages: Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE)) };
}
