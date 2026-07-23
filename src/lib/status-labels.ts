import type {
  TruckStatus,
  DriverStatus,
  TripStatus,
  MaintenanceStatus,
  MaintenancePriority,
  FinanceType,
  FinanceCategory,
  AlertSeverity,
  AlertType,
} from "@/generated/prisma/client";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning";

export const TRUCK_STATUS_LABELS: Record<TruckStatus, string> = {
  AVAILABLE: "متاحة",
  ON_TRIP: "في رحلة",
  MAINTENANCE: "تحت الصيانة",
  STOPPED: "متوقفة",
};

export const TRUCK_STATUS_VARIANTS: Record<TruckStatus, BadgeVariant> = {
  AVAILABLE: "success",
  ON_TRIP: "default",
  MAINTENANCE: "warning",
  STOPPED: "destructive",
};

export const DRIVER_STATUS_LABELS: Record<DriverStatus, string> = {
  AVAILABLE: "متاح",
  ON_TRIP: "في رحلة",
  LEAVE: "إجازة",
  SUSPENDED: "موقوف",
};

export const DRIVER_STATUS_VARIANTS: Record<DriverStatus, BadgeVariant> = {
  AVAILABLE: "success",
  ON_TRIP: "default",
  LEAVE: "secondary",
  SUSPENDED: "destructive",
};

export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  DRAFT: "مسودة",
  PENDING_ACCEPTANCE: "بانتظار قبول السائق",
  ACCEPTED: "مقبولة",
  TO_PICKUP: "في الطريق إلى التحميل",
  LOADED: "تم التحميل",
  TO_DROPOFF: "في الطريق إلى التسليم",
  DELIVERED: "تم التسليم",
  CANCELLED: "ملغاة",
};

export const TRIP_STATUS_VARIANTS: Record<TripStatus, BadgeVariant> = {
  DRAFT: "secondary",
  PENDING_ACCEPTANCE: "warning",
  ACCEPTED: "default",
  TO_PICKUP: "default",
  LOADED: "default",
  TO_DROPOFF: "default",
  DELIVERED: "success",
  CANCELLED: "destructive",
};

export const ACTIVE_TRIP_STATUSES: TripStatus[] = [
  "PENDING_ACCEPTANCE",
  "ACCEPTED",
  "TO_PICKUP",
  "LOADED",
  "TO_DROPOFF",
];

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatus, string> = {
  NEW: "جديد",
  INSPECTING: "تحت الفحص",
  IN_PROGRESS: "جاري الإصلاح",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغى",
};

export const MAINTENANCE_STATUS_VARIANTS: Record<MaintenanceStatus, BadgeVariant> = {
  NEW: "secondary",
  INSPECTING: "warning",
  IN_PROGRESS: "default",
  COMPLETED: "success",
  CANCELLED: "destructive",
};

export const MAINTENANCE_PRIORITY_LABELS: Record<MaintenancePriority, string> = {
  LOW: "منخفضة",
  MEDIUM: "متوسطة",
  HIGH: "عالية",
  URGENT: "عاجلة",
};

export const MAINTENANCE_PRIORITY_VARIANTS: Record<MaintenancePriority, BadgeVariant> = {
  LOW: "secondary",
  MEDIUM: "default",
  HIGH: "warning",
  URGENT: "destructive",
};

export const FINANCE_TYPE_LABELS: Record<FinanceType, string> = {
  REVENUE: "إيراد",
  EXPENSE: "مصروف",
};

export const FINANCE_CATEGORY_LABELS: Record<FinanceCategory, string> = {
  TRIP_REVENUE: "إيراد رحلة",
  FUEL: "وقود",
  MAINTENANCE: "صيانة",
  DRIVER_PAYROLL: "مستحقات سائقين",
  FINES: "مخالفات",
  ADMIN: "مصروفات إدارية",
  OTHER: "أخرى",
};

export const ALERT_SEVERITY_LABELS: Record<AlertSeverity, string> = {
  INFO: "معلومة",
  WARNING: "تنبيه",
  CRITICAL: "حرج",
};

export const ALERT_SEVERITY_VARIANTS: Record<AlertSeverity, BadgeVariant> = {
  INFO: "secondary",
  WARNING: "warning",
  CRITICAL: "destructive",
};

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  DRIVER_LICENSE_EXPIRY: "قرب انتهاء رخصة سائق",
  TRUCK_FORM_EXPIRY: "قرب انتهاء استمارة شاحنة",
  TRUCK_INSURANCE_EXPIRY: "قرب انتهاء تأمين شاحنة",
  TRUCK_INSPECTION_EXPIRY: "قرب انتهاء الفحص الدوري",
  TRIP_DELAYED: "رحلة متأخرة",
  TRUCK_MAINTENANCE_NEEDED: "شاحنة تحتاج صيانة",
  INVOICE_DUE: "فاتورة مستحقة",
};
