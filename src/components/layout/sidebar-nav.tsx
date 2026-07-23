"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TruckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/components/layout/nav-config";
import { can } from "@/lib/permissions";
import type { Role } from "@/generated/prisma/client";

export function SidebarNav({
  role,
  onNavigate,
}: {
  role: Role;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => can(role, item.permission));

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-4 h-16 border-b border-sidebar-border shrink-0">
        <div className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground p-1.5">
          <TruckIcon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm truncate">انتيفات بلس</p>
          <p className="text-[11px] text-sidebar-foreground/60 truncate">للنقليات</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {items.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
