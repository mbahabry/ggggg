import Link from "next/link";
import { PlusIcon, InboxIcon, UserCheckIcon, TruckIcon } from "lucide-react";

import { requirePermission } from "@/lib/require-auth";
import { getUnassignedTrips, getAvailableDriversAndTrucks } from "@/lib/queries/trips";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterSelect } from "@/components/shared/filter-select";
import { AssignTripDialog } from "@/components/trips/assign-trip-dialog";
import { formatSAR, formatDateTime } from "@/lib/format";

const CITIES = [
  "الرياض",
  "جدة",
  "الدمام",
  "بريدة",
  "المدينة المنورة",
  "مكة المكرمة",
  "الجبيل",
  "ينبع",
  "الخبر",
  "تبوك",
  "حائل",
  "أبها",
];

export default async function DispatchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("manageTrips");
  const sp = await searchParams;
  const city = typeof sp.city === "string" ? sp.city : undefined;

  const [unassignedTrips, { drivers, trucks }] = await Promise.all([
    getUnassignedTrips({ city }),
    getAvailableDriversAndTrucks(),
  ]);

  const cityOptions = CITIES.map((c) => ({ value: c, label: c }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">التخطيط والتوزيع</h1>
          <p className="text-muted-foreground text-sm mt-1">
            تعيين السائقين والشاحنات للرحلات غير المعينة
          </p>
        </div>
        <Button asChild>
          <Link href="/trips/new">
            <PlusIcon />
            إنشاء رحلة
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <InboxIcon className="size-4" />
                رحلات بحاجة إلى تعيين ({unassignedTrips.length})
              </CardTitle>
              <CardDescription>رحلات في حالة مسودة لم يتم تعيين سائق وشاحنة لها بعد</CardDescription>
            </div>
            <FilterSelect paramKey="city" placeholder="المدينة" options={cityOptions} className="w-40" />
          </CardHeader>
          <CardContent>
            {unassignedTrips.length === 0 ? (
              <EmptyState
                icon={InboxIcon}
                title="لا توجد رحلات بانتظار التعيين"
                description="جميع الرحلات الحالية تم تعيين سائق وشاحنة لها"
              />
            ) : (
              <div className="space-y-3">
                {unassignedTrips.map((trip) => (
                  <div
                    key={trip.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/trips/${trip.id}`} className="font-medium hover:underline">
                          {trip.tripNumber}
                        </Link>
                        <Badge variant="secondary">{trip.customer.name}</Badge>
                      </div>
                      <p className="text-muted-foreground text-xs mt-1">
                        {trip.originCity} ← {trip.destinationCity} · {formatDateTime(trip.pickupDateTime)} ·{" "}
                        {formatSAR(trip.value.toString())}
                      </p>
                    </div>
                    <AssignTripDialog tripId={trip.id} drivers={drivers} trucks={trucks} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserCheckIcon className="size-4" />
                سائقون متاحون ({drivers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {drivers.length === 0 ? (
                <p className="text-muted-foreground text-sm">لا يوجد سائقون متاحون حاليا</p>
              ) : (
                <ul className="space-y-1.5 max-h-64 overflow-y-auto">
                  {drivers.map((d) => (
                    <li key={d.id} className="text-sm flex items-center justify-between">
                      <Link href={`/drivers/${d.id}`} className="hover:underline">
                        {d.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TruckIcon className="size-4" />
                شاحنات متاحة ({trucks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trucks.length === 0 ? (
                <p className="text-muted-foreground text-sm">لا توجد شاحنات متاحة حاليا</p>
              ) : (
                <ul className="space-y-1.5 max-h-64 overflow-y-auto">
                  {trucks.map((t) => (
                    <li key={t.id} className="text-sm flex items-center justify-between">
                      <Link href={`/trucks/${t.id}`} className="hover:underline">
                        {t.internalNumber}
                      </Link>
                      <span className="text-muted-foreground text-xs">{t.truckType}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
