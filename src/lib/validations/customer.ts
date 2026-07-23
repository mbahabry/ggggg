import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(2, "اسم العميل مطلوب"),
  commercialRegister: z.string().optional().or(z.literal("")),
  taxNumber: z.string().optional().or(z.literal("")),
  contactName: z.string().optional().or(z.literal("")),
  phone: z.string().min(9, "رقم جوال غير صالح"),
  email: z.string().email("بريد إلكتروني غير صالح").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
});

export type CustomerInput = z.infer<typeof customerSchema>;
