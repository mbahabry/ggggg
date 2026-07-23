import { requireSession } from "@/lib/require-auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ROLE_LABELS } from "@/lib/permissions";
import { formatDate } from "@/lib/format";
import { ThemeToggleCard } from "@/components/settings/theme-toggle-card";

export default async function SettingsPage() {
  const session = await requireSession();

  const [truckCount, driverCount, customerCount, tripCount] = await Promise.all([
    prisma.truck.count(),
    prisma.driver.count(),
    prisma.customer.count(),
    prisma.trip.count(),
  ]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">الإعدادات</h1>
        <p className="text-muted-foreground text-sm mt-1">إعدادات الحساب والنظام</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>بيانات الحساب</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">الاسم</span>
            <span className="font-medium">{session.user.name}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">البريد الإلكتروني</span>
            <span dir="ltr" className="font-medium">{session.user.email}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">الدور</span>
            <Badge variant="outline">{ROLE_LABELS[session.user.role]}</Badge>
          </div>
        </CardContent>
      </Card>

      <ThemeToggleCard />

      <Card>
        <CardHeader>
          <CardTitle>بيانات الشركة</CardTitle>
          <CardDescription>انتيفات بلس للنقليات</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">إجمالي الشاحنات</p>
            <p className="font-bold text-lg">{truckCount}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">إجمالي السائقين</p>
            <p className="font-bold text-lg">{driverCount}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">إجمالي العملاء</p>
            <p className="font-bold text-lg">{customerCount}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">إجمالي الرحلات</p>
            <p className="font-bold text-lg">{tripCount}</p>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        نظام إدارة الأسطول — انتيفات بلس للنقليات · تاريخ اليوم {formatDate(new Date())}
      </p>
    </div>
  );
}
