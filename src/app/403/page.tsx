import Link from "next/link";
import { ShieldXIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <ShieldXIcon className="size-8 text-destructive" />
      </div>
      <h1 className="text-xl font-bold">لا تملك صلاحية الوصول</h1>
      <p className="text-muted-foreground text-sm max-w-sm">
        حسابك الحالي لا يملك الصلاحية اللازمة لعرض هذه الصفحة. تواصل مع مدير النظام إذا كنت تعتقد أن هذا خطأ.
      </p>
      <Button asChild>
        <Link href="/">العودة إلى الرئيسية</Link>
      </Button>
    </div>
  );
}
