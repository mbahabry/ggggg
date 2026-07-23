import Link from "next/link";
import { UsersIcon, StarIcon } from "lucide-react";

import { requirePermission } from "@/lib/require-auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getDriversList } from "@/lib/queries/drivers";
import { parsePageParam } from "@/lib/pagination";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { SearchInput } from "@/components/shared/search-input";
import { FilterSelect } from "@/components/shared/filter-select";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { EmptyState } from "@/components/shared/empty-state";
import { DriverStatusBadge } from "@/components/shared/status-badge";
import { DriverFormDialog } from "@/components/drivers/driver-form-dialog";
import { DRIVER_STATUS_LABELS } from "@/lib/status-labels";
import { formatSAR } from "@/lib/format";
import type { DriverStatus } from "@/generated/prisma/client";

export default async function DriversPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requirePermission("viewDrivers");
  const sp = await searchParams;
  const page = parsePageParam(sp.page);
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const status = typeof sp.status === "string" ? (sp.status as DriverStatus) : undefined;

  const [{ drivers, total, totalPages }, allTrucks] = await Promise.all([
    getDriversList({ q, status, page }),
    can(session.user.role, "manageDrivers")
      ? prisma.truck.findMany({ select: { id: true, internalNumber: true }, orderBy: { internalNumber: "asc" } })
      : Promise.resolve([]),
  ]);

  const statusOptions = Object.entries(DRIVER_STATUS_LABELS).map(([value, label]) => ({ value, label }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">السائقون</h1>
          <p className="text-muted-foreground text-sm mt-1">إدارة بيانات السائقين ({total} سائق)</p>
        </div>
        {can(session.user.role, "manageDrivers") && <DriverFormDialog trucks={allTrucks} />}
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput placeholder="بحث بالاسم، الجوال، أو رقم الرخصة..." />
            <FilterSelect paramKey="status" placeholder="حالة السائق" options={statusOptions} />
          </div>

          {drivers.length === 0 ? (
            <EmptyState icon={UsersIcon} title="لا يوجد سائقون" description="لم يتم العثور على سائقين مطابقين" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم</TableHead>
                      <TableHead>الجوال</TableHead>
                      <TableHead>الجنسية</TableHead>
                      <TableHead>الشاحنة</TableHead>
                      <TableHead>عدد الرحلات</TableHead>
                      <TableHead>الإيرادات المحققة</TableHead>
                      <TableHead>التقييم</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drivers.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">
                          <Link href={`/drivers/${d.id}`} className="hover:underline">
                            {d.name}
                          </Link>
                        </TableCell>
                        <TableCell dir="ltr" className="text-right">{d.phone}</TableCell>
                        <TableCell>{d.nationality}</TableCell>
                        <TableCell>{d.truck?.internalNumber ?? "—"}</TableCell>
                        <TableCell className="tabular-nums">{d.tripsCount}</TableCell>
                        <TableCell>{formatSAR(d.totalRevenue)}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1">
                            <StarIcon className="size-3.5 fill-warning text-warning" />
                            {Number(d.rating).toFixed(1)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DriverStatusBadge status={d.status} />
                        </TableCell>
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
