import Link from "next/link";
import {
  TruckIcon,
  CheckCircle2Icon,
  WrenchIcon,
  UsersIcon,
  UserCheckIcon,
  CalendarIcon,
  AlertTriangleIcon,
  WalletIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  FileWarningIcon,
} from "lucide-react";

import { requirePermission } from "@/lib/require-auth";
import { getDashboardData } from "@/lib/queries/dashboard";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { TripStatusBadge, DelayedBadge } from "@/components/shared/status-badge";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { TripStatusChart } from "@/components/dashboard/trip-status-chart";
import { EmptyState } from "@/components/shared/empty-state";
import { formatSAR, formatDateTime } from "@/lib/format";
import { computeIsDelayed } from "@/lib/business/trip-rules";

export default async function DashboardPage() {
  await requirePermission("viewDashboard");
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">لوحة التحكم</h1>
        <p className="text-muted-foreground text-sm mt-1">نظرة عامة على أداء الأسطول والعمليات</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        <StatCard title="إجمالي الشاحنات" value={data.truck.total} icon={TruckIcon} />
        <StatCard
          title="الشاحنات المتاحة"
          value={data.truck.available}
          icon={CheckCircle2Icon}
          tone="success"
        />
        <StatCard title="الشاحنات في رحلة" value={data.truck.onTrip} icon={TruckIcon} />
        <StatCard
          title="الشاحنات تحت الصيانة"
          value={data.truck.maintenance}
          icon={WrenchIcon}
          tone="warning"
        />
        <StatCard title="إجمالي السائقين" value={data.driver.total} icon={UsersIcon} />
        <StatCard
          title="السائقون المتاحون"
          value={data.driver.available}
          icon={UserCheckIcon}
          tone="success"
        />
        <StatCard title="رحلات اليوم" value={data.tripsToday} icon={CalendarIcon} />
        <StatCard
          title="رحلات متأخرة"
          value={data.delayedTrips}
          icon={AlertTriangleIcon}
          tone={data.delayedTrips > 0 ? "destructive" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard
          title="الإيرادات الشهرية"
          value={formatSAR(data.monthRevenue)}
          icon={TrendingUpIcon}
          tone="success"
        />
        <StatCard
          title="المصروفات الشهرية"
          value={formatSAR(data.monthExpense)}
          icon={TrendingDownIcon}
          tone="destructive"
        />
        <StatCard
          title="صافي الربح"
          value={formatSAR(data.netProfit)}
          icon={WalletIcon}
          tone={data.netProfit >= 0 ? "success" : "destructive"}
        />
      </div>

      {data.expiringDocsCount > 0 && (
        <Link href="/alerts">
          <Card className="border-warning/50 bg-warning/10 hover:bg-warning/15 transition-colors py-3">
            <CardContent className="px-4 flex items-center gap-3">
              <FileWarningIcon className="size-5 text-warning shrink-0" />
              <p className="text-sm">
                يوجد <span className="font-bold">{data.expiringDocsCount}</span> مستند قارب على
                الانتهاء (رخص، استمارات، تأمين، فحص دوري) — اضغط لعرض التفاصيل
              </p>
            </CardContent>
          </Card>
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>الإيرادات والمصروفات خلال آخر 6 أشهر</CardTitle>
            <CardDescription>بالريال السعودي</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={data.revenueChartData} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>حالات الرحلات</CardTitle>
            <CardDescription>التوزيع الحالي لكل الرحلات</CardDescription>
          </CardHeader>
          <CardContent>
            <TripStatusChart data={data.tripStatusData} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>أحدث الرحلات</CardTitle>
          <CardDescription>آخر الرحلات التي تم إنشاؤها في النظام</CardDescription>
        </CardHeader>
        <CardContent>
          {data.latestTrips.length === 0 ? (
            <EmptyState title="لا توجد رحلات بعد" description="ابدأ بإنشاء أول رحلة لعرضها هنا" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الرحلة</TableHead>
                    <TableHead>العميل</TableHead>
                    <TableHead>المسار</TableHead>
                    <TableHead>السائق</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>تاريخ الإنشاء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.latestTrips.map((trip) => (
                    <TableRow key={trip.id}>
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
                      <TableCell className="flex items-center gap-1.5">
                        <TripStatusBadge status={trip.status} />
                        {computeIsDelayed(trip) && <DelayedBadge />}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatDateTime(trip.createdAt)}
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
