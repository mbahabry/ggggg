"use client";

import { useTheme } from "next-themes";
import { SunIcon, MoonIcon, MonitorIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "فاتح", icon: SunIcon },
  { value: "dark", label: "داكن", icon: MoonIcon },
  { value: "system", label: "حسب النظام", icon: MonitorIcon },
];

export function ThemeToggleCard() {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle>المظهر</CardTitle>
        <CardDescription>اختر المظهر المناسب لك</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2">
        {OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={theme === opt.value ? "default" : "outline"}
            className={cn("flex-1")}
            onClick={() => setTheme(opt.value)}
          >
            <opt.icon />
            {opt.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
