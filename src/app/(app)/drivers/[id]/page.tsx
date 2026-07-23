import Link from "next/link";
import { notFound } from "next/navigation";
import { StarIcon } from "lucide-react";

import { requirePermission } from "@/lib/require-auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getDriverDetail } from "@/lib/queries/drivers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { DriverStatusBadge, TripStatusBadge } from "@/components/shared/status-badge";
import { DriverFormDialog } from "@/components/drivers/driver-form-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate, formatSAR } from "@/lib/format";
import { RouteIcon, WalletIcon, ShieldAlertIcon } from "lucide-react";

export default async function DriverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("viewDrivers");
  const { id } = await params;

  const driver = await getDriverDetail(id);
  if (!driver) notFound();

  const trucks = can(session.user.role, "manageDrivers")
    ? await prisma.truck.findMany({ select: { id: true, internalNumber: true }, orderBy: { internalNumber: "asc" } })
    : [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{driver.name}</h1>
          <DriverStatusBadge status={driver.status} />
        </div>
        {can(session.user.role, "manageDrivers") && (
          <DriverFormDialog
            trucks={trucks}
            driver={{
              id: driver.id,
              name: driver.name,
              phone: driver.phone,
              nationalId: driver.nationalId,
              nationality: driver.nationality,
              licenseNumber: driver.licenseNumber,
              licenseExpiry: driver.licenseExpiry.toISOString(),
              status: driver.status,
              truckId: driver.truckId,
              rating: driver.rating.toString(),
              violationsCount: driver.violationsCount,
              notes: driver.notes,
            }}
          />
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard title="عدد الرحلات" value={driver.tripsCount} icon={RouteIcon} />
        <StatCard title="إجمالي الإيرادات المحققة" value={formatSAR(driver.totalRevenue)} icon={WalletIcon} tone="success" />
        <StatCard title="عدد المخالفات" value={driver.violationsCount} icon={ShieldAlertIcon} tone={driver.violationsCount > 0 ? "warning" : "default"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>البيانات الشخصية</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <Field label="رقم الجوال" value={driver.phone} />
          <Field label="رقم الهوية / الإقامة" value={driver.nationalId} />
          <Field label="الجنسية" value={driver.nationality} />
          <Field label="رقم رخصة القيادة" value={driver.licenseNumber} />
          <Field label="تاريخ انتهاء الرخصة" value={formatDate(driver.licenseExpiry)} />
          <Field label="الشاحنة المخصصة" value={driver.truck?.internalNumber ?? "غير مخصصة"} />
          <div>
            <p className="text-muted-foreground text-xs">تقييم الأداء</p>
            <p className="font-medium flex items-center gap-1">
              <StarIcon className="size-3.5 fill-warning text-warning" />
              {Number(driver.rating).toFixed(1)} / 5
            </p>
          </div>
          {driver.notes && <Field label="ملاحظات" value={driver.notes} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>أحدث الرحلات</CardTitle>
        </CardHeader>
        <CardContent>
          {driver.trips.length === 0 ? (
            <EmptyState title="لا توجد رحلات لهذا السائق بعد" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الرحلة</TableHead>
                    <TableHead>العميل</TableHead>
                    <TableHead>المسار</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {driver.trips.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <Link href={`/trips/${t.id}`} className="hover:underline font-medium">
                          {t.tripNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{t.customer.name}</TableCell>
                      <TableCell>
                        {t.originCity} ← {t.destinationCity}
                      </TableCell>
                      <TableCell>
                        <TripStatusBadge status={t.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
