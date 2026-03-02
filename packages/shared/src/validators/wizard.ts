import { z } from "zod";

// ============================================================
// AzzeroCO2 Energy - Wizard Step Validation Schemas
// ============================================================

const endUseValues = ["ELECTRICITY", "HEAT_HIGH_T", "HEAT_MED_T", "HEAT_LOW_T", "COLD"] as const;
const profileTypeValues = [
  "nace_default",
  "custom",
  "upload",
  "office",
  "industrial_1shift",
  "industrial_2shift",
  "industrial_3shift",
  "commercial",
  "residential",
  "flat",
] as const;
const objectiveValues = ["cost", "decarbonization"] as const;

// --- Step 1: General Data ---

export const wizardStep1Schema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio").max(255),
  site_id: z.string().uuid("Seleziona un impianto"),
  year: z.coerce.number().int().min(2020, "Anno non valido").max(2050),
  wacc: z.coerce.number().min(0).max(1).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
});

// --- Step 2: Energy Consumption ---

export const wizardDemandItemSchema = z.object({
  end_use: z.enum(endUseValues, { required_error: "Seleziona un tipo di domanda" }),
  annual_consumption_mwh: z.coerce.number().nonnegative("Il consumo deve essere positivo"),
  profile_type: z.enum(profileTypeValues).default("nace_default"),
});

export const wizardStep2Schema = z.object({
  demands: z
    .array(wizardDemandItemSchema)
    .min(1, "Aggiungi almeno una domanda energetica"),
});

// --- Step 3: Thermal + Lighting ---

export const wizardLightingZoneSchema = z.object({
  name: z.string().min(1, "Il nome della zona è obbligatorio"),
  area_m2: z.coerce.number().positive("L'area deve essere positiva").optional(),
  current_fixture: z.string().optional(),
  operating_hours: z.coerce.number().positive("Le ore devono essere positive").optional(),
  power_kw: z.coerce.number().nonnegative("La potenza deve essere positiva").optional(),
});

export const wizardStep3Schema = z.object({
  lighting_zones: z.array(wizardLightingZoneSchema).optional().default([]),
});

// --- Step 4: Technologies selection ---

export const wizardTechItemSchema = z.object({
  technology_id: z.string().uuid("Seleziona una tecnologia"),
  installed_capacity_kw: z.coerce.number().nonnegative("La capacità deve essere positiva").default(0),
  is_existing: z.boolean().default(false),
});

export const wizardStep4Schema = z.object({
  technologies: z
    .array(wizardTechItemSchema)
    .min(1, "Seleziona almeno una tecnologia"),
});

// --- Step 5: Scenario config + launch ---

export const wizardStep5Schema = z.object({
  objective: z.enum(objectiveValues).default("cost"),
  scenario_name: z.string().min(1, "Il nome dello scenario è obbligatorio").max(255).default("Scenario Base"),
  co2_target: z.coerce.number().min(0).max(1).optional().nullable(),
  budget_limit: z.coerce.number().nonnegative("Il budget deve essere positivo").optional().nullable(),
});

// --- Inferred types ---

export type WizardStep1Input = z.infer<typeof wizardStep1Schema>;
export type WizardStep2Input = z.infer<typeof wizardStep2Schema>;
export type WizardStep3Input = z.infer<typeof wizardStep3Schema>;
export type WizardStep4Input = z.infer<typeof wizardStep4Schema>;
export type WizardStep5Input = z.infer<typeof wizardStep5Schema>;
export type WizardDemandItem = z.infer<typeof wizardDemandItemSchema>;
export type WizardLightingZone = z.infer<typeof wizardLightingZoneSchema>;
export type WizardTechItem = z.infer<typeof wizardTechItemSchema>;
