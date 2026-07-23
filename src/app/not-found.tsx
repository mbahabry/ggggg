import Link from "next/link";
import { SearchXIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 text-center" dir="rtl">
      <div className="rounded-full bg-muted p-4">
        <SearchXIcon className="size-8 text-muted-foreground" />
      </div>
      <h1 className="text-xl font-bold">الصفحة غير موجودة</h1>
      <p className="text-muted-foreground text-sm max-w-sm">
        الصفحة التي تحاول الوصول إليها غير موجودة أو تم نقلها.
      </p>
      <Button asChild>
        <Link href="/">العودة إلى الرئيسية</Link>
      </Button>
    </div>
  );
}
