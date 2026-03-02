"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth/context";
import { revalidatePath } from "next/cache";
import type {
  WizardStep1Input,
  WizardStep2Input,
  WizardStep3Input,
  WizardStep4Input,
  WizardStep5Input,
} from "@azzeroco2/shared";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

interface WizardInput {
  organization_id: string;
  step1: Partial<WizardStep1Input>;
  step2: Partial<WizardStep2Input>;
  step3: Partial<WizardStep3Input>;
  step4: Partial<WizardStep4Input>;
  step5: Partial<WizardStep5Input>;
}

export async function completeWizard(
  input: WizardInput,
): Promise<ActionResult<{ analysisId: string; scenarioId: string }>> {
  const context = await getAuthContext();
  const orgId = context.currentOrganizationId;
  if (!orgId) return { success: false, error: "Nessuna organizzazione selezionata" };

  // Verify the input org matches the user's current org
  if (input.organization_id !== orgId) {
    return { success: false, error: "Non hai accesso a questa organizzazione" };
  }

  const supabase = await createClient();

  // ---- Validate required fields ----
  if (!input.step1.name || !input.step1.site_id) {
    return { success: false, error: "Dati generali incompleti (nome o impianto mancante)" };
  }
  if (!input.step2.demands || input.step2.demands.length === 0) {
    return { success: false, error: "Aggiungi almeno una domanda energetica" };
  }
  if (!input.step4.technologies || input.step4.technologies.length === 0) {
    return { success: false, error: "Seleziona almeno una tecnologia" };
  }

  // Verify the site belongs to this org
  const { data: site } = await supabase
    .from("sites")
    .select("organization_id")
    .eq("id", input.step1.site_id)
    .single();
  if (!site || site.organization_id !== orgId) {
    return { success: false, error: "Sito non trovato o accesso negato" };
  }

  // ---- 1. Create analysis ----
  const { data: analysis, error: analysisError } = await supabase
    .from("analyses")
    .insert({
      site_id: input.step1.site_id,
      organization_id: orgId,
      name: input.step1.name,
      description: input.step1.description ?? null,
      year: input.step1.year ?? new Date().getFullYear(),
      wacc: input.step1.wacc ?? null,
      status: "draft",
      wizard_completed: true,
      created_by: context.user.id,
    })
    .select("id")
    .single();
  if (analysisError) return { success: false, error: analysisError.message };

  const analysisId = analysis.id;

  // ---- 2. Create demands (bulk insert) ----
  if (input.step2.demands.length > 0) {
    const demands = input.step2.demands.map((d) => ({
      analysis_id: analysisId,
      end_use: d.end_use,
      annual_consumption_mwh: d.annual_consumption_mwh,
      profile_type: d.profile_type,
    }));
    const { error: demandsError } = await supabase
      .from("demands")
      .insert(demands);
    if (demandsError) return { success: false, error: demandsError.message };
  }

  // ---- 3. Create lighting zones (if any) ----
  if (input.step3.lighting_zones && input.step3.lighting_zones.length > 0) {
    const zones = input.step3.lighting_zones.map((z) => ({
      analysis_id: analysisId,
      zone_name: z.name,
      area_sqm: z.area_m2 ?? null,
      current_fixture_type: z.current_fixture ?? null,
      operating_hours_year: z.operating_hours ?? null,
      current_wattage: z.power_kw ?? null,
    }));
    const { error: zonesError } = await supabase
      .from("lighting_zones")
      .insert(zones);
    if (zonesError) return { success: false, error: zonesError.message };
  }

  // ---- 4. Add technologies to analysis ----
  if (input.step4.technologies.length > 0) {
    const techs = input.step4.technologies.map((t) => ({
      analysis_id: analysisId,
      technology_id: t.technology_id,
      installed_capacity_kw: t.installed_capacity_kw,
      is_existing: t.is_existing,
    }));
    const { error: techsError } = await supabase
      .from("analysis_technologies")
      .insert(techs);
    if (techsError) return { success: false, error: techsError.message };
  }

  // ---- 4b. Create default energy resources (grid electricity + natural gas) ----
  const defaultResources = [
    {
      analysis_id: analysisId,
      resource_type: "electricity",
      buying_price: 250,
      selling_price: 50,
      co2_factor: 0.256,
      max_availability: null,
    },
    {
      analysis_id: analysisId,
      resource_type: "natural_gas",
      buying_price: 90,
      selling_price: 0,
      co2_factor: 0.202,
      max_availability: null,
    },
    {
      analysis_id: analysisId,
      resource_type: "solar",
      buying_price: 0,
      selling_price: 0,
      co2_factor: 0,
      max_availability: null,
    },
    {
      analysis_id: analysisId,
      resource_type: "wind",
      buying_price: 0,
      selling_price: 0,
      co2_factor: 0,
      max_availability: null,
    },
  ];

  const { error: resourcesError } = await supabase
    .from("analysis_resources")
    .insert(defaultResources);
  if (resourcesError) {
    console.error("Warning: failed to create default resources:", resourcesError.message);
  }

  // ---- 5. Create first scenario ----
  const { data: scenario, error: scenarioError } = await supabase
    .from("scenarios")
    .insert({
      analysis_id: analysisId,
      name: input.step5.scenario_name || "Scenario Base",
      objective: input.step5.objective || "cost",
      co2_target: input.step5.co2_target ?? null,
      budget_limit: input.step5.budget_limit ?? null,
      status: "draft",
      created_by: context.user.id,
    })
    .select("id")
    .single();
  if (scenarioError) return { success: false, error: scenarioError.message };

  // ---- 6. Update analysis status to "ready" ----
  const { error: statusError } = await supabase
    .from("analyses")
    .update({ status: "ready" })
    .eq("id", analysisId);
  if (statusError) {
    console.error("Warning: failed to update analysis status:", statusError.message);
  }

  revalidatePath("/dashboard/analyses");
  revalidatePath(`/dashboard/analyses/${analysisId}`);
  revalidatePath(`/dashboard/analyses/${analysisId}/scenarios`);

  return {
    success: true,
    data: { analysisId, scenarioId: scenario.id },
  };
}
