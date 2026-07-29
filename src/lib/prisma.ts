import { PrismaClient } from "@/generated/prisma/client";
import { mockPrisma } from "@/lib/fake/mock-prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const useFake = !process.env.DATABASE_URL;

export const prisma: PrismaClient = useFake
  ? (mockPrisma as unknown as PrismaClient)
  : globalForPrisma.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });

if (!useFake && process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
