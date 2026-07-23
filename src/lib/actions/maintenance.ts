"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-log";
import { nextMaintenanceNumber } from "@/lib/sequence";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import {
  maintenanceSchema,
  maintenanceStatusUpdateSchema,
  type MaintenanceInput,
} from "@/lib/validations/maintenance";

export async function createMaintenanceAction(
  input: MaintenanceInput
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) return fail("يجب تسجيل الدخول");

  const isStaff = can(session.user.role, "manageMaintenance");
  const isDriver = session.user.role === "DRIVER";
  if (!isStaff && !isDriver) return fail("ليس لديك صلاحية لإنشاء بلاغ صيانة");

  const parsed = maintenanceSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "بيانات غير صالحة");
  const data = parsed.data;

  const truck = await prisma.truck.findUnique({ where: { id: data.truckId } });
  if (!truck) return fail("الشاحنة غير موجودة");

  try {
    const request = await prisma.$transaction(async (tx) => {
      const requestNumber = await nextMaintenanceNumber(tx);
      const created = await tx.maintenanceRequest.create({
        data: {
          requestNumber,
          truckId: data.truckId,
          faultType: data.faultType,
          description: data.description,
          priority: data.priority,
          serviceCenter: data.serviceCenter || null,
          cost: data.cost ?? null,
          nextMaintenanceDate: data.nextMaintenanceDate ? new Date(data.nextMaintenanceDate) : null,
          odometerAtService: data.odometerAtService ?? null,
          reportedByDriverId: isDriver ? session.user.driverId : null,
          createdById: session.user.id,
        },
      });

      await logActivity({
        tx,
        userId: isDriver ? null : session.user.id,
        userName: session.user.name,
        action: "CREATE",
        entityType: "MaintenanceRequest",
        entityId: created.id,
        newValue: { requestNumber, truckId: data.truckId },
        description: `بلاغ عطل جديد ${requestNumber} للشاحنة ${truck.internalNumber}`,
      });

      return created;
    });

    revalidatePath("/maintenance");
    revalidatePath("/trucks");
    revalidatePath("/");
    return ok({ id: request.id });
  } catch {
    return fail("حدث خطأ أثناء إنشاء بلاغ الصيانة");
  }
}

export async function updateMaintenanceStatusAction(input: unknown): Promise<ActionResult<undefined>> {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "manageMaintenance")) {
    return fail("ليس لديك صلاحية لتحديث حالة الصيانة");
  }

  const parsed = maintenanceStatusUpdateSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "بيانات غير صالحة");
  const { requestId, status: newStatus, cost, nextMaintenanceDate, odometerAtService } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.maintenanceRequest.findUnique({ where: { id: requestId } });
      if (!request) return "الطلب غير موجود";

      const truck = await tx.truck.findUnique({ where: { id: request.truckId } });
      if (!truck) return "الشاحنة غير موجودة";

      const updateData: Record<string, unknown> = { status: newStatus };
      if (cost !== undefined) updateData.cost = cost;
      if (nextMaintenanceDate) updateData.nextMaintenanceDate = new Date(nextMaintenanceDate);
      if (odometerAtService !== undefined) updateData.odometerAtService = odometerAtService;

      const startsMaintenance = ["INSPECTING", "IN_PROGRESS"].includes(newStatus);
      const completesMaintenance = newStatus === "COMPLETED";
      const cancelsMaintenance = newStatus === "CANCELLED";

      if (startsMaintenance && truck.status !== "STOPPED") {
        await tx.truck.update({ where: { id: truck.id }, data: { status: "MAINTENANCE" } });
      }
      if ((completesMaintenance || cancelsMaintenance) && truck.status === "MAINTENANCE") {
        await tx.truck.update({ where: { id: truck.id }, data: { status: "AVAILABLE" } });
      }
      if (completesMaintenance) {
        updateData.completedAt = new Date();
        if (odometerAtService !== undefined) {
          await tx.truck.update({ where: { id: truck.id }, data: { odometerKm: odometerAtService } });
        }
      }

      await tx.maintenanceRequest.update({ where: { id: requestId }, data: updateData });

      if (completesMaintenance && cost) {
        await tx.financeTransaction.create({
          data: {
            type: "EXPENSE",
            category: "MAINTENANCE",
            amount: cost,
            description: `تكلفة صيانة الشاحنة ${truck.internalNumber} - طلب ${request.requestNumber}`,
            date: new Date(),
            truckId: truck.id,
            isPaid: true,
            createdById: session.user.id,
          },
        });
      }

      await logActivity({
        tx,
        userId: session.user.id,
        userName: session.user.name,
        action: "STATUS_CHANGE",
        entityType: "MaintenanceRequest",
        entityId: requestId,
        oldValue: { status: request.status },
        newValue: { status: newStatus },
        description: `تحديث حالة طلب الصيانة ${request.requestNumber} إلى "${newStatus}"`,
      });

      return null;
    });

    if (result) return fail(result);

    revalidatePath("/maintenance");
    revalidatePath("/trucks");
    revalidatePath("/");
    return ok(undefined);
  } catch {
    return fail("حدث خطأ أثناء تحديث حالة الصيانة");
  }
}
