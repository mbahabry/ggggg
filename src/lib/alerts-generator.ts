import { prisma } from "@/lib/prisma";
import { daysUntil } from "@/lib/format";
import { computeIsDelayed } from "@/lib/business/trip-rules";
import type { AlertSeverity, AlertType } from "@/generated/prisma/client";

const EXPIRY_WINDOW_DAYS = 30;

function severityForDays(days: number): AlertSeverity {
  if (days <= 7) return "CRITICAL";
  if (days <= 14) return "WARNING";
  return "INFO";
}

async function upsertAlert(params: {
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  relatedTruckId?: string;
  relatedDriverId?: string;
  relatedTripId?: string;
  relatedFinanceId?: string;
  dueDate?: Date;
}) {
  const relatedFilter = {
    relatedTruckId: params.relatedTruckId ?? null,
    relatedDriverId: params.relatedDriverId ?? null,
    relatedTripId: params.relatedTripId ?? null,
    relatedFinanceId: params.relatedFinanceId ?? null,
  };

  const existing = await prisma.alert.findFirst({
    where: { type: params.type, isResolved: false, ...relatedFilter },
  });

  if (existing) {
    await prisma.alert.update({
      where: { id: existing.id },
      data: {
        severity: params.severity,
        title: params.title,
        message: params.message,
        dueDate: params.dueDate,
      },
    });
  } else {
    await prisma.alert.create({
      data: {
        type: params.type,
        severity: params.severity,
        title: params.title,
        message: params.message,
        dueDate: params.dueDate,
        ...relatedFilter,
      },
    });
  }
}

/**
 * Scans trucks, drivers, trips and finance transactions for conditions that require
 * an alert, then creates or refreshes the corresponding (unresolved) Alert records.
 * Safe to call repeatedly (idempotent per related entity + type).
 */
export async function generateSystemAlerts() {
  const [trucks, drivers, activeTrips, dueFinance, maintenanceNeeded] = await Promise.all([
    prisma.truck.findMany(),
    prisma.driver.findMany(),
    prisma.trip.findMany({
      where: { status: { in: ["PENDING_ACCEPTANCE", "ACCEPTED", "TO_PICKUP", "LOADED", "TO_DROPOFF"] } },
    }),
    prisma.financeTransaction.findMany({ where: { isPaid: false, type: "REVENUE" } }),
    prisma.truck.findMany({ where: { status: "MAINTENANCE" } }),
  ]);

  for (const truck of trucks) {
    const docs: [AlertType, Date, string][] = [
      ["TRUCK_FORM_EXPIRY", truck.formExpiry, "استمارة"],
      ["TRUCK_INSURANCE_EXPIRY", truck.insuranceExpiry, "تأمين"],
      ["TRUCK_INSPECTION_EXPIRY", truck.inspectionExpiry, "فحص دوري"],
    ];
    for (const [type, date, label] of docs) {
      const days = daysUntil(date);
      if (days <= EXPIRY_WINDOW_DAYS) {
        await upsertAlert({
          type,
          severity: days < 0 ? "CRITICAL" : severityForDays(days),
          title: `${label} الشاحنة ${truck.internalNumber} ${days < 0 ? "منتهية" : "قاربت على الانتهاء"}`,
          message:
            days < 0
              ? `انتهت صلاحية ${label} الشاحنة ${truck.internalNumber} منذ ${Math.abs(days)} يوم`
              : `متبقٍ ${days} يوم على انتهاء ${label} الشاحنة ${truck.internalNumber}`,
          relatedTruckId: truck.id,
          dueDate: date,
        });
      }
    }
  }

  for (const driver of drivers) {
    const days = daysUntil(driver.licenseExpiry);
    if (days <= EXPIRY_WINDOW_DAYS) {
      await upsertAlert({
        type: "DRIVER_LICENSE_EXPIRY",
        severity: days < 0 ? "CRITICAL" : severityForDays(days),
        title: `رخصة القيادة للسائق ${driver.name} ${days < 0 ? "منتهية" : "قاربت على الانتهاء"}`,
        message:
          days < 0
            ? `انتهت صلاحية رخصة قيادة ${driver.name} منذ ${Math.abs(days)} يوم`
            : `متبقٍ ${days} يوم على انتهاء رخصة قيادة ${driver.name}`,
        relatedDriverId: driver.id,
        dueDate: driver.licenseExpiry,
      });
    }
  }

  for (const trip of activeTrips) {
    if (computeIsDelayed(trip)) {
      const days = Math.abs(daysUntil(trip.expectedDeliveryDate));
      await upsertAlert({
        type: "TRIP_DELAYED",
        severity: "CRITICAL",
        title: `الرحلة ${trip.tripNumber} متأخرة`,
        message: `تجاوزت الرحلة ${trip.tripNumber} موعد التسليم المتوقع بـ ${days} يوم`,
        relatedTripId: trip.id,
        dueDate: trip.expectedDeliveryDate,
      });
    }
  }

  for (const truck of maintenanceNeeded) {
    await upsertAlert({
      type: "TRUCK_MAINTENANCE_NEEDED",
      severity: "WARNING",
      title: `الشاحنة ${truck.internalNumber} تحت الصيانة`,
      message: `الشاحنة ${truck.internalNumber} حاليا تحت الصيانة وغير متاحة للرحلات`,
      relatedTruckId: truck.id,
    });
  }

  for (const tr of dueFinance) {
    if (tr.dueDate) {
      const days = daysUntil(tr.dueDate);
      if (days <= EXPIRY_WINDOW_DAYS) {
        await upsertAlert({
          type: "INVOICE_DUE",
          severity: days < 0 ? "CRITICAL" : severityForDays(days),
          title: `فاتورة مستحقة: ${tr.description}`,
          message:
            days < 0
              ? `تجاوزت الفاتورة "${tr.description}" موعد الاستحقاق منذ ${Math.abs(days)} يوم`
              : `فاتورة "${tr.description}" مستحقة خلال ${days} يوم`,
          relatedFinanceId: tr.id,
          dueDate: tr.dueDate,
        });
      }
    }
  }
}
