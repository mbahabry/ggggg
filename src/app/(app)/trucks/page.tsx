import Link from "next/link";
import { TruckIcon } from "lucide-react";

import { requirePermission } from "@/lib/require-auth";
import { can } from "@/lib/permissions";
import { getTrucksList } from "@/lib/queries/trucks";
import { parsePageParam } from "@/lib/pagination";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { SearchInput } from "@/components/shared/search-input";
import { FilterSelect } from "@/components/shared/filter-select";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { EmptyState } from "@/components/shared/empty-state";
import { TruckStatusBadge } from "@/components/shared/status-badge";
import { TruckFormDialog } from "@/components/trucks/truck-form-dialog";
import { TRUCK_STATUS_LABELS } from "@/lib/status-labels";
import { formatDate } from "@/lib/format";
import type { TruckStatus } from "@/generated/prisma/client";

export default async function TrucksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requirePermission("viewTrucks");
  const sp = await searchParams;
  const page = parsePageParam(sp.page);
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const status = typeof sp.status === "string" ? (sp.status as TruckStatus) : undefined;

  const { trucks, total, totalPages } = await getTrucksList({ q, status, page });
  const statusOptions = Object.entries(TRUCK_STATUS_LABELS).map(([value, label]) => ({ value, label }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">الشاحنات</h1>
          <p className="text-muted-foreground text-sm mt-1">إدارة أسطول الشاحنات ({total} شاحنة)</p>
        </div>
        {can(session.user.role, "manageTrucks") && <TruckFormDialog />}
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput placeholder="بحث برقم الشاحنة، اللوحة، أو الموديل..." />
            <FilterSelect paramKey="status" placeholder="حالة الشاحنة" options={statusOptions} />
          </div>

          {trucks.length === 0 ? (
            <EmptyState icon={TruckIcon} title="لا توجد شاحنات" description="لم يتم العثور على شاحنات مطابقة" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الرقم الداخلي</TableHead>
                      <TableHead>رقم اللوحة</TableHead>
                      <TableHead>النوع / الموديل</TableHead>
                      <TableHead>السائق الحالي</TableHead>
                      <TableHead>العداد</TableHead>
                      <TableHead>انتهاء الاستمارة</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trucks.map((truck) => (
                      <TableRow key={truck.id}>
                        <TableCell className="font-medium">
                          <Link href={`/trucks/${truck.id}`} className="hover:underline">
                            {truck.internalNumber}
                          </Link>
                        </TableCell>
                        <TableCell dir="ltr" className="text-right">{truck.plateNumber}</TableCell>
                        <TableCell>
                          {truck.truckType} / {truck.model}
                        </TableCell>
                        <TableCell>{truck.assignedDriver?.name ?? "—"}</TableCell>
                        <TableCell className="tabular-nums">{truck.odometerKm.toLocaleString("ar-SA")} كم</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(truck.formExpiry)}
                        </TableCell>
                        <TableCell>
                          <TruckStatusBadge status={truck.status} />
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
