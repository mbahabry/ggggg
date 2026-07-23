"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LoaderCircleIcon } from "lucide-react";

import { markFinanceTransactionPaidAction } from "@/lib/actions/finance";
import { Button } from "@/components/ui/button";

export function MarkPaidButton({ id, isPaid }: { id: string; isPaid: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const result = await markFinanceTransactionPaidAction(id, !isPaid);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(isPaid ? "تم تحديد الحركة كمستحقة" : "تم تحديد الحركة كمدفوعة");
    router.refresh();
  }

  return (
    <Button size="sm" variant="outline" onClick={handleClick} disabled={loading}>
      {loading && <LoaderCircleIcon className="animate-spin" />}
      {isPaid ? "تحديد كمستحقة" : "تحديد كمدفوعة"}
    </Button>
  );
}
