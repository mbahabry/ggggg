import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "البريد الإلكتروني مطلوب").email("بريد إلكتروني غير صالح"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export type LoginInput = z.infer<typeof loginSchema>;
