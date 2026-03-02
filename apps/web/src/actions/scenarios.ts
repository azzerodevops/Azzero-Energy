"use server";

import { createClient } from "@/lib/supabase/server";
import {
  createScenarioSchema,
  updateScenarioSchema,
  createScenarioTechConfigSchema,
} from "@azzeroco2/shared";
import { revalidatePath } from "next/cache";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function revalidateScenarioPaths(analysisId: string) {
  revalidatePath(`/dashboard/analyses/${analysisId}/scenarios`);
  revalidatePath(`/dashboard/analyses/${analysisId}`);
}

// ---------------------------------------------------------------------------
// 1. createScenario
// ---------------------------------------------------------------------------
export async function createScenario(
  input: unknown,
): Promise<ActionResult<Record<string, unknown>>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non autenticato" };

  const parsed = createScenarioSchema.safeParse(input);
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0].message };

  const { data, error } = await supabase
    .from("scenarios")
    .insert({
      ...parsed.data,
      status: "draft",
      created_by: user.id,
    })
    .select()
    .single();
  if (error) return { success: false, error: error.message };

  revalidateScenarioPaths(parsed.data.analysis_id);
  return { success: true, data };
}

// ---------------------------------------------------------------------------
// 2. updateScenario
// ---------------------------------------------------------------------------
export async function updateScenario(
  id: string,
  analysisId: string,
  input: unknown,
): Promise<ActionResult<Record<string, unknown>>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non autenticato" };

  const parsed = updateScenarioSchema.safeParse(input);
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0].message };

  const { data, error } = await supabase
    .from("scenarios")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();
  if (error) return { success: false, error: error.message };

  revalidateScenarioPaths(analysisId);
  return { success: true, data };
}

// ---------------------------------------------------------------------------
// 3. deleteScenario
// ---------------------------------------------------------------------------
export async function deleteScenario(
  id: string,
  analysisId: string,
): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non autenticato" };

  const { error } = await supabase.from("scenarios").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidateScenarioPaths(analysisId);
  return { success: true, data: null };
}

// ---------------------------------------------------------------------------
// 4. duplicateScenario
// ---------------------------------------------------------------------------
export async function duplicateScenario(
  id: string,
  analysisId: string,
): Promise<ActionResult<Record<string, unknown>>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non autenticato" };

  // Fetch original scenario
  const { data: original, error: fetchError } = await supabase
    .from("scenarios")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchError || !original)
    return { success: false, error: "Scenario non trovato" };

  // Create copy
  const { data: newScenario, error: insertError } = await supabase
    .from("scenarios")
    .insert({
      analysis_id: original.analysis_id,
      name: `${original.name} (copia)`,
      description: original.description,
      objective: original.objective,
      co2_target: original.co2_target,
      budget_limit: original.budget_limit,
      status: "draft",
      created_by: user.id,
    })
    .select()
    .single();
  if (insertError || !newScenario)
    return { success: false, error: insertError?.message ?? "Errore durante la duplicazione" };

  // Duplicate tech configs (NOT results)
  const { data: techConfigs } = await supabase
    .from("scenario_tech_configs")
    .select("*")
    .eq("scenario_id", id);

  if (techConfigs && techConfigs.length > 0) {
    const copies = techConfigs.map((tc) => ({
      scenario_id: newScenario.id,
      technology_id: tc.technology_id,
      min_capacity_kw: tc.min_capacity_kw,
      max_capacity_kw: tc.max_capacity_kw,
      force_include: tc.force_include,
    }));
    const { error: tcError } = await supabase
      .from("scenario_tech_configs")
      .insert(copies);
    if (tcError)
      return { success: false, error: tcError.message };
  }

  revalidateScenarioPaths(analysisId);
  return { success: true, data: newScenario };
}

// ---------------------------------------------------------------------------
// 5. getScenarios
// ---------------------------------------------------------------------------
export async function getScenarios(analysisId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("scenarios")
    .select("*, scenario_results(*)")
    .eq("analysis_id", analysisId)
    .order("created_at", { ascending: true });
  if (error) return { success: false as const, error: error.message };

  return { success: true as const, data: data ?? [] };
}

// ---------------------------------------------------------------------------
// 6. getScenarioResults
// ---------------------------------------------------------------------------
export async function getScenarioResults(scenarioId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("scenario_results")
    .select("*, tech_results(*, technology_catalog(name))")
    .eq("scenario_id", scenarioId)
    .single();
  if (error) return { success: false as const, error: error.message };

  return { success: true as const, data };
}

