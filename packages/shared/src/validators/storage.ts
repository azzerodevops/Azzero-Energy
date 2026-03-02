import { z } from "zod";

const storageTypeValues = ["battery_lion", "thermal_hot", "thermal_cold"] as const;

export const createStorageSchema = z.object({
  analysis_id: z.string().uuid(),
  name: z.string().max(255).optional().nullable(),
  storage_type: z.enum(storageTypeValues, { required_error: "Seleziona un tipo di accumulo" }),
  capacity_kwh: z.coerce.number().positive("La capacità deve essere positiva"),
  max_charge_kw: z.coerce.number().nonnegative().optional().nullable(),
  max_discharge_kw: z.coerce.number().nonnegative().optional().nullable(),
  charge_efficiency: z.coerce.number().min(0).max(1).optional().nullable(),
  discharge_efficiency: z.coerce.number().min(0).max(1).optional().nullable(),
  self_discharge_rate: z.coerce.number().min(0).max(1).optional().nullable(),
  capex_per_kwh: z.coerce.number().nonnegative().optional().nullable(),
  cycles_lifetime: z.coerce.number().int().nonnegative().optional().nullable(),
  min_soc: z.coerce.number().min(0).max(1).optional().nullable(),
  max_soc: z.coerce.number().min(0).max(1).optional().nullable(),
});

export const updateStorageSchema = createStorageSchema
  .omit({ analysis_id: true, storage_type: true })
  .partial();

export type CreateStorageInput = z.infer<typeof createStorageSchema>;
export type UpdateStorageInput = z.infer<typeof updateStorageSchema>;
