import type { Prisma } from "@/generated/prisma/client";

export async function nextTripNumber(tx: Prisma.TransactionClient): Promise<string> {
  const count = await tx.trip.count();
  return `TRP-${String(count + 1).padStart(6, "0")}`;
}

export async function nextMaintenanceNumber(tx: Prisma.TransactionClient): Promise<string> {
  const count = await tx.maintenanceRequest.count();
  return `MNT-${String(count + 1).padStart(6, "0")}`;
}
