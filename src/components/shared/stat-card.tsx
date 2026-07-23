import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  title,
  value,
  icon: Icon,
  hint,
  tone = "default",
}: {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
  tone?: "default" | "success" | "warning" | "destructive";
}) {
  const toneClasses: Record<string, string> = {
    default: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    destructive: "bg-destructive/10 text-destructive",
  };

  return (
    <Card className="py-4 gap-2">
      <CardContent className="px-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs font-medium truncate">{title}</p>
          <p className="text-2xl font-bold tabular-nums mt-1">{value}</p>
          {hint && <p className="text-muted-foreground text-xs mt-1 truncate">{hint}</p>}
        </div>
        {Icon && (
          <div className={cn("shrink-0 rounded-lg p-2.5", toneClasses[tone])}>
            <Icon className="size-5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
