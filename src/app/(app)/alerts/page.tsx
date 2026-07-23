import { BellIcon } from "lucide-react";

import { requireSession } from "@/lib/require-auth";
import { getAlertsList } from "@/lib/queries/alerts";
import { parsePageParam } from "@/lib/pagination";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { FilterSelect } from "@/components/shared/filter-select";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { EmptyState } from "@/components/shared/empty-state";
import { AlertSeverityBadge } from "@/components/shared/status-badge";
import { ResolveAlertButton, RefreshAlertsButton } from "@/components/alerts/alert-actions";
import { ALERT_SEVERITY_LABELS } from "@/lib/status-labels";
import { formatDateTime } from "@/lib/format";
import { AlertTriangleIcon, InfoIcon, OctagonAlertIcon } from "lucide-react";
import type { AlertSeverity } from "@/generated/prisma/client";

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireSession();
  const sp = await searchParams;
  const page = parsePageParam(sp.page);
  const severity = typeof sp.severity === "string" ? (sp.severity as AlertSeverity) : undefined;
  const resolved = sp.resolved === "true";

  const { alerts, total, totalPages, unresolvedCounts } = await getAlertsList({
    severity,
    resolved,
    page,
  });

  const severityOptions = Object.entries(ALERT_SEVERITY_LABELS).map(([value, label]) => ({ value, label }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">التنبيهات</h1>
          <p className="text-muted-foreground text-sm mt-1">
            تنبيهات انتهاء المستندات، الرحلات المتأخرة، والفواتير المستحقة
          </p>
        </div>
        <RefreshAlertsButton />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard title="تنبيهات حرجة" value={unresolvedCounts.critical} icon={OctagonAlertIcon} tone="destructive" />
        <StatCard title="تنبيهات تحذيرية" value={unresolvedCounts.warning} icon={AlertTriangleIcon} tone="warning" />
        <StatCard title="تنبيهات معلوماتية" value={unresolvedCounts.info} icon={InfoIcon} />
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <FilterSelect paramKey="severity" placeholder="الخطورة" options={severityOptions} />
            <FilterSelect
              paramKey="resolved"
              placeholder="الحالة"
              options={[
                { value: "false", label: "غير معالجة" },
                { value: "true", label: "معالجة" },
              ]}
            />
          </div>

          {alerts.length === 0 ? (
            <EmptyState icon={BellIcon} title="لا توجد تنبيهات" description="لا توجد تنبيهات مطابقة حاليا" />
          ) : (
            <>
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <AlertSeverityBadge severity={alert.severity} />
                        <p className="font-medium">{alert.title}</p>
                      </div>
                      <p className="text-muted-foreground text-sm mt-1">{alert.message}</p>
                      <p className="text-muted-foreground text-xs mt-1">{formatDateTime(alert.createdAt)}</p>
                    </div>
                    {!alert.isResolved && <ResolveAlertButton id={alert.id} />}
                  </div>
                ))}
              </div>
              <PaginationControls currentPage={page} totalPages={totalPages} totalItems={total} pageSize={10} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
