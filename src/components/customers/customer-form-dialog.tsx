"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { LoaderCircleIcon, PlusIcon, PencilIcon } from "lucide-react";

import { customerSchema, type CustomerInput } from "@/lib/validations/customer";
import { createCustomerAction, updateCustomerAction } from "@/lib/actions/customers";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type CustomerRecord = {
  id: string;
  name: string;
  commercialRegister: string | null;
  taxNumber: string | null;
  contactName: string | null;
  phone: string;
  email: string | null;
  address: string | null;
};

export function CustomerFormDialog({ customer }: { customer?: CustomerRecord }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = !!customer;

  const form = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customer?.name ?? "",
      commercialRegister: customer?.commercialRegister ?? "",
      taxNumber: customer?.taxNumber ?? "",
      contactName: customer?.contactName ?? "",
      phone: customer?.phone ?? "",
      email: customer?.email ?? "",
      address: customer?.address ?? "",
    },
  });

  async function onSubmit(values: CustomerInput) {
    setIsSubmitting(true);
    const result = isEdit
      ? await updateCustomerAction(customer!.id, values)
      : await createCustomerAction(values);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? "تم تعديل بيانات العميل" : "تمت إضافة العميل بنجاح");
    setOpen(false);
    form.reset();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={isEdit ? "outline" : "default"} size={isEdit ? "sm" : "default"}>
          {isEdit ? <PencilIcon /> : <PlusIcon />}
          {isEdit ? "تعديل" : "إضافة عميل"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "تعديل بيانات العميل" : "إضافة عميل جديد"}</DialogTitle>
          <DialogDescription>الحقول المعلمة بـ * مطلوبة</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم العميل / الشركة *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="commercialRegister"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم السجل التجاري</FormLabel>
                    <FormControl>
                      <Input dir="ltr" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="taxNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الرقم الضريبي</FormLabel>
                    <FormControl>
                      <Input dir="ltr" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم مسؤول التواصل</FormLabel>
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني</FormLabel>
                    <FormControl>
                      <Input dir="ltr" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>العنوان</FormLabel>
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
                {isEdit ? "حفظ التعديلات" : "إضافة العميل"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
