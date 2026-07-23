import type { Role } from "@/generated/prisma/client";

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "مدير النظام",
  OPS_MANAGER: "مدير التشغيل",
  ACCOUNTANT: "المحاسب",
  MAINTENANCE: "مسؤول الصيانة",
  DRIVER: "السائق",
};

// Roles allowed to access the main back-office application (everything except the driver portal).
export const BACK_OFFICE_ROLES: Role[] = [
  "ADMIN",
  "OPS_MANAGER",
  "ACCOUNTANT",
  "MAINTENANCE",
];

export const PERMISSIONS = {
  viewDashboard: ["ADMIN", "OPS_MANAGER", "ACCOUNTANT", "MAINTENANCE"] as Role[],
  manageTrips: ["ADMIN", "OPS_MANAGER"] as Role[],
  viewTrips: ["ADMIN", "OPS_MANAGER", "ACCOUNTANT", "MAINTENANCE"] as Role[],
  manageTrucks: ["ADMIN", "OPS_MANAGER", "MAINTENANCE"] as Role[],
  viewTrucks: ["ADMIN", "OPS_MANAGER", "ACCOUNTANT", "MAINTENANCE"] as Role[],
  manageDrivers: ["ADMIN", "OPS_MANAGER"] as Role[],
  viewDrivers: ["ADMIN", "OPS_MANAGER", "ACCOUNTANT", "MAINTENANCE"] as Role[],
  manageCustomers: ["ADMIN", "OPS_MANAGER", "ACCOUNTANT"] as Role[],
  manageMaintenance: ["ADMIN", "MAINTENANCE"] as Role[],
  viewMaintenance: ["ADMIN", "OPS_MANAGER", "MAINTENANCE"] as Role[],
  manageFinance: ["ADMIN", "ACCOUNTANT"] as Role[],
  viewFinance: ["ADMIN", "ACCOUNTANT"] as Role[],
  viewReports: ["ADMIN", "OPS_MANAGER", "ACCOUNTANT"] as Role[],
  manageUsers: ["ADMIN"] as Role[],
  viewActivityLog: ["ADMIN"] as Role[],
  manageSettings: ["ADMIN"] as Role[],
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

export function can(role: Role | undefined | null, permission: PermissionKey): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as Role[]).includes(role);
}