// ---------------------------------------------------------------------------
// 7. launchOptimization
// ---------------------------------------------------------------------------
export async function launchOptimization(
  scenarioId: string,
  analysisId: string,
): Promise<ActionResult<{ message: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non autenticato" };

  // Set status to queued
  const { error: updateError } = await supabase
    .from("scenarios")
    .update({ status: "queued" })
    .eq("id", scenarioId);
  if (updateError) return { success: false, error: updateError.message };

  // Fire and forget: call the optimizer API
  try {
    const response = await fetch(
      `http://localhost:8000/solve/${scenarioId}`,
      { method: "POST" },
    );
    if (!response.ok) {
      // Revert status on immediate failure
      await supabase
        .from("scenarios")
        .update({ status: "draft" })
        .eq("id", scenarioId);
      return {
        success: false,
        error: `Errore optimizer: ${response.status} ${response.statusText}`,
      };
    }
  } catch {
    // Revert status if the optimizer is unreachable
    await supabase
      .from("scenarios")
      .update({ status: "draft" })
      .eq("id", scenarioId);
    return {
      success: false,
      error: "Impossibile contattare il servizio di ottimizzazione",
    };
  }

  revalidateScenarioPaths(analysisId);
  return { success: true, data: { message: "Ottimizzazione avviata" } };
}

// ---------------------------------------------------------------------------
// 8. getScenarioStatus
// ---------------------------------------------------------------------------
export async function getScenarioStatus(scenarioId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("scenarios")
    .select("id, status, error_message")
    .eq("id", scenarioId)
    .single();
  if (error) return { success: false as const, error: error.message };

  return { success: true as const, data };
}

// ---------------------------------------------------------------------------
// 8b. validateScenario — pre-validation before launching optimization
// ---------------------------------------------------------------------------
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  auto_fixes_applied: string[];
}

export async function validateScenario(
  scenarioId: string,
): Promise<ActionResult<ValidationResult>> {
  try {
    const response = await fetch(
      `http://localhost:8000/solve/${scenarioId}/validate`,
    );
    if (!response.ok) {
      return {
        success: false,
        error: `Errore durante la validazione: ${response.status} ${response.statusText}`,
      };
    }
    const data: ValidationResult = await response.json();
    return { success: true, data };
  } catch {
    return {
      success: false,
      error: "Impossibile contattare il servizio di ottimizzazione per la validazione",
    };
  }
}

// ---------------------------------------------------------------------------
// 8c. getScenarioErrorMessage — fetch error details for failed scenarios
// ---------------------------------------------------------------------------
export async function getScenarioErrorMessage(
  scenarioId: string,
): Promise<ActionResult<{ error_message: string | null }>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("scenarios")
    .select("error_message")
    .eq("id", scenarioId)
    .single();
  if (error) return { success: false, error: error.message };

  return { success: true, data: { error_message: data.error_message ?? null } };
}

// ---------------------------------------------------------------------------
// 9. upsertTechConfig
// ---------------------------------------------------------------------------
export async function upsertTechConfig(
  input: unknown,
): Promise<ActionResult<Record<string, unknown>>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non autenticato" };

  const parsed = createScenarioTechConfigSchema.safeParse(input);
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0].message };

  const { data, error } = await supabase
    .from("scenario_tech_configs")
    .upsert(parsed.data, {
      onConflict: "scenario_id,technology_id",
    })
    .select()
    .single();
  if (error) return { success: false, error: error.message };

  // Resolve analysisId for revalidation
  const { data: scenario } = await supabase
    .from("scenarios")
    .select("analysis_id")
    .eq("id", parsed.data.scenario_id)
    .single();
  if (scenario) revalidateScenarioPaths(scenario.analysis_id);

  return { success: true, data };
}

// ---------------------------------------------------------------------------
// 10. deleteTechConfig
// ---------------------------------------------------------------------------
export async function deleteTechConfig(
  id: string,
  scenarioId: string,
  analysisId: string,
): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non autenticato" };

  const { error } = await supabase
    .from("scenario_tech_configs")
    .delete()
    .eq("id", id)
    .eq("scenario_id", scenarioId);
  if (error) return { success: false, error: error.message };

  revalidateScenarioPaths(analysisId);
  return { success: true, data: null };
}

// ---------------------------------------------------------------------------
// 11. getTechConfigs
// ---------------------------------------------------------------------------
export async function getTechConfigs(scenarioId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("scenario_tech_configs")
    .select("*, technology_catalog(name)")
    .eq("scenario_id", scenarioId);
  if (error) return { success: false as const, error: error.message };

  return { success: true as const, data: data ?? [] };
}
