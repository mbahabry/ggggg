import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      {Icon && (
        <div className="rounded-full bg-muted p-3 mb-2">
          <Icon className="size-6 text-muted-foreground" />
        </div>
      )}
      <p className="font-medium">{title}</p>
      {description && <p className="text-muted-foreground text-sm max-w-sm">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
