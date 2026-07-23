import Link from "next/link";
import { redirect } from "next/navigation";
import { InboxIcon, RouteIcon } from "lucide-react";

import { requireDriver } from "@/lib/require-auth";
import { getDriverOwnTrips } from "@/lib/queries/driver-portal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TripStatusBadge, DelayedBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDateTime, formatSAR } from "@/lib/format";
import { computeIsDelayed } from "@/lib/business/trip-rules";

export default async function DriverHomePage() {
  const session = await requireDriver();
  if (!session.user.driverId) redirect("/403");

  const { pendingAcceptance, active, history } = await getDriverOwnTrips(session.user.driverId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">رحلاتي</h1>
        <p className="text-muted-foreground text-sm mt-1">مرحبا {session.user.name}</p>
      </div>

      {pendingAcceptance.length > 0 && (
        <Card className="border-warning/50">
          <CardHeader>
            <CardTitle className="text-base">بانتظار موافقتك ({pendingAcceptance.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingAcceptance.map((trip) => (
              <TripRow key={trip.id} trip={trip} />
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <RouteIcon className="size-4" />
            الرحلات الجارية ({active.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {active.length === 0 ? (
            <EmptyState icon={InboxIcon} title="لا توجد رحلات جارية حاليا" />
          ) : (
            active.map((trip) => <TripRow key={trip.id} trip={trip} />)
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">سجل الرحلات ({history.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {history.length === 0 ? (
            <EmptyState title="لا يوجد سجل رحلات بعد" />
          ) : (
            history.slice(0, 15).map((trip) => <TripRow key={trip.id} trip={trip} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TripRow({
  trip,
}: {
  trip: {
    id: string;
    tripNumber: string;
    originCity: string;
    destinationCity: string;
    pickupDateTime: Date;
    value: { toString: () => string };
    status: import("@/generated/prisma/client").TripStatus;
    expectedDeliveryDate: Date;
  };
}) {
  return (
    <Link
      href={`/driver/trips/${trip.id}`}
      className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors"
    >
      <div className="min-w-0">
        <p className="font-medium text-sm">{trip.tripNumber}</p>
        <p className="text-muted-foreground text-xs mt-0.5">
          {trip.originCity} ← {trip.destinationCity}
        </p>
        <p className="text-muted-foreground text-xs">{formatDateTime(trip.pickupDateTime)}</p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <TripStatusBadge status={trip.status} />
        {computeIsDelayed(trip) && <DelayedBadge />}
        <span className="text-xs font-medium">{formatSAR(trip.value.toString())}</span>
      </div>
    </Link>
  );
}
