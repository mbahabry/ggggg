import { z } from "zod";

export const maintenanceSchema = z.object({
  truckId: z.string().min(1, "الشاحنة مطلوبة"),
  faultType: z.string().min(1, "نوع العطل مطلوب"),
  description: z.string().min(1, "وصف العطل مطلوب"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  serviceCenter: z.string().optional().or(z.literal("")),
  cost: z.coerce.number().min(0).optional(),
  nextMaintenanceDate: z.string().optional().or(z.literal("")),
  odometerAtService: z.coerce.number().int().min(0).optional(),
});

export type MaintenanceInput = z.infer<typeof maintenanceSchema>;
export type MaintenanceFormInput = z.input<typeof maintenanceSchema>;

export const maintenanceStatusUpdateSchema = z.object({
  requestId: z.string().min(1),
  status: z.enum(["NEW", "INSPECTING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  cost: z.coerce.number().min(0).optional(),
  nextMaintenanceDate: z.string().optional().or(z.literal("")),
  odometerAtService: z.coerce.number().int().min(0).optional(),
});
