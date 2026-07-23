import { prisma } from "@/lib/prisma";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import type { Prisma, TripStatus } from "@/generated/prisma/client";

export type TripListFilters = {
  q?: string;
  status?: TripStatus;
  city?: string;
  page: number;
};

export async function getTripsList(filters: TripListFilters) {
  const clauses: Prisma.TripWhereInput[] = [];

  if (filters.q) {
    clauses.push({
      OR: [
        { tripNumber: { contains: filters.q, mode: "insensitive" } },
        { customer: { name: { contains: filters.q, mode: "insensitive" } } },
        { originCity: { contains: filters.q, mode: "insensitive" } },
        { destinationCity: { contains: filters.q, mode: "insensitive" } },
      ],
    });
  }
  if (filters.status) {
    clauses.push({ status: filters.status });
  }
  if (filters.city) {
    clauses.push({ OR: [{ originCity: filters.city }, { destinationCity: filters.city }] });
  }

  const where: Prisma.TripWhereInput = clauses.length ? { AND: clauses } : {};

  const page = filters.page;
  const [total, trips] = await Promise.all([
    prisma.trip.count({ where }),
    prisma.trip.findMany({
      where,
      include: { customer: true, driver: true, truck: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * DEFAULT_PAGE_SIZE,
      take: DEFAULT_PAGE_SIZE,
    }),
  ]);

  return { trips, total, totalPages: Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE)) };
}

export async function getTripDetail(id: string) {
  return prisma.trip.findUnique({
    where: { id },
    include: {
      customer: true,
      driver: true,
      truck: true,
      createdBy: true,
      statusHistory: {
        orderBy: { changedAt: "asc" },
        include: { changedBy: true, changedByDriver: true },
      },
      financeTransactions: true,
    },
  });
}

export async function getUnassignedTrips(filters: { city?: string; q?: string }) {
  const where: Prisma.TripWhereInput = {
    status: { in: ["DRAFT"] },
  };
  if (filters.city) {
    where.OR = [{ originCity: filters.city }, { destinationCity: filters.city }];
  }
  if (filters.q) {
    where.tripNumber = { contains: filters.q, mode: "insensitive" };
  }
  return prisma.trip.findMany({
    where,
    include: { customer: true },
    orderBy: { pickupDateTime: "asc" },
  });
}

export async function getAvailableDriversAndTrucks() {
  const [drivers, trucks] = await Promise.all([
    prisma.driver.findMany({
      where: { status: "AVAILABLE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.truck.findMany({
      where: { status: "AVAILABLE" },
      orderBy: { internalNumber: "asc" },
      select: { id: true, internalNumber: true, truckType: true },
    }),
  ]);
  return { drivers, trucks };
}
