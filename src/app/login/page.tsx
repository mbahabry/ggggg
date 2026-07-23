"use client";

import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { TruckIcon, LoaderCircleIcon } from "lucide-react";

import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";

const DEMO_ACCOUNTS = [
  { role: "مدير النظام", email: "admin@fleet.sa" },
  { role: "مدير التشغيل", email: "ops@fleet.sa" },
  { role: "المحاسب", email: "accountant@fleet.sa" },
  { role: "مسؤول الصيانة", email: "maintenance@fleet.sa" },
  { role: "السائق", email: "driver@fleet.sa" },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setError(null);
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
        setIsLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("حدث خطأ غير متوقع، حاول مرة أخرى");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="rounded-2xl bg-primary text-primary-foreground p-3">
            <TruckIcon className="size-7" />
          </div>
          <h1 className="text-xl font-bold">انتيفات بلس للنقليات</h1>
          <p className="text-muted-foreground text-sm">نظام إدارة الأسطول والرحلات</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>تسجيل الدخول</CardTitle>
            <CardDescription>أدخل بيانات حسابك للوصول إلى لوحة التحكم</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>البريد الإلكتروني</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="name@fleet.sa" dir="ltr" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>كلمة المرور</FormLabel>
                      <FormControl>
                        <Input type="password" dir="ltr" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <LoaderCircleIcon className="animate-spin" />}
                  تسجيل الدخول
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">حسابات تجريبية (كلمة المرور: Passw0rd!)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            {DEMO_ACCOUNTS.map((acc) => (
              <div key={acc.email} className="flex items-center justify-between gap-2">
                <span>{acc.role}</span>
                <span dir="ltr" className="font-mono">
                  {acc.email}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
