"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-log";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { financeSchema, type FinanceInput } from "@/lib/validations/finance";

export async function createFinanceAction(
  input: FinanceInput
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "manageFinance")) {
    return fail("ليس لديك صلاحية لإدخال حركة مالية");
  }

  const parsed = financeSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "بيانات غير صالحة");
  const data = parsed.data;

  try {
    const transaction = await prisma.financeTransaction.create({
      data: {
        type: data.type,
        category: data.category,
        amount: data.amount,
        description: data.description,
        date: new Date(data.date),
        customerId: data.customerId || null,
        truckId: data.truckId || null,
        driverId: data.driverId || null,
        tripId: data.tripId || null,
        isPaid: data.isPaid,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        createdById: session.user.id,
      },
    });

    await logActivity({
      userId: session.user.id,
      userName: session.user.name,
      action: "CREATE",
      entityType: "FinanceTransaction",
      entityId: transaction.id,
      newValue: { type: data.type, category: data.category, amount: data.amount },
      description: `إضافة حركة مالية: ${data.description} (${data.amount} ر.س)`,
    });

    revalidatePath("/finance");
    revalidatePath("/reports");
    revalidatePath("/");
    return ok({ id: transaction.id });
  } catch {
    return fail("حدث خطأ أثناء إضافة الحركة المالية");
  }
}

export async function markFinanceTransactionPaidAction(
  id: string,
  isPaid: boolean
): Promise<ActionResult<undefined>> {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "manageFinance")) {
    return fail("ليس لديك صلاحية لتعديل الحركة المالية");
  }

  const existing = await prisma.financeTransaction.findUnique({ where: { id } });
  if (!existing) return fail("الحركة المالية غير موجودة");

  await prisma.financeTransaction.update({ where: { id }, data: { isPaid } });

  await logActivity({
    userId: session.user.id,
    userName: session.user.name,
    action: "UPDATE",
    entityType: "FinanceTransaction",
    entityId: id,
    oldValue: { isPaid: existing.isPaid },
    newValue: { isPaid },
    description: `تحديث حالة السداد للحركة المالية "${existing.description}" إلى ${
      isPaid ? "مدفوعة" : "مستحقة"
    }`,
  });

  revalidatePath("/finance");
  revalidatePath("/reports");
  return ok(undefined);
}
