"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LoaderCircleIcon, TriangleAlertIcon } from "lucide-react";

import { createMaintenanceAction } from "@/lib/actions/maintenance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { MAINTENANCE_PRIORITY_LABELS } from "@/lib/status-labels";
import type { MaintenancePriority } from "@/generated/prisma/client";

export function ReportFaultDialog({ truckId, truckLabel }: { truckId: string; truckLabel: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [faultType, setFaultType] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<MaintenancePriority>("MEDIUM");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!faultType || !description) {
      setError("يرجى تعبئة نوع العطل والوصف");
      return;
    }
    setError(null);
    setLoading(true);
    const result = await createMaintenanceAction({ truckId, faultType, description, priority });
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    toast.success("تم إرسال بلاغ العطل بنجاح");
    setOpen(false);
    setFaultType("");
    setDescription("");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <TriangleAlertIcon />
          الإبلاغ عن عطل بالشاحنة {truckLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>الإبلاغ عن عطل</DialogTitle>
          <DialogDescription>سيتم إشعار قسم الصيانة فور إرسال البلاغ</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>نوع العطل</Label>
            <Input value={faultType} onChange={(e) => setFaultType(e.target.value)} placeholder="مثال: عطل في الفرامل" />
          </div>
          <div className="space-y-1.5">
            <Label>الأولوية</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as MaintenancePriority)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MAINTENANCE_PRIORITY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>وصف العطل</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <LoaderCircleIcon className="animate-spin" />}
            إرسال البلاغ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
