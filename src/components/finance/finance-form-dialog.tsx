"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { LoaderCircleIcon, PlusIcon } from "lucide-react";

import { financeSchema, type FinanceInput, type FinanceFormInput } from "@/lib/validations/finance";
import { createFinanceAction } from "@/lib/actions/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { FINANCE_TYPE_LABELS, FINANCE_CATEGORY_LABELS } from "@/lib/status-labels";

export function FinanceFormDialog({
  customers,
  trucks,
  drivers,
}: {
  customers: { id: string; name: string }[];
  trucks: { id: string; internalNumber: string }[];
  drivers: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FinanceFormInput, unknown, FinanceInput>({
    resolver: zodResolver(financeSchema),
    defaultValues: {
      type: "REVENUE",
      category: "TRIP_REVENUE",
      amount: undefined,
      description: "",
      date: new Date().toISOString().slice(0, 10),
      customerId: "",
      truckId: "",
      driverId: "",
      tripId: "",
      isPaid: true,
      dueDate: "",
    },
  });

  const type = form.watch("type");

  async function onSubmit(values: FinanceInput) {
    setIsSubmitting(true);
    const result = await createFinanceAction(values);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("تمت إضافة الحركة المالية بنجاح");
    setOpen(false);
    form.reset();
    router.refresh();
  }

  const categoryOptions =
    type === "REVENUE"
      ? [["TRIP_REVENUE", FINANCE_CATEGORY_LABELS.TRIP_REVENUE]]
      : Object.entries(FINANCE_CATEGORY_LABELS).filter(([k]) => k !== "TRIP_REVENUE");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon />
          إضافة حركة مالية
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>إضافة حركة مالية</DialogTitle>
          <DialogDescription>الحقول المعلمة بـ * مطلوبة</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>النوع *</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v);
                        form.setValue("category", v === "REVENUE" ? "TRIP_REVENUE" : "FUEL");
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(FINANCE_TYPE_LABELS).map(([value, label]) => (
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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>التصنيف *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoryOptions.map(([value, label]) => (
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
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الوصف *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المبلغ (ر.س) *</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} value={field.value as number} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>التاريخ *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>العميل</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="بدون" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
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
                    <FormLabel>الشاحنة</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="بدون" />
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
                name="driverId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>السائق</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="بدون" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {drivers.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <FormLabel>تم السداد بالكامل؟</FormLabel>
                <p className="text-xs text-muted-foreground mt-0.5">
                  إذا لم يتم السداد بعد، يمكنك تحديد تاريخ استحقاق
                </p>
              </div>
              <FormField
                control={form.control}
                name="isPaid"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
            {!form.watch("isPaid") && (
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ الاستحقاق</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <LoaderCircleIcon className="animate-spin" />}
                حفظ
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
