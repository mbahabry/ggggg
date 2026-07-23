"use client";

import { useEffect } from "react";
import { TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <TriangleAlertIcon className="size-8 text-destructive" />
      </div>
      <h1 className="text-xl font-bold">حدث خطأ غير متوقع</h1>
      <p className="text-muted-foreground text-sm max-w-sm">
        نأسف على الإزعاج، حدث خطأ أثناء تحميل هذه الصفحة. يمكنك المحاولة مرة أخرى.
      </p>
      <Button onClick={() => reset()}>إعادة المحاولة</Button>
    </div>
  );
}
