import { z } from "zod";

export const financeSchema = z.object({
  type: z.enum(["REVENUE", "EXPENSE"]),
  category: z.enum([
    "TRIP_REVENUE",
    "FUEL",
    "MAINTENANCE",
    "DRIVER_PAYROLL",
    "FINES",
    "ADMIN",
    "OTHER",
  ]),
  amount: z.coerce.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
  description: z.string().min(1, "الوصف مطلوب"),
  date: z.string().min(1, "التاريخ مطلوب"),
  customerId: z.string().optional().or(z.literal("")),
  truckId: z.string().optional().or(z.literal("")),
  driverId: z.string().optional().or(z.literal("")),
  tripId: z.string().optional().or(z.literal("")),
  isPaid: z.boolean().default(true),
  dueDate: z.string().optional().or(z.literal("")),
});

export type FinanceInput = z.infer<typeof financeSchema>;
export type FinanceFormInput = z.input<typeof financeSchema>;
