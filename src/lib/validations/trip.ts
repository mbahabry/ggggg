import { z } from "zod";

export const tripSchema = z
  .object({
    customerId: z.string().min(1, "العميل مطلوب"),
    originCity: z.string().min(1, "مدينة التحميل مطلوبة"),
    originAddress: z.string().optional().or(z.literal("")),
    destinationCity: z.string().min(1, "مدينة التسليم مطلوبة"),
    destinationAddress: z.string().optional().or(z.literal("")),
    pickupDateTime: z.string().min(1, "تاريخ ووقت التحميل مطلوب"),
    expectedDeliveryDate: z.string().min(1, "تاريخ التسليم المتوقع مطلوب"),
    cargoType: z.string().min(1, "نوع الحمولة مطلوب"),
    cargoWeightTons: z.coerce.number().positive("وزن الحمولة يجب أن يكون أكبر من صفر"),
    value: z.coerce.number().positive("قيمة الرحلة يجب أن تكون أكبر من صفر"),
    driverId: z.string().optional().or(z.literal("")),
    truckId: z.string().optional().or(z.literal("")),
    notes: z.string().optional().or(z.literal("")),
  })
  .refine((data) => new Date(data.expectedDeliveryDate) >= new Date(data.pickupDateTime), {
    message: "تاريخ التسليم المتوقع يجب أن يكون بعد تاريخ التحميل",
    path: ["expectedDeliveryDate"],
  });

export type TripInput = z.infer<typeof tripSchema>;
export type TripFormInput = z.input<typeof tripSchema>;

export const tripStatusUpdateSchema = z.object({
  tripId: z.string().min(1),
  status: z.enum([
    "DRAFT",
    "PENDING_ACCEPTANCE",
    "ACCEPTED",
    "TO_PICKUP",
    "LOADED",
    "TO_DROPOFF",
    "DELIVERED",
    "CANCELLED",
  ]),
  note: z.string().optional().or(z.literal("")),
});

export const tripAssignSchema = z.object({
  tripId: z.string().min(1),
  driverId: z.string().min(1, "السائق مطلوب"),
  truckId: z.string().min(1, "الشاحنة مطلوبة"),
});
