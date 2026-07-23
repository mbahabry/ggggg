"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateSystemAlerts } from "@/lib/alerts-generator";
import { ok, fail, type ActionResult } from "@/lib/action-result";

export async function refreshAlertsAction(): Promise<ActionResult<undefined>> {
  const session = await auth();
  if (!session?.user) return fail("يجب تسجيل الدخول");

  await generateSystemAlerts();
  revalidatePath("/alerts");
  revalidatePath("/");
  return ok(undefined);
}

export async function markAlertReadAction(id: string): Promise<ActionResult<undefined>> {
  const session = await auth();
  if (!session?.user) return fail("يجب تسجيل الدخول");

  await prisma.alert.update({ where: { id }, data: { isRead: true } });
  revalidatePath("/alerts");
  return ok(undefined);
}

export async function markAlertResolvedAction(id: string): Promise<ActionResult<undefined>> {
  const session = await auth();
  if (!session?.user) return fail("يجب تسجيل الدخول");

  await prisma.alert.update({ where: { id }, data: { isResolved: true, isRead: true } });
  revalidatePath("/alerts");
  revalidatePath("/");
  return ok(undefined);
}
