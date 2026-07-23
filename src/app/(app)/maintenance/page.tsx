import { WrenchIcon } from "lucide-react";

import { requirePermission } from "@/lib/require-auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getMaintenanceList } from "@/lib/queries/maintenance";
import { parsePageParam } from "@/lib/pagination";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { SearchInput } from "@/components/shared/search-input";
import { FilterSelect } from "@/components/shared/filter-select";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { EmptyState } from "@/components/shared/empty-state";
import { MaintenanceStatusBadge, MaintenancePriorityBadge } from "@/components/shared/status-badge";
import { MaintenanceFormDialog } from "@/components/maintenance/maintenance-form-dialog";
import { MaintenanceStatusDialog } from "@/components/maintenance/maintenance-status-dialog";
import { MAINTENANCE_STATUS_LABELS } from "@/lib/status-labels";
import { formatDate, formatSAR } from "@/lib/format";
import type { MaintenanceStatus } from "@/generated/prisma/client";

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requirePermission("viewMaintenance");
  const sp = await searchParams;
  const page = parsePageParam(sp.page);
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const status = typeof sp.status === "string" ? (sp.status as MaintenanceStatus) : undefined;

  const canManage = can(session.user.role, "manageMaintenance");

  const [{ requests, total, totalPages }, trucks] = await Promise.all([
    getMaintenanceList({ q, status, page }),
    canManage
      ? prisma.truck.findMany({ select: { id: true, internalNumber: true }, orderBy: { internalNumber: "asc" } })
      : Promise.resolve([]),
  ]);

  const statusOptions = Object.entries(MAINTENANCE_STATUS_LABELS).map(([value, label]) => ({ value, label }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">الصيانة</h1>
          <p className="text-muted-foreground text-sm mt-1">بلاغات الأعطال وطلبات الصيانة ({total})</p>
        </div>
        {canManage && <MaintenanceFormDialog trucks={trucks} />}
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput placeholder="بحث برقم الطلب، الشاحنة، أو نوع العطل..." />
            <FilterSelect paramKey="status" placeholder="حالة الطلب" options={statusOptions} />
          </div>

          {requests.length === 0 ? (
            <EmptyState icon={WrenchIcon} title="لا توجد طلبات صيانة" description="لم يتم العثور على طلبات مطابقة" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الطلب</TableHead>
                      <TableHead>الشاحنة</TableHead>
                      <TableHead>نوع العطل</TableHead>
                      <TableHead>الأولوية</TableHead>
                      <TableHead>التكلفة</TableHead>
                      <TableHead>تاريخ البلاغ</TableHead>
                      <TableHead>الحالة</TableHead>
                      {canManage && <TableHead className="w-32"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.requestNumber}</TableCell>
                        <TableCell>{r.truck.internalNumber}</TableCell>
                        <TableCell>{r.faultType}</TableCell>
                        <TableCell>
                          <MaintenancePriorityBadge priority={r.priority} />
                        </TableCell>
                        <TableCell>{r.cost ? formatSAR(r.cost.toString()) : "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(r.reportedAt)}</TableCell>
                        <TableCell>
                          <MaintenanceStatusBadge status={r.status} />
                        </TableCell>
                        {canManage && (
                          <TableCell>
                            <MaintenanceStatusDialog requestId={r.id} currentStatus={r.status} />
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <PaginationControls currentPage={page} totalPages={totalPages} totalItems={total} pageSize={10} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
