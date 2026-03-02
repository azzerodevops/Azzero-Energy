import { z } from "zod";

const endUseValues = ["ELECTRICITY", "HEAT_HIGH_T", "HEAT_MED_T", "HEAT_LOW_T", "COLD"] as const;
const profileTypeValues = ["nace_default", "custom", "upload"] as const;

export const createDemandSchema = z.object({
  analysis_id: z.string().uuid(),
  end_use: z.enum(endUseValues, { required_error: "Seleziona un tipo di domanda" }),
  annual_consumption_mwh: z.coerce.number().nonnegative("Il consumo deve essere positivo"),
  profile_type: z.enum(profileTypeValues).default("nace_default"),
  hourly_profile: z.array(z.number()).length(8760).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateDemandSchema = createDemandSchema
  .omit({ analysis_id: true })
  .partial();

export type CreateDemandInput = z.infer<typeof createDemandSchema>;
export type UpdateDemandInput = z.infer<typeof updateDemandSchema>;
