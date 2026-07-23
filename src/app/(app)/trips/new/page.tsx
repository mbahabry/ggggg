import { requirePermission } from "@/lib/require-auth";
import { prisma } from "@/lib/prisma";
import { TripForm } from "@/components/trips/trip-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function NewTripPage() {
  await requirePermission("manageTrips");

  const [customers, drivers, trucks] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.driver.findMany({
      where: { status: "AVAILABLE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.truck.findMany({
      where: { status: "AVAILABLE" },
      orderBy: { internalNumber: "asc" },
      select: { id: true, internalNumber: true, truckType: true },
    }),
  ]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">إنشاء رحلة جديدة</h1>
        <p className="text-muted-foreground text-sm mt-1">
          أدخل بيانات الرحلة، ويمكنك تعيين السائق والشاحنة الآن أو لاحقا من شاشة التوزيع
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>بيانات الرحلة</CardTitle>
          <CardDescription>الحقول المعلمة بـ * مطلوبة</CardDescription>
        </CardHeader>
        <CardContent>
          <TripForm customers={customers} drivers={drivers} trucks={trucks} />
        </CardContent>
      </Card>
    </div>
  );
}
