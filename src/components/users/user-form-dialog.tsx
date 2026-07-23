"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { LoaderCircleIcon, PlusIcon, PencilIcon } from "lucide-react";

import { userSchema, type UserInput, type UserFormInput } from "@/lib/validations/user";
import { createUserAction, updateUserAction } from "@/lib/actions/users";
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
  FormDescription,
} from "@/components/ui/form";
import { ROLE_LABELS } from "@/lib/permissions";

type UserRecord = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserInput["role"];
  isActive: boolean;
};

export function UserFormDialog({
  user,
  unlinkedDrivers,
}: {
  user?: UserRecord;
  unlinkedDrivers: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = !!user;

  const form = useForm<UserFormInput, unknown, UserInput>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      role: user?.role ?? "OPS_MANAGER",
      password: "",
      isActive: user?.isActive ?? true,
      driverId: "",
    },
  });

  const role = form.watch("role");

  async function onSubmit(values: UserInput) {
    setIsSubmitting(true);
    const result = isEdit ? await updateUserAction(user!.id, values) : await createUserAction(values);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? "تم تعديل بيانات المستخدم" : "تمت إضافة المستخدم بنجاح");
    setOpen(false);
    form.reset();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={isEdit ? "outline" : "default"} size={isEdit ? "sm" : "default"}>
          {isEdit ? <PencilIcon /> : <PlusIcon />}
          {isEdit ? "تعديل" : "إضافة مستخدم"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "تعديل بيانات المستخدم" : "إضافة مستخدم جديد"}</DialogTitle>
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني *</FormLabel>
                    <FormControl>
                      <Input dir="ltr" {...field} />
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
                    <FormLabel>رقم الجوال</FormLabel>
                    <FormControl>
                      <Input dir="ltr" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الدور *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(ROLE_LABELS).map(([value, label]) => (
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

            {!isEdit && role === "DRIVER" && (
              <FormField
                control={form.control}
                name="driverId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ربط بسائق موجود</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="اختر السائق" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {unlinkedDrivers.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>يجب ربط حساب السائق بسجل سائق موجود مسبقا</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isEdit ? "كلمة مرور جديدة (اختياري)" : "كلمة المرور *"}</FormLabel>
                  <FormControl>
                    <Input type="password" dir="ltr" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between rounded-lg border p-3">
              <FormLabel>الحساب مفعل</FormLabel>
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <LoaderCircleIcon className="animate-spin" />}
                {isEdit ? "حفظ التعديلات" : "إضافة المستخدم"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
