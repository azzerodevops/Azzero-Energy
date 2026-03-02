import { z } from "zod";

export const createLightingZoneSchema = z.object({
  analysis_id: z.string().uuid(),
  zone_name: z.string().min(1, "Il nome della zona è obbligatorio").max(255),
  area_sqm: z.coerce.number().nonnegative().optional().nullable(),
  current_fixture_type: z.string().max(100).optional().nullable(),
  current_wattage: z.coerce.number().nonnegative().optional().nullable(),
  fixture_count: z.coerce.number().int().nonnegative().optional().nullable(),
  operating_hours_year: z.coerce.number().int().min(0).max(8760).optional().nullable(),
  lux_level: z.coerce.number().nonnegative().optional().nullable(),
  relamping_fixture_type: z.string().max(100).optional().nullable(),
  relamping_wattage: z.coerce.number().nonnegative().optional().nullable(),
  relamping_fixture_count: z.coerce.number().int().nonnegative().optional().nullable(),
});

export const updateLightingZoneSchema = createLightingZoneSchema
  .omit({ analysis_id: true })
  .partial();

export type CreateLightingZoneInput = z.infer<typeof createLightingZoneSchema>;
export type UpdateLightingZoneInput = z.infer<typeof updateLightingZoneSchema>;
