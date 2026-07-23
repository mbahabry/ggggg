"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { LoaderCircleIcon, PlusIcon } from "lucide-react";

import {
  maintenanceSchema,
  type MaintenanceInput,
  type MaintenanceFormInput,
} from "@/lib/validations/maintenance";
import { createMaintenanceAction } from "@/lib/actions/maintenance";
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
import { MAINTENANCE_PRIORITY_LABELS } from "@/lib/status-labels";

export function MaintenanceFormDialog({
  trucks,
}: {
  trucks: { id: string; internalNumber: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MaintenanceFormInput, unknown, MaintenanceInput>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      truckId: "",
      faultType: "",
      description: "",
      priority: "MEDIUM",
      serviceCenter: "",
      cost: undefined,
      nextMaintenanceDate: "",
      odometerAtService: undefined,
    },
  });

  async function onSubmit(values: MaintenanceInput) {
    setIsSubmitting(true);
    const result = await createMaintenanceAction(values);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("تم إنشاء بلاغ الصيانة بنجاح");
    setOpen(false);
    form.reset();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon />
          بلاغ عطل جديد
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>إنشاء بلاغ عطل / طلب صيانة</DialogTitle>
          <DialogDescription>الحقول المعلمة بـ * مطلوبة</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="truckId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الشاحنة *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="اختر الشاحنة" />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="faultType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع العطل *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="مثال: عطل في المحرك" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الأولوية *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(MAINTENANCE_PRIORITY_LABELS).map(([value, label]) => (
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
                  <FormLabel>وصف العطل *</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="serviceCenter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>مركز الصيانة</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                إنشاء البلاغ
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
