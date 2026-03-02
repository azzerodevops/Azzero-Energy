"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth/context";
import { addAnalysisTechSchema } from "@azzeroco2/shared";
import { revalidatePath } from "next/cache";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

async function verifyAnalysisOrg(
  supabase: Awaited<ReturnType<typeof createClient>>,
  analysisId: string,
  orgId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("analyses")
    .select("organization_id")
    .eq("id", analysisId)
    .single();
  return data?.organization_id === orgId;
}

export async function getCatalog() {
  await getAuthContext(); // ensures authenticated

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("technology_catalog")
    .select("*")
    .order("category")
    .order("name");
  if (error) return { success: false as const, error: error.message };
  return { success: true as const, data: data ?? [] };
}

export async function addTechToAnalysis(input: unknown): Promise<ActionResult<Record<string, unknown>>> {
  const context = await getAuthContext();
  const orgId = context.currentOrganizationId;
  if (!orgId) return { success: false, error: "Nessuna organizzazione selezionata" };

  const parsed = addAnalysisTechSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();

  if (!(await verifyAnalysisOrg(supabase, parsed.data.analysis_id, orgId))) {
    return { success: false, error: "Analisi non trovata o accesso negato" };
  }

  const { data, error } = await supabase
    .from("analysis_technologies")
    .insert(parsed.data)
    .select()
    .single();
  if (error) return { success: false, error: error.message };

  revalidatePath(`/dashboard/analyses/${parsed.data.analysis_id}/technologies`);
  return { success: true, data };
}

export async function updateAnalysisTech(id: string, analysisId: string, input: { installed_capacity_kw?: number; is_existing?: boolean; notes?: string }): Promise<ActionResult<Record<string, unknown>>> {
  const context = await getAuthContext();
  const orgId = context.currentOrganizationId;
  if (!orgId) return { success: false, error: "Nessuna organizzazione selezionata" };

  const supabase = await createClient();

  if (!(await verifyAnalysisOrg(supabase, analysisId, orgId))) {
    return { success: false, error: "Analisi non trovata o accesso negato" };
  }

  const { data, error } = await supabase
    .from("analysis_technologies")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) return { success: false, error: error.message };

  revalidatePath(`/dashboard/analyses/${analysisId}/technologies`);
  return { success: true, data };
}

export async function removeAnalysisTech(id: string, analysisId: string): Promise<ActionResult<null>> {
  const context = await getAuthContext();
  const orgId = context.currentOrganizationId;
  if (!orgId) return { success: false, error: "Nessuna organizzazione selezionata" };

  const supabase = await createClient();

  if (!(await verifyAnalysisOrg(supabase, analysisId, orgId))) {
    return { success: false, error: "Analisi non trovata o accesso negato" };
  }

  const { error } = await supabase.from("analysis_technologies").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath(`/dashboard/analyses/${analysisId}/technologies`);
  return { success: true, data: null };
}
