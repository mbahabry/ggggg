"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LoaderCircleIcon } from "lucide-react";

import { updateTripStatusAction, cancelTripAction } from "@/lib/actions/trips";
import { TRIP_TRANSITIONS } from "@/lib/business/trip-rules";
import { TRIP_STATUS_LABELS } from "@/lib/status-labels";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { TripStatus } from "@/generated/prisma/client";

export function TripStatusActions({
  tripId,
  currentStatus,
  canCancel,
}: {
  tripId: string;
  currentStatus: TripStatus;
  canCancel: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<TripStatus | null>(null);

  const nextStatuses = TRIP_TRANSITIONS[currentStatus].filter((s) => s !== "CANCELLED");
  const canCancelNow = canCancel && TRIP_TRANSITIONS[currentStatus].includes("CANCELLED");

  async function handleTransition(status: TripStatus) {
    setLoading(status);
    const result = await updateTripStatusAction({ tripId, status });
    setLoading(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(`تم تحديث حالة الرحلة إلى "${TRIP_STATUS_LABELS[status]}"`);
    router.refresh();
  }

  async function handleCancel() {
    setLoading("CANCELLED");
    const result = await cancelTripAction(tripId);
    setLoading(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("تم إلغاء الرحلة");
    router.refresh();
  }

  if (nextStatuses.length === 0 && !canCancelNow) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {nextStatuses.map((status) => (
        <Button key={status} size="sm" onClick={() => handleTransition(status)} disabled={loading !== null}>
          {loading === status && <LoaderCircleIcon className="animate-spin" />}
          {status === "DRAFT" ? "رفض الرحلة" : `تحديث إلى: ${TRIP_STATUS_LABELS[status]}`}
        </Button>
      ))}
      {canCancelNow && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="destructive" disabled={loading !== null}>
              إلغاء الرحلة
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد إلغاء الرحلة</AlertDialogTitle>
              <AlertDialogDescription>
                سيتم إلغاء الرحلة وتحرير السائق والشاحنة المرتبطين بها. هل أنت متأكد؟
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>تراجع</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancel}>تأكيد الإلغاء</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
