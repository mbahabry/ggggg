"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LoaderCircleIcon, UserPlusIcon } from "lucide-react";

import { assignTripAction } from "@/lib/actions/trips";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function AssignTripDialog({
  tripId,
  drivers,
  trucks,
  triggerLabel = "تعيين سائق وشاحنة",
  variant = "default",
}: {
  tripId: string;
  drivers: { id: string; name: string }[];
  trucks: { id: string; internalNumber: string; truckType: string }[];
  triggerLabel?: string;
  variant?: "default" | "outline" | "secondary";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [driverId, setDriverId] = useState("");
  const [truckId, setTruckId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAssign() {
    if (!driverId || !truckId) {
      setError("يجب اختيار السائق والشاحنة");
      return;
    }
    setError(null);
    setLoading(true);
    const result = await assignTripAction({ tripId, driverId, truckId });
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    toast.success("تم تعيين السائق والشاحنة للرحلة");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={variant}>
          <UserPlusIcon />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تعيين سائق وشاحنة</DialogTitle>
          <DialogDescription>
            يظهر فقط السائقون والشاحنات المتاحة حاليا (غير مرتبطين برحلة أخرى جارية)
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>السائق</Label>
            <Select value={driverId} onValueChange={setDriverId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="اختر السائق" />
              </SelectTrigger>
              <SelectContent>
                {drivers.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">لا يوجد سائقون متاحون</div>
                ) : (
                  drivers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>الشاحنة</Label>
            <Select value={truckId} onValueChange={setTruckId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="اختر الشاحنة" />
              </SelectTrigger>
              <SelectContent>
                {trucks.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">لا توجد شاحنات متاحة</div>
                ) : (
                  trucks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.internalNumber} — {t.truckType}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            إلغاء
          </Button>
          <Button onClick={handleAssign} disabled={loading}>
            {loading && <LoaderCircleIcon className="animate-spin" />}
            تأكيد التعيين
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
