import { z } from "zod";

export const truckSchema = z.object({
  internalNumber: z.string().min(1, "رقم الشاحنة الداخلي مطلوب"),
  plateNumber: z.string().min(1, "رقم اللوحة مطلوب"),
  truckType: z.string().min(1, "نوع الشاحنة مطلوب"),
  model: z.string().min(1, "الموديل مطلوب"),
  year: z.coerce.number().int().min(1980).max(new Date().getFullYear() + 1),
  capacityTons: z.coerce.number().positive("سعة الحمولة يجب أن تكون أكبر من صفر"),
  chassisNumber: z.string().min(1, "رقم الهيكل مطلوب"),
  odometerKm: z.coerce.number().int().min(0).default(0),
  status: z.enum(["AVAILABLE", "ON_TRIP", "MAINTENANCE", "STOPPED"]),
  formExpiry: z.string().min(1, "تاريخ انتهاء الاستمارة مطلوب"),
  insuranceExpiry: z.string().min(1, "تاريخ انتهاء التأمين مطلوب"),
  inspectionExpiry: z.string().min(1, "تاريخ الفحص الدوري مطلوب"),
  imageUrl: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type TruckInput = z.infer<typeof truckSchema>;
export type TruckFormInput = z.input<typeof truckSchema>;
