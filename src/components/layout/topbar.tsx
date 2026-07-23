"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { MenuIcon, BellIcon, SunIcon, MoonIcon, LogOutIcon, UserIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { ROLE_LABELS } from "@/lib/permissions";
import type { Role } from "@/generated/prisma/client";

export function Topbar({
  userName,
  userRole,
  alertsCount,
}: {
  userName: string;
  userRole: Role;
  alertsCount: number;
}) {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const initials = userName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background px-4">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="p-0 w-72">
          <SheetTitle className="sr-only">القائمة</SheetTitle>
          <SidebarNav role={userRole} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)}>
        <MenuIcon className="size-5" />
      </Button>

      <div className="flex-1" />

      <Button variant="ghost" size="icon" asChild className="relative">
        <Link href="/alerts">
          <BellIcon className="size-5" />
          {alertsCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -left-1 size-5 rounded-full p-0 flex items-center justify-center text-[10px]"
            >
              {alertsCount > 99 ? "99+" : alertsCount}
            </Badge>
          )}
        </Link>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        <SunIcon className="size-5 dark:hidden" />
        <MoonIcon className="size-5 hidden dark:block" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 px-2">
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block text-right">
              <p className="text-xs font-medium leading-none">{userName}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{ROLE_LABELS[userRole]}</p>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>{userName}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <UserIcon />
              الإعدادات
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => signOut({ callbackUrl: "/login" })}>
            <LogOutIcon />
            تسجيل الخروج
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
