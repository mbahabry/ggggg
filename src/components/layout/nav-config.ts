import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboardIcon,
  TruckIcon,
  UsersIcon,
  Building2Icon,
  RouteIcon,
  ClipboardListIcon,
  WrenchIcon,
  WalletIcon,
  BarChart3Icon,
  BellIcon,
  ShieldIcon,
  HistoryIcon,
  SettingsIcon,
} from "lucide-react";
import type { PermissionKey } from "@/lib/permissions";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: PermissionKey;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "لوحة التحكم", icon: LayoutDashboardIcon, permission: "viewDashboard" },
  { href: "/trips", label: "الرحلات", icon: RouteIcon, permission: "viewTrips" },
  { href: "/dispatch", label: "التخطيط والتوزيع", icon: ClipboardListIcon, permission: "manageTrips" },
  { href: "/trucks", label: "الشاحنات", icon: TruckIcon, permission: "viewTrucks" },
  { href: "/drivers", label: "السائقون", icon: UsersIcon, permission: "viewDrivers" },
  { href: "/customers", label: "العملاء", icon: Building2Icon, permission: "manageCustomers" },
  { href: "/maintenance", label: "الصيانة", icon: WrenchIcon, permission: "viewMaintenance" },
  { href: "/finance", label: "المالية", icon: WalletIcon, permission: "viewFinance" },
  { href: "/reports", label: "التقارير", icon: BarChart3Icon, permission: "viewReports" },
  { href: "/alerts", label: "التنبيهات", icon: BellIcon, permission: "viewDashboard" },
  { href: "/users", label: "المستخدمون والصلاحيات", icon: ShieldIcon, permission: "manageUsers" },
  { href: "/activity-log", label: "سجل النشاط", icon: HistoryIcon, permission: "viewActivityLog" },
  { href: "/settings", label: "الإعدادات", icon: SettingsIcon, permission: "manageSettings" },
];
