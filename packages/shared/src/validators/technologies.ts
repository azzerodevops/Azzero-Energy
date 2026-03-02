import { z } from "zod";

export const addAnalysisTechSchema = z.object({
  analysis_id: z.string().uuid(),
  technology_id: z.string().uuid("Seleziona una tecnologia"),
  installed_capacity_kw: z.coerce.number().nonnegative("La capacità deve essere positiva"),
  is_existing: z.boolean().default(false),
  notes: z.string().optional().nullable(),
});

export const updateAnalysisTechSchema = addAnalysisTechSchema
  .omit({ analysis_id: true, technology_id: true })
  .partial();

export type AddAnalysisTechInput = z.infer<typeof addAnalysisTechSchema>;
export type UpdateAnalysisTechInput = z.infer<typeof updateAnalysisTechSchema>;
