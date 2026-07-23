import { z } from "zod";

export const userSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  phone: z.string().optional().or(z.literal("")),
  role: z.enum(["ADMIN", "OPS_MANAGER", "ACCOUNTANT", "MAINTENANCE", "DRIVER"]),
  password: z.string().min(6, "كلمة المرور يجب ألا تقل عن 6 أحرف").optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  driverId: z.string().optional().or(z.literal("")),
});

export type UserInput = z.infer<typeof userSchema>;
export type UserFormInput = z.input<typeof userSchema>;
