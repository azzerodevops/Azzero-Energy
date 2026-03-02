import { z } from "zod";

const objectiveValues = ["cost", "decarbonization"] as const;
export const scenarioStatusValues = ["draft", "queued", "running", "completed", "failed", "outdated"] as const;

export const createScenarioSchema = z.object({
  analysis_id: z.string().uuid(),
  name: z.string().min(1, "Il nome è obbligatorio").max(255),
  description: z.string().max(1000).optional().nullable(),
  objective: z.enum(objectiveValues).default("cost"),
  co2_target: z.coerce.number().min(0).max(1).optional().nullable(),
  budget_limit: z.coerce.number().nonnegative().optional().nullable(),
});

export const updateScenarioSchema = createScenarioSchema
  .omit({ analysis_id: true })
  .partial();

export const createScenarioTechConfigSchema = z.object({
  scenario_id: z.string().uuid(),
  technology_id: z.string().uuid(),
  min_capacity_kw: z.coerce.number().nonnegative().optional().nullable(),
  max_capacity_kw: z.coerce.number().nonnegative().optional().nullable(),
  force_include: z.boolean().default(false),
});

export const updateScenarioTechConfigSchema = createScenarioTechConfigSchema
  .omit({ scenario_id: true, technology_id: true })
  .partial();

export type CreateScenarioInput = z.infer<typeof createScenarioSchema>;
export type UpdateScenarioInput = z.infer<typeof updateScenarioSchema>;
export type CreateScenarioTechConfigInput = z.infer<typeof createScenarioTechConfigSchema>;
export type UpdateScenarioTechConfigInput = z.infer<typeof updateScenarioTechConfigSchema>;
