import Link from "next/link";
import { PlusIcon, RouteIcon } from "lucide-react";

import { requirePermission } from "@/lib/require-auth";
import { can } from "@/lib/permissions";
import { getTripsList } from "@/lib/queries/trips";
import { parsePageParam } from "@/lib/pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { SearchInput } from "@/components/shared/search-input";
import { FilterSelect } from "@/components/shared/filter-select";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { EmptyState } from "@/components/shared/empty-state";
import { TripStatusBadge, DelayedBadge } from "@/components/shared/status-badge";
import { TRIP_STATUS_LABELS } from "@/lib/status-labels";
import { formatSAR, formatDate } from "@/lib/format";
import { computeIsDelayed } from "@/lib/business/trip-rules";
import type { TripStatus } from "@/generated/prisma/client";

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requirePermission("viewTrips");
  const sp = await searchParams;
  const page = parsePageParam(sp.page);
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const status = typeof sp.status === "string" ? (sp.status as TripStatus) : undefined;

  const { trips, total, totalPages } = await getTripsList({ q, status, page });

  const statusOptions = Object.entries(TRIP_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">الرحلات</h1>
          <p className="text-muted-foreground text-sm mt-1">إدارة ومتابعة جميع الرحلات</p>
        </div>
        {can(session.user.role, "manageTrips") && (
          <Button asChild>
            <Link href="/trips/new">
              <PlusIcon />
              إنشاء رحلة
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput placeholder="بحث برقم الرحلة، العميل، أو المدينة..." />
            <FilterSelect paramKey="status" placeholder="حالة الرحلة" options={statusOptions} />
          </div>

          {trips.length === 0 ? (
            <EmptyState
              icon={RouteIcon}
              title="لا توجد رحلات"
              description="لم يتم العثور على رحلات مطابقة لمعايير البحث"
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الرحلة</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>المسار</TableHead>
                      <TableHead>السائق</TableHead>
                      <TableHead>الشاحنة</TableHead>
                      <TableHead>القيمة</TableHead>
                      <TableHead>تاريخ التحميل</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trips.map((trip) => (
                      <TableRow key={trip.id} className="cursor-pointer">
                        <TableCell className="font-medium">
                          <Link href={`/trips/${trip.id}`} className="hover:underline">
                            {trip.tripNumber}
                          </Link>
                        </TableCell>
                        <TableCell>{trip.customer.name}</TableCell>
                        <TableCell>
                          {trip.originCity} ← {trip.destinationCity}
                        </TableCell>
                        <TableCell>{trip.driver?.name ?? "—"}</TableCell>
                        <TableCell>{trip.truck?.internalNumber ?? "—"}</TableCell>
                        <TableCell>{formatSAR(trip.value.toString())}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {formatDate(trip.pickupDateTime)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <TripStatusBadge status={trip.status} />
                            {computeIsDelayed(trip) && <DelayedBadge />}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <PaginationControls
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                pageSize={10}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
