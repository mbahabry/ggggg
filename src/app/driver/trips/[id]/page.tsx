import { notFound, redirect } from "next/navigation";
import { MapPinIcon, PackageIcon, CalendarClockIcon } from "lucide-react";

import { requireDriver } from "@/lib/require-auth";
import { getDriverOwnTripDetail } from "@/lib/queries/driver-portal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TripStatusBadge, DelayedBadge } from "@/components/shared/status-badge";
import { TripStatusActions } from "@/components/trips/trip-status-actions";
import { ProofOfDelivery } from "@/components/driver/proof-of-delivery";
import { ReportFaultDialog } from "@/components/driver/report-fault-dialog";
import { TRIP_STATUS_LABELS } from "@/lib/status-labels";
import { formatSAR, formatDateTime } from "@/lib/format";
import { computeIsDelayed } from "@/lib/business/trip-rules";

export default async function DriverTripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireDriver();
  if (!session.user.driverId) redirect("/403");
  const { id } = await params;

  const trip = await getDriverOwnTripDetail(session.user.driverId, id);
  if (!trip) notFound();

  const isDelayed = computeIsDelayed(trip);
  const showProofUpload = ["TO_DROPOFF", "DELIVERED"].includes(trip.status);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-bold">{trip.tripNumber}</h1>
          <TripStatusBadge status={trip.status} />
          {isDelayed && <DelayedBadge />}
        </div>
        <p className="text-muted-foreground text-sm mt-1">{trip.customer.name}</p>
      </div>

      <Card>
        <CardContent className="space-y-3 text-sm pt-5">
          <InfoRow icon={MapPinIcon} label="نقطة التحميل" value={trip.originCity} />
          <InfoRow icon={MapPinIcon} label="نقطة التسليم" value={trip.destinationCity} />
          <InfoRow icon={CalendarClockIcon} label="موعد التحميل" value={formatDateTime(trip.pickupDateTime)} />
          <InfoRow
            icon={CalendarClockIcon}
            label="موعد التسليم المتوقع"
            value={formatDateTime(trip.expectedDeliveryDate)}
          />
          <InfoRow icon={PackageIcon} label="نوع الحمولة" value={`${trip.cargoType} (${trip.cargoWeightTons.toString()} طن)`} />
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">قيمة الرحلة</span>
            <span className="font-bold">{formatSAR(trip.value.toString())}</span>
          </div>
          {trip.notes && (
            <>
              <Separator />
              <p className="text-muted-foreground text-xs">{trip.notes}</p>
            </>
          )}
        </CardContent>
      </Card>

      <TripStatusActions tripId={trip.id} currentStatus={trip.status} canCancel={false} />

      {showProofUpload && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">إثبات التسليم</CardTitle>
          </CardHeader>
          <CardContent>
            <ProofOfDelivery tripId={trip.id} currentUrl={trip.proofOfDeliveryUrl ?? ""} />
          </CardContent>
        </Card>
      )}

      {trip.truck && <ReportFaultDialog truckId={trip.truck.id} truckLabel={trip.truck.internalNumber} />}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">السجل الزمني</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {trip.statusHistory.map((h) => (
              <li key={h.id} className="text-sm border-r-2 border-primary/30 pr-3">
                <p className="font-medium">{TRIP_STATUS_LABELS[h.toStatus]}</p>
                <p className="text-muted-foreground text-xs">{formatDateTime(h.changedAt)}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
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
    <div className="flex items-center gap-2">
      <Icon className="size-4 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
