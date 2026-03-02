import { z } from "zod";

export const createSiteSchema = z.object({
  organization_id: z.string().uuid(),
  name: z.string().min(1, "Il nome è obbligatorio").max(255),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(255).optional().nullable(),
  province: z.string().max(100).optional().nullable(),
  country: z.string().max(100).default("Italia"),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  nace_code: z.string().max(10).optional().nullable(),
  sector: z.string().max(255).optional().nullable(),
  employees: z.coerce.number().int().nonnegative().optional().nullable(),
  area_sqm: z.coerce.number().nonnegative().optional().nullable(),
  roof_area_sqm: z.coerce.number().nonnegative().optional().nullable(),
  operating_hours: z.coerce.number().int().min(0).max(8760).optional().nullable(),
  working_days: z.array(z.string()).optional().nullable(),
});

export const updateSiteSchema = createSiteSchema.omit({ organization_id: true }).partial();

export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type UpdateSiteInput = z.infer<typeof updateSiteSchema>;
