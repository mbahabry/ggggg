import { prisma } from "@/lib/prisma";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import type { Prisma, TruckStatus } from "@/generated/prisma/client";

export async function getTrucksList(filters: { q?: string; status?: TruckStatus; page: number }) {
  const clauses: Prisma.TruckWhereInput[] = [];
  if (filters.q) {
    clauses.push({
      OR: [
        { internalNumber: { contains: filters.q, mode: "insensitive" } },
        { plateNumber: { contains: filters.q, mode: "insensitive" } },
        { model: { contains: filters.q, mode: "insensitive" } },
      ],
    });
  }
  if (filters.status) clauses.push({ status: filters.status });

  const where: Prisma.TruckWhereInput = clauses.length ? { AND: clauses } : {};
  const page = filters.page;

  const [total, trucks] = await Promise.all([
    prisma.truck.count({ where }),
    prisma.truck.findMany({
      where,
      include: { assignedDriver: true },
      orderBy: { internalNumber: "asc" },
      skip: (page - 1) * DEFAULT_PAGE_SIZE,
      take: DEFAULT_PAGE_SIZE,
    }),
  ]);

  return { trucks, total, totalPages: Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE)) };
}

export async function getTruckDetail(id: string) {
  return prisma.truck.findUnique({
    where: { id },
    include: {
      assignedDriver: true,
      maintenanceRequests: { orderBy: { reportedAt: "desc" } },
      trips: { orderBy: { createdAt: "desc" }, take: 10, include: { customer: true } },
    },
  });
}
