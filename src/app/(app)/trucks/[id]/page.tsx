import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TruckIcon } from "lucide-react";

import { requirePermission } from "@/lib/require-auth";
import { can } from "@/lib/permissions";
import { getTruckDetail } from "@/lib/queries/trucks";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { TruckStatusBadge, MaintenanceStatusBadge, TripStatusBadge } from "@/components/shared/status-badge";
import { TruckFormDialog } from "@/components/trucks/truck-form-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate, formatSAR } from "@/lib/format";

export default async function TruckDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("viewTrucks");
  const { id } = await params;

  const truck = await getTruckDetail(id);
  if (!truck) notFound();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{truck.internalNumber}</h1>
          <TruckStatusBadge status={truck.status} />
        </div>
        {can(session.user.role, "manageTrucks") && (
          <TruckFormDialog
            truck={{
              id: truck.id,
              internalNumber: truck.internalNumber,
              plateNumber: truck.plateNumber,
              truckType: truck.truckType,
              model: truck.model,
              year: truck.year,
              capacityTons: truck.capacityTons.toString(),
              chassisNumber: truck.chassisNumber,
              odometerKm: truck.odometerKm,
              status: truck.status,
              formExpiry: truck.formExpiry.toISOString(),
              insuranceExpiry: truck.insuranceExpiry.toISOString(),
              inspectionExpiry: truck.inspectionExpiry.toISOString(),
              imageUrl: truck.imageUrl,
              notes: truck.notes,
            }}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>بيانات الشاحنة</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <Field label="رقم اللوحة" value={truck.plateNumber} />
            <Field label="النوع" value={truck.truckType} />
            <Field label="الموديل" value={truck.model} />
            <Field label="سنة الصنع" value={String(truck.year)} />
            <Field label="سعة الحمولة" value={`${truck.capacityTons.toString()} طن`} />
            <Field label="رقم الهيكل" value={truck.chassisNumber} />
            <Field label="قراءة العداد" value={`${truck.odometerKm.toLocaleString("ar-SA")} كم`} />
            <Field label="السائق الحالي" value={truck.assignedDriver?.name ?? "غير معين"} />
            <Field label="انتهاء الاستمارة" value={formatDate(truck.formExpiry)} />
            <Field label="انتهاء التأمين" value={formatDate(truck.insuranceExpiry)} />
            <Field label="الفحص الدوري" value={formatDate(truck.inspectionExpiry)} />
            {truck.notes && <Field label="ملاحظات" value={truck.notes} />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>صورة الشاحنة</CardTitle>
          </CardHeader>
          <CardContent>
            {truck.imageUrl ? (
              <Image
                src={truck.imageUrl}
                alt={truck.internalNumber}
                width={300}
                height={200}
                className="rounded-lg border object-cover w-full h-auto"
              />
            ) : (
              <div className="flex items-center justify-center h-40 rounded-lg border border-dashed text-muted-foreground">
                <TruckIcon className="size-8" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>سجل الصيانة</CardTitle>
          <CardDescription>جميع طلبات الصيانة الخاصة بهذه الشاحنة</CardDescription>
        </CardHeader>
        <CardContent>
          {truck.maintenanceRequests.length === 0 ? (
            <EmptyState title="لا يوجد سجل صيانة" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الطلب</TableHead>
                    <TableHead>نوع العطل</TableHead>
                    <TableHead>الأولوية</TableHead>
                    <TableHead>التكلفة</TableHead>
                    <TableHead>تاريخ البلاغ</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {truck.maintenanceRequests.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">
                        <Link href="/maintenance" className="hover:underline">
                          {m.requestNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{m.faultType}</TableCell>
                      <TableCell>{m.priority}</TableCell>
                      <TableCell>{m.cost ? formatSAR(m.cost.toString()) : "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(m.reportedAt)}</TableCell>
                      <TableCell>
                        <MaintenanceStatusBadge status={m.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>أحدث الرحلات</CardTitle>
        </CardHeader>
        <CardContent>
          {truck.trips.length === 0 ? (
            <EmptyState title="لا توجد رحلات لهذه الشاحنة بعد" />
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
                  {truck.trips.map((t) => (
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
