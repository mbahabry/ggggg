import { requirePermission } from "@/lib/require-auth";
import {
  getReportByCustomer,
  getReportByTruck,
  getReportByDriver,
  getMonthlyReport,
} from "@/lib/queries/finance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { formatSAR } from "@/lib/format";

export default async function ReportsPage() {
  await requirePermission("viewReports");

  const [byCustomer, byTruck, byDriver, monthly] = await Promise.all([
    getReportByCustomer(),
    getReportByTruck(),
    getReportByDriver(),
    getMonthlyReport(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">التقارير</h1>
        <p className="text-muted-foreground text-sm mt-1">تقارير مالية مفصلة حسب العميل والشاحنة والسائق والشهر</p>
      </div>

      <Tabs defaultValue="monthly">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="monthly">التقرير الشهري</TabsTrigger>
          <TabsTrigger value="customer">حسب العميل</TabsTrigger>
          <TabsTrigger value="truck">حسب الشاحنة</TabsTrigger>
          <TabsTrigger value="driver">حسب السائق</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>الإيرادات والمصروفات خلال آخر 12 شهرا</CardTitle>
              <CardDescription>بالريال السعودي</CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueChart
                data={monthly.map((m) => ({ month: m.month, revenue: m.revenue, expense: m.expense }))}
              />
              <div className="overflow-x-auto mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الشهر</TableHead>
                      <TableHead>الإيرادات</TableHead>
                      <TableHead>المصروفات</TableHead>
                      <TableHead>صافي الربح</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthly.map((m) => (
                      <TableRow key={m.month}>
                        <TableCell>{m.month}</TableCell>
                        <TableCell className="text-success">{formatSAR(m.revenue)}</TableCell>
                        <TableCell className="text-destructive">{formatSAR(m.expense)}</TableCell>
                        <TableCell className={m.net >= 0 ? "text-success font-medium" : "text-destructive font-medium"}>
                          {formatSAR(m.net)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customer" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>تقرير الإيرادات حسب العميل</CardTitle>
            </CardHeader>
            <CardContent>
              {byCustomer.length === 0 ? (
                <EmptyState title="لا توجد بيانات كافية" />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>العميل</TableHead>
                        <TableHead>عدد الحركات</TableHead>
                        <TableHead>إجمالي الإيرادات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {byCustomer.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell>{c.transactionsCount}</TableCell>
                          <TableCell className="text-success font-medium">{formatSAR(c.totalRevenue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="truck" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>تقرير الأداء المالي حسب الشاحنة</CardTitle>
            </CardHeader>
            <CardContent>
              {byTruck.length === 0 ? (
                <EmptyState title="لا توجد بيانات كافية" />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الشاحنة</TableHead>
                        <TableHead>الإيرادات</TableHead>
                        <TableHead>المصروفات</TableHead>
                        <TableHead>صافي الربح</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {byTruck.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium">{t.internalNumber}</TableCell>
                          <TableCell className="text-success">{formatSAR(t.revenue)}</TableCell>
                          <TableCell className="text-destructive">{formatSAR(t.expense)}</TableCell>
                          <TableCell className={t.net >= 0 ? "text-success font-medium" : "text-destructive font-medium"}>
                            {formatSAR(t.net)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="driver" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>تقرير الإيرادات حسب السائق</CardTitle>
            </CardHeader>
            <CardContent>
              {byDriver.length === 0 ? (
                <EmptyState title="لا توجد بيانات كافية" />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>السائق</TableHead>
                        <TableHead>عدد الحركات</TableHead>
                        <TableHead>إجمالي الإيرادات المحققة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {byDriver.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell className="font-medium">{d.name}</TableCell>
                          <TableCell>{d.transactionsCount}</TableCell>
                          <TableCell className="text-success font-medium">{formatSAR(d.totalRevenue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
