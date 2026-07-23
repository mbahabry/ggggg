"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-log";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { customerSchema, type CustomerInput } from "@/lib/validations/customer";

export async function createCustomerAction(
  input: CustomerInput
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "manageCustomers")) {
    return fail("ليس لديك صلاحية لإضافة عميل");
  }

  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "بيانات غير صالحة");
  const data = parsed.data;

  try {
    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        commercialRegister: data.commercialRegister || null,
        taxNumber: data.taxNumber || null,
        contactName: data.contactName || null,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
      },
    });

    await logActivity({
      userId: session.user.id,
      userName: session.user.name,
      action: "CREATE",
      entityType: "Customer",
      entityId: customer.id,
      newValue: { name: data.name },
      description: `إضافة عميل جديد: ${data.name}`,
    });

    revalidatePath("/customers");
    return ok({ id: customer.id });
  } catch {
    return fail("حدث خطأ أثناء إضافة العميل");
  }
}

export async function updateCustomerAction(
  id: string,
  input: CustomerInput
): Promise<ActionResult<undefined>> {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "manageCustomers")) {
    return fail("ليس لديك صلاحية لتعديل بيانات العميل");
  }

  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "بيانات غير صالحة");
  const data = parsed.data;

  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) return fail("العميل غير موجود");

  try {
    await prisma.customer.update({
      where: { id },
      data: {
        name: data.name,
        commercialRegister: data.commercialRegister || null,
        taxNumber: data.taxNumber || null,
        contactName: data.contactName || null,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
      },
    });

    await logActivity({
      userId: session.user.id,
      userName: session.user.name,
      action: "UPDATE",
      entityType: "Customer",
      entityId: id,
      newValue: { name: data.name },
      description: `تعديل بيانات العميل ${data.name}`,
    });

    revalidatePath("/customers");
    return ok(undefined);
  } catch {
    return fail("حدث خطأ أثناء تعديل بيانات العميل");
  }
}
