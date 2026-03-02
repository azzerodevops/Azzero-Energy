import { z } from "zod";

const resourceTypeValues = [
  "electricity", "natural_gas", "biomass", "diesel", "lpg", "solar", "wind", "hydrogen",
] as const;

export const createResourceSchema = z.object({
  analysis_id: z.string().uuid(),
  resource_type: z.enum(resourceTypeValues, { required_error: "Seleziona un tipo di risorsa" }),
  buying_price: z.coerce.number().nonnegative().optional().nullable(),
  selling_price: z.coerce.number().nonnegative().optional().nullable(),
  co2_factor: z.coerce.number().nonnegative().optional().nullable(),
  max_availability: z.coerce.number().nonnegative().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateResourceSchema = createResourceSchema
  .omit({ analysis_id: true, resource_type: true })
  .partial();

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;
