"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckIcon, RefreshCwIcon, LoaderCircleIcon } from "lucide-react";

import { markAlertResolvedAction, refreshAlertsAction } from "@/lib/actions/alerts";
import { Button } from "@/components/ui/button";

export function ResolveAlertButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const result = await markAlertResolvedAction(id);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("تم إغلاق التنبيه");
    router.refresh();
  }

  return (
    <Button size="sm" variant="outline" onClick={handleClick} disabled={loading}>
      {loading ? <LoaderCircleIcon className="animate-spin" /> : <CheckIcon />}
      تحديد كمعالج
    </Button>
  );
}

export function RefreshAlertsButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await refreshAlertsAction();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("تم تحديث التنبيهات");
      router.refresh();
    });
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={isPending}>
      {isPending ? <LoaderCircleIcon className="animate-spin" /> : <RefreshCwIcon />}
      تحديث التنبيهات
    </Button>
  );
}
