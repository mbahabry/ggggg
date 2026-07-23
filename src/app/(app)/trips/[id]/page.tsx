import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  MapPinIcon,
  PackageIcon,
  CalendarClockIcon,
  UserIcon,
  TruckIcon,
  ClipboardListIcon,
} from "lucide-react";

import { requirePermission } from "@/lib/require-auth";
import { can } from "@/lib/permissions";
import { getTripDetail, getAvailableDriversAndTrucks } from "@/lib/queries/trips";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TripStatusBadge, DelayedBadge } from "@/components/shared/status-badge";
import { TripStatusActions } from "@/components/trips/trip-status-actions";
import { AssignTripDialog } from "@/components/trips/assign-trip-dialog";
import { TRIP_STATUS_LABELS } from "@/lib/status-labels";
import { formatSAR, formatDateTime } from "@/lib/format";
import { computeIsDelayed } from "@/lib/business/trip-rules";

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePermission("viewTrips");
  const { id } = await params;

  const trip = await getTripDetail(id);
  if (!trip) notFound();

  const isDelayed = computeIsDelayed(trip);
  const canManage = can(session.user.role, "manageTrips");
  const canReassign = canManage && ["DRAFT", "PENDING_ACCEPTANCE"].includes(trip.status);

  let availableDrivers: { id: string; name: string }[] = [];
  let availableTrucks: { id: string; internalNumber: string; truckType: string }[] = [];
  if (canReassign) {
    const data = await getAvailableDriversAndTrucks();
    availableDrivers = data.drivers;
    availableTrucks = data.trucks;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{trip.tripNumber}</h1>
            <TripStatusBadge status={trip.status} />
            {isDelayed && <DelayedBadge />}
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {trip.customer.name} · {trip.originCity} ← {trip.destinationCity}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canReassign && (
            <AssignTripDialog
              tripId={trip.id}
              drivers={availableDrivers}
              trucks={availableTrucks}
              triggerLabel={trip.driverId ? "إعادة التعيين" : "تعيين سائق وشاحنة"}
            />
          )}
          {canManage && (
            <TripStatusActions
              tripId={trip.id}
              currentStatus={trip.status}
              canCancel={!["DELIVERED", "CANCELLED"].includes(trip.status)}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>تفاصيل الرحلة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <InfoRow icon={MapPinIcon} label="نقطة التحميل" value={`${trip.originCity}${trip.originAddress ? ` - ${trip.originAddress}` : ""}`} />
              <InfoRow icon={MapPinIcon} label="نقطة التسليم" value={`${trip.destinationCity}${trip.destinationAddress ? ` - ${trip.destinationAddress}` : ""}`} />
              <InfoRow icon={CalendarClockIcon} label="تاريخ التحميل" value={formatDateTime(trip.pickupDateTime)} />
              <InfoRow
                icon={CalendarClockIcon}
                label="تاريخ التسليم المتوقع"
                value={formatDateTime(trip.expectedDeliveryDate)}
              />
              <InfoRow icon={PackageIcon} label="نوع الحمولة" value={trip.cargoType} />
              <InfoRow icon={PackageIcon} label="وزن الحمولة" value={`${trip.cargoWeightTons.toString()} طن`} />
              <InfoRow icon={UserIcon} label="السائق" value={trip.driver?.name ?? "غير معين"} />
              <InfoRow icon={TruckIcon} label="الشاحنة" value={trip.truck?.internalNumber ?? "غير معينة"} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">قيمة الرحلة</span>
              <span className="font-bold text-lg">{formatSAR(trip.value.toString())}</span>
            </div>
            {trip.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-muted-foreground text-sm mb-1">ملاحظات</p>
                  <p className="text-sm">{trip.notes}</p>
                </div>
              </>
            )}
            {trip.proofOfDeliveryUrl && (
              <>
                <Separator />
                <div>
                  <p className="text-muted-foreground text-sm mb-2">إثبات التسليم</p>
                  <a href={trip.proofOfDeliveryUrl} target="_blank" rel="noreferrer">
                    <Image
                      src={trip.proofOfDeliveryUrl}
                      alt="إثبات التسليم"
                      width={240}
                      height={240}
                      className="rounded-lg border object-cover"
                    />
                  </a>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardListIcon className="size-4" />
              السجل الزمني للحالة
            </CardTitle>
            <CardDescription>جميع تغييرات حالة الرحلة</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {trip.statusHistory.map((h) => (
                <li key={h.id} className="text-sm border-r-2 border-primary/30 pr-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="outline">{TRIP_STATUS_LABELS[h.toStatus]}</Badge>
                  </div>
                  <p className="text-muted-foreground text-xs mt-1">{formatDateTime(h.changedAt)}</p>
                  <p className="text-xs text-muted-foreground">
                    {h.changedBy?.name ?? h.changedByDriver?.name ?? "النظام"}
                  </p>
                  {h.note && <p className="text-xs mt-1">{h.note}</p>}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      {trip.financeTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>الحركات المالية المرتبطة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {trip.financeTransactions.map((f) => (
              <div key={f.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                <span>{f.description}</span>
                <div className="flex items-center gap-2">
                  <span className={f.type === "REVENUE" ? "text-success font-medium" : "text-destructive font-medium"}>
                    {formatSAR(f.amount.toString())}
                  </span>
                  <Badge variant={f.isPaid ? "success" : "warning"}>{f.isPaid ? "مدفوعة" : "مستحقة"}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        أنشئت الرحلة بواسطة {trip.createdBy.name} في {formatDateTime(trip.createdAt)} ·{" "}
        <Link href="/trips" className="hover:underline">
          العودة لقائمة الرحلات
        </Link>
      </p>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}
