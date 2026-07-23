"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { LoaderCircleIcon, PlusIcon, PencilIcon } from "lucide-react";

import { truckSchema, type TruckInput, type TruckFormInput } from "@/lib/validations/truck";
import { createTruckAction, updateTruckAction } from "@/lib/actions/trucks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ImageUpload } from "@/components/shared/image-upload";
import { TRUCK_STATUS_LABELS } from "@/lib/status-labels";

type TruckRecord = {
  id: string;
  internalNumber: string;
  plateNumber: string;
  truckType: string;
  model: string;
  year: number;
  capacityTons: string;
  chassisNumber: string;
  odometerKm: number;
  status: TruckInput["status"];
  formExpiry: string;
  insuranceExpiry: string;
  inspectionExpiry: string;
  imageUrl: string | null;
  notes: string | null;
};

function toDateInputValue(value: string) {
  return value ? value.slice(0, 10) : "";
}

export function TruckFormDialog({ truck }: { truck?: TruckRecord }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = !!truck;

  const form = useForm<TruckFormInput, unknown, TruckInput>({
    resolver: zodResolver(truckSchema),
    defaultValues: {
      internalNumber: truck?.internalNumber ?? "",
      plateNumber: truck?.plateNumber ?? "",
      truckType: truck?.truckType ?? "",
      model: truck?.model ?? "",
      year: truck?.year ?? new Date().getFullYear(),
      capacityTons: truck ? Number(truck.capacityTons) : undefined,
      chassisNumber: truck?.chassisNumber ?? "",
      odometerKm: truck?.odometerKm ?? 0,
      status: truck?.status ?? "AVAILABLE",
      formExpiry: toDateInputValue(truck?.formExpiry ?? ""),
      insuranceExpiry: toDateInputValue(truck?.insuranceExpiry ?? ""),
      inspectionExpiry: toDateInputValue(truck?.inspectionExpiry ?? ""),
      imageUrl: truck?.imageUrl ?? "",
      notes: truck?.notes ?? "",
    },
  });

  async function onSubmit(values: TruckInput) {
    setIsSubmitting(true);
    const result = isEdit
      ? await updateTruckAction(truck!.id, values)
      : await createTruckAction(values);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? "تم تعديل بيانات الشاحنة" : "تمت إضافة الشاحنة بنجاح");
    setOpen(false);
    form.reset();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={isEdit ? "outline" : "default"} size={isEdit ? "sm" : "default"}>
          {isEdit ? <PencilIcon /> : <PlusIcon />}
          {isEdit ? "تعديل" : "إضافة شاحنة"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "تعديل بيانات الشاحنة" : "إضافة شاحنة جديدة"}</DialogTitle>
          <DialogDescription>الحقول المعلمة بـ * مطلوبة</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="internalNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الرقم الداخلي *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="plateNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم اللوحة *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="truckType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع الشاحنة *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="مثال: مسطحة" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الموديل *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>سنة الصنع *</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={field.value as number} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="capacityTons"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>سعة الحمولة (طن) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} value={field.value as number} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="chassisNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الهيكل *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="odometerKm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>قراءة العداد (كم)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={field.value as number} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>حالة الشاحنة *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(TRUCK_STATUS_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="formExpiry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>انتهاء الاستمارة *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="insuranceExpiry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>انتهاء التأمين *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="inspectionExpiry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الفحص الدوري *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>صورة الشاحنة</FormLabel>
                  <FormControl>
                    <ImageUpload value={field.value ?? ""} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <LoaderCircleIcon className="animate-spin" />}
                {isEdit ? "حفظ التعديلات" : "إضافة الشاحنة"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
