"use client";

import { signOut } from "next-auth/react";
import { SunIcon, MoonIcon, LogOutIcon, TruckIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function DriverTopbar({ userName }: { userName: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-primary text-primary-foreground p-1.5">
          <TruckIcon className="size-4" />
        </div>
        <div>
          <p className="font-bold text-sm leading-tight">انتيفات بلس</p>
          <p className="text-[11px] text-muted-foreground leading-tight">{userName}</p>
        </div>
      </div>
      <div className="flex-1" />
      <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
        <SunIcon className="size-5 dark:hidden" />
        <MoonIcon className="size-5 hidden dark:block" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: "/login" })}>
        <LogOutIcon className="size-5" />
      </Button>
    </header>
  );
}
