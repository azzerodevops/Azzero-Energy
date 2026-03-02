"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth/context";
import { revalidatePath } from "next/cache";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function getReports(
  analysisId: string,
): Promise<ActionResult<Record<string, unknown>[]>> {
  const context = await getAuthContext();
  const orgId = context.currentOrganizationId;
  if (!orgId) return { success: false, error: "Nessuna organizzazione selezionata" };

  const supabase = await createClient();

  // Verify analysis belongs to org
  const { data: analysis } = await supabase
    .from("analyses")
    .select("organization_id")
    .eq("id", analysisId)
    .single();
  if (!analysis || analysis.organization_id !== orgId) {
    return { success: false, error: "Analisi non trovata o accesso negato" };
  }

  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("analysis_id", analysisId)
    .order("created_at", { ascending: false });
  if (error) return { success: false, error: error.message };
  return { success: true, data: data ?? [] };
}

export async function deleteReport(
  id: string,
  analysisId: string,
): Promise<ActionResult<null>> {
  const context = await getAuthContext();
  const orgId = context.currentOrganizationId;
  if (!orgId) return { success: false, error: "Nessuna organizzazione selezionata" };

  const supabase = await createClient();

  // Verify analysis belongs to org
  const { data: analysis } = await supabase
    .from("analyses")
    .select("organization_id")
    .eq("id", analysisId)
    .single();
  if (!analysis || analysis.organization_id !== orgId) {
    return { success: false, error: "Analisi non trovata o accesso negato" };
  }

  const { error } = await supabase.from("reports").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath(`/dashboard/analyses/${analysisId}/report`);
  return { success: true, data: null };
}
