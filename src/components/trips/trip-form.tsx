"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { LoaderCircleIcon } from "lucide-react";

import { tripSchema, type TripInput, type TripFormInput } from "@/lib/validations/trip";
import { createTrip } from "@/lib/actions/trips";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  FormDescription,
} from "@/components/ui/form";

const CITIES = [
  "الرياض",
  "جدة",
  "الدمام",
  "بريدة",
  "المدينة المنورة",
  "مكة المكرمة",
  "الجبيل",
  "ينبع",
  "الخبر",
  "تبوك",
  "حائل",
  "أبها",
];

export function TripForm({
  customers,
  drivers,
  trucks,
}: {
  customers: { id: string; name: string }[];
  drivers: { id: string; name: string }[];
  trucks: { id: string; internalNumber: string; truckType: string }[];
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TripFormInput, unknown, TripInput>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      customerId: "",
      originCity: "",
      originAddress: "",
      destinationCity: "",
      destinationAddress: "",
      pickupDateTime: "",
      expectedDeliveryDate: "",
      cargoType: "",
      cargoWeightTons: undefined,
      value: undefined,
      driverId: "",
      truckId: "",
      notes: "",
    },
  });

  async function onSubmit(values: TripInput) {
    setIsSubmitting(true);
    const result = await createTrip(values);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("تم إنشاء الرحلة بنجاح");
    router.push(`/trips/${result.data.id}`);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="customerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>العميل *</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر العميل" />
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="originCity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>مدينة التحميل *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="اختر المدينة" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CITIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
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
            name="destinationCity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>مدينة التسليم *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="اختر المدينة" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CITIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="originAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>عنوان التحميل التفصيلي</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="destinationAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>عنوان التسليم التفصيلي</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="pickupDateTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>تاريخ ووقت التحميل *</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="expectedDeliveryDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>تاريخ التسليم المتوقع *</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="cargoType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>نوع الحمولة *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="مثال: مواد غذائية" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cargoWeightTons"
            render={({ field }) => (
              <FormItem>
                <FormLabel>وزن الحمولة (طن) *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" min="0" {...field} value={field.value as number} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>قيمة الرحلة (ر.س) *</FormLabel>
                <FormControl>
                  <Input type="number" step="1" min="0" {...field} value={field.value as number} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="driverId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>السائق (اختياري الآن)</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="بدون تعيين" />
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
                <FormDescription>يمكن تعيينه لاحقا من شاشة التخطيط والتوزيع</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="truckId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الشاحنة (اختياري الآن)</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="بدون تعيين" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {trucks.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.internalNumber} — {t.truckType}
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
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ملاحظات</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            إلغاء
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <LoaderCircleIcon className="animate-spin" />}
            إنشاء الرحلة
          </Button>
        </div>
      </form>
    </Form>
  );
}
