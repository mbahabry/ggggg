import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export async function logActivity(params: {
  userId: string | null;
  userName: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValue?: Prisma.InputJsonValue | null;
  newValue?: Prisma.InputJsonValue | null;
  description: string;
  tx?: Prisma.TransactionClient;
}) {
  const client = params.tx ?? prisma;
  await client.activityLog.create({
    data: {
      userId: params.userId,
      userName: params.userName,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      oldValue: params.oldValue ?? undefined,
      newValue: params.newValue ?? undefined,
      description: params.description,
    },
  });
}
