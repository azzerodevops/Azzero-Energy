import { z } from "zod";

export const createAnalysisSchema = z.object({
  site_id: z.string().uuid("Seleziona un impianto"),
  organization_id: z.string().uuid(),
  name: z.string().min(1, "Il nome è obbligatorio").max(255),
  description: z.string().optional().nullable(),
  year: z.coerce.number().int().min(2020).max(2050),
  wacc: z.coerce.number().min(0).max(1).optional().nullable(),
});

export const updateAnalysisSchema = createAnalysisSchema
  .omit({ site_id: true, organization_id: true })
  .partial();

export type CreateAnalysisInput = z.infer<typeof createAnalysisSchema>;
export type UpdateAnalysisInput = z.infer<typeof updateAnalysisSchema>;
