"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LoaderCircleIcon, SettingsIcon } from "lucide-react";

import { updateMaintenanceStatusAction } from "@/lib/actions/maintenance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MAINTENANCE_STATUS_LABELS } from "@/lib/status-labels";
import type { MaintenanceStatus } from "@/generated/prisma/client";

export function MaintenanceStatusDialog({
  requestId,
  currentStatus,
}: {
  requestId: string;
  currentStatus: MaintenanceStatus;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<MaintenanceStatus>(currentStatus);
  const [cost, setCost] = useState("");
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState("");
  const [odometerAtService, setOdometerAtService] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    const result = await updateMaintenanceStatusAction({
      requestId,
      status,
      cost: cost ? Number(cost) : undefined,
      nextMaintenanceDate: nextMaintenanceDate || undefined,
      odometerAtService: odometerAtService ? Number(odometerAtService) : undefined,
    });
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    toast.success("تم تحديث حالة طلب الصيانة");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <SettingsIcon />
          تحديث الحالة
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تحديث حالة طلب الصيانة</DialogTitle>
          <DialogDescription>
            عند اختيار &quot;مكتمل&quot; تعود الشاحنة تلقائيا إلى حالة متاحة (ما لم تكن متوقفة)
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>الحالة</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as MaintenanceStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MAINTENANCE_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {status === "COMPLETED" && (
            <>
              <div className="space-y-1.5">
                <Label>تكلفة الصيانة (ر.س)</Label>
                <Input type="number" min="0" value={cost} onChange={(e) => setCost(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>قراءة العداد عند الصيانة (كم)</Label>
                <Input
                  type="number"
                  min="0"
                  value={odometerAtService}
                  onChange={(e) => setOdometerAtService(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>تاريخ الصيانة القادمة</Label>
                <Input
                  type="date"
                  value={nextMaintenanceDate}
                  onChange={(e) => setNextMaintenanceDate(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <LoaderCircleIcon className="animate-spin" />}
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
