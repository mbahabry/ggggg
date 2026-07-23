import { z } from "zod";

export const driverSchema = z.object({
  name: z.string().min(2, "اسم السائق مطلوب"),
  phone: z.string().min(9, "رقم جوال غير صالح"),
  nationalId: z.string().min(5, "رقم الهوية/الإقامة مطلوب"),
  nationality: z.string().min(1, "الجنسية مطلوبة"),
  licenseNumber: z.string().min(1, "رقم رخصة القيادة مطلوب"),
  licenseExpiry: z.string().min(1, "تاريخ انتهاء الرخصة مطلوب"),
  status: z.enum(["AVAILABLE", "ON_TRIP", "LEAVE", "SUSPENDED"]),
  truckId: z.string().optional().or(z.literal("")),
  rating: z.coerce.number().min(0).max(5).default(5),
  violationsCount: z.coerce.number().int().min(0).default(0),
  notes: z.string().optional().or(z.literal("")),
});

export type DriverInput = z.infer<typeof driverSchema>;
export type DriverFormInput = z.input<typeof driverSchema>;
