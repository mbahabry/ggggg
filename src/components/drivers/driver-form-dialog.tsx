"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { LoaderCircleIcon, PlusIcon, PencilIcon } from "lucide-react";

import { driverSchema, type DriverInput, type DriverFormInput } from "@/lib/validations/driver";
import { createDriverAction, updateDriverAction } from "@/lib/actions/drivers";
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
import { DRIVER_STATUS_LABELS } from "@/lib/status-labels";

type DriverRecord = {
  id: string;
  name: string;
  phone: string;
  nationalId: string;
  nationality: string;
  licenseNumber: string;
  licenseExpiry: string;
  status: DriverInput["status"];
  truckId: string | null;
  rating: string;
  violationsCount: number;
  notes: string | null;
};

export function DriverFormDialog({
  driver,
  trucks,
}: {
  driver?: DriverRecord;
  trucks: { id: string; internalNumber: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = !!driver;

  const form = useForm<DriverFormInput, unknown, DriverInput>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      name: driver?.name ?? "",
      phone: driver?.phone ?? "",
      nationalId: driver?.nationalId ?? "",
      nationality: driver?.nationality ?? "",
      licenseNumber: driver?.licenseNumber ?? "",
      licenseExpiry: driver?.licenseExpiry ? driver.licenseExpiry.slice(0, 10) : "",
      status: driver?.status ?? "AVAILABLE",
      truckId: driver?.truckId ?? "",
      rating: driver ? Number(driver.rating) : 5,
      violationsCount: driver?.violationsCount ?? 0,
      notes: driver?.notes ?? "",
    },
  });

  async function onSubmit(values: DriverInput) {
    setIsSubmitting(true);
    const result = isEdit
      ? await updateDriverAction(driver!.id, values)
      : await createDriverAction(values);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? "تم تعديل بيانات السائق" : "تمت إضافة السائق بنجاح");
    setOpen(false);
    form.reset();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={isEdit ? "outline" : "default"} size={isEdit ? "sm" : "default"}>
          {isEdit ? <PencilIcon /> : <PlusIcon />}
          {isEdit ? "تعديل" : "إضافة سائق"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "تعديل بيانات السائق" : "إضافة سائق جديد"}</DialogTitle>
          <DialogDescription>الحقول المعلمة بـ * مطلوبة</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الجوال *</FormLabel>
                    <FormControl>
                      <Input dir="ltr" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nationalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الهوية / الإقامة *</FormLabel>
                    <FormControl>
                      <Input dir="ltr" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الجنسية *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="licenseNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم رخصة القيادة *</FormLabel>
                    <FormControl>
                      <Input dir="ltr" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="licenseExpiry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ انتهاء الرخصة *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                    <FormLabel>حالة السائق *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(DRIVER_STATUS_LABELS).map(([value, label]) => (
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
              <FormField
                control={form.control}
                name="truckId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الشاحنة المخصصة</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="بدون تخصيص" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {trucks.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.internalNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تقييم الأداء (0-5)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        {...field}
                        value={field.value as number}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="violationsCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عدد المخالفات</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} value={field.value as number} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                {isEdit ? "حفظ التعديلات" : "إضافة السائق"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
