"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth/context";
import { revalidatePath } from "next/cache";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export async function registerFile(input: {
  organization_id: string;
  analysis_id: string;
  name: string;
  mime_type: string;
  size_bytes: number;
  storage_key: string;
}): Promise<ActionResult<Record<string, unknown>>> {
  const context = await getAuthContext();
  const orgId = context.currentOrganizationId;
  if (!orgId) return { success: false, error: "Nessuna organizzazione selezionata" };

  // Verify the input org matches the user's current org
  if (input.organization_id !== orgId) {
    return { success: false, error: "Non hai accesso a questa organizzazione" };
  }

  const supabase = await createClient();

  // Verify analysis belongs to org
  const { data: analysis } = await supabase
    .from("analyses")
    .select("organization_id")
    .eq("id", input.analysis_id)
    .single();
  if (!analysis || analysis.organization_id !== orgId) {
    return { success: false, error: "Analisi non trovata o accesso negato" };
  }

  const { data, error } = await supabase
    .from("files")
    .insert({ ...input, uploaded_by: context.user.id })
    .select()
    .single();
  if (error) return { success: false, error: error.message };

  revalidatePath(`/dashboard/analyses/${input.analysis_id}/files`);
  return { success: true, data };
}

export async function deleteFile(id: string, analysisId: string, storageKey: string): Promise<ActionResult<null>> {
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

  // Delete from storage
  await supabase.storage.from("analysis-files").remove([storageKey]);

  // Delete from DB
  const { error } = await supabase.from("files").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath(`/dashboard/analyses/${analysisId}/files`);
  return { success: true, data: null };
}
