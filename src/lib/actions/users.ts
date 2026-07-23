"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-log";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { userSchema, type UserInput } from "@/lib/validations/user";

export async function createUserAction(input: UserInput): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "manageUsers")) {
    return fail("ليس لديك صلاحية لإضافة مستخدم");
  }

  const parsed = userSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "بيانات غير صالحة");
  const data = parsed.data;

  if (!data.password) return fail("كلمة المرور مطلوبة عند إنشاء مستخدم جديد");

  const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (existing) return fail("البريد الإلكتروني مستخدم بالفعل");

  if (data.role === "DRIVER" && data.driverId) {
    const takenBy = await prisma.driver.findUnique({ where: { id: data.driverId } });
    if (!takenBy) return fail("السائق غير موجود");
    const existingUser = await prisma.user.findUnique({ where: { id: takenBy.userId ?? "" } });
    if (existingUser) return fail("هذا السائق مرتبط بحساب آخر بالفعل");
  }

  try {
    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: data.name,
          email: data.email.toLowerCase(),
          phone: data.phone || null,
          role: data.role,
          passwordHash,
          isActive: data.isActive,
        },
      });

      if (data.role === "DRIVER" && data.driverId) {
        await tx.driver.update({ where: { id: data.driverId }, data: { userId: created.id } });
      }

      await logActivity({
        tx,
        userId: session.user.id,
        userName: session.user.name,
        action: "CREATE",
        entityType: "User",
        entityId: created.id,
        newValue: { name: data.name, email: data.email, role: data.role },
        description: `إضافة مستخدم جديد: ${data.name} (${data.role})`,
      });

      return created;
    });

    revalidatePath("/users");
    return ok({ id: user.id });
  } catch {
    return fail("حدث خطأ أثناء إضافة المستخدم");
  }
}

export async function updateUserAction(
  id: string,
  input: UserInput
): Promise<ActionResult<undefined>> {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "manageUsers")) {
    return fail("ليس لديك صلاحية لتعديل المستخدم");
  }

  const parsed = userSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "بيانات غير صالحة");
  const data = parsed.data;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return fail("المستخدم غير موجود");

  if (data.email.toLowerCase() !== existing.email) {
    const dup = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (dup) return fail("البريد الإلكتروني مستخدم بالفعل");
  }

  try {
    const updateData: Record<string, unknown> = {
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone || null,
      role: data.role,
      isActive: data.isActive,
    };
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    await prisma.user.update({ where: { id }, data: updateData });

    await logActivity({
      userId: session.user.id,
      userName: session.user.name,
      action: "UPDATE",
      entityType: "User",
      entityId: id,
      oldValue: { role: existing.role, isActive: existing.isActive },
      newValue: { role: data.role, isActive: data.isActive },
      description: `تعديل بيانات المستخدم ${data.name}`,
    });

    revalidatePath("/users");
    return ok(undefined);
  } catch {
    return fail("حدث خطأ أثناء تعديل المستخدم");
  }
}

export async function toggleUserActiveAction(id: string, isActive: boolean): Promise<ActionResult<undefined>> {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "manageUsers")) {
    return fail("ليس لديك صلاحية لتعديل المستخدم");
  }
  if (session.user.id === id && !isActive) {
    return fail("لا يمكنك إيقاف حسابك الخاص");
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return fail("المستخدم غير موجود");

  await prisma.user.update({ where: { id }, data: { isActive } });

  await logActivity({
    userId: session.user.id,
    userName: session.user.name,
    action: "UPDATE",
    entityType: "User",
    entityId: id,
    oldValue: { isActive: existing.isActive },
    newValue: { isActive },
    description: `${isActive ? "تفعيل" : "إيقاف"} حساب المستخدم ${existing.name}`,
  });

  revalidatePath("/users");
  return ok(undefined);
}
