"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth/context";
import { createAnalysisSchema, updateAnalysisSchema } from "@azzeroco2/shared";
import { revalidatePath } from "next/cache";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export async function createAnalysis(input: unknown): Promise<ActionResult<Record<string, unknown>>> {
  const context = await getAuthContext();
  const orgId = context.currentOrganizationId;
  if (!orgId) return { success: false, error: "Nessuna organizzazione selezionata" };

  const parsed = createAnalysisSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("analyses")
    .insert({ ...parsed.data, organization_id: orgId, status: "draft", wizard_completed: false, created_by: context.user.id })
    .select()
    .single();
  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/analyses");
  return { success: true, data };
}

export async function updateAnalysis(id: string, input: unknown): Promise<ActionResult<Record<string, unknown>>> {
  const context = await getAuthContext();
  const orgId = context.currentOrganizationId;
  if (!orgId) return { success: false, error: "Nessuna organizzazione selezionata" };

  const parsed = updateAnalysisSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();

  // Verify the analysis belongs to the user's current org
  const { data: existing } = await supabase
    .from("analyses")
    .select("organization_id")
    .eq("id", id)
    .single();
  if (!existing || existing.organization_id !== orgId) {
    return { success: false, error: "Analisi non trovata o accesso negato" };
  }

  const { data, error } = await supabase
    .from("analyses")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();
  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/analyses");
  revalidatePath(`/dashboard/analyses/${id}`);
  return { success: true, data };
}

export async function deleteAnalysis(id: string): Promise<ActionResult<null>> {
  const context = await getAuthContext();
  const orgId = context.currentOrganizationId;
  if (!orgId) return { success: false, error: "Nessuna organizzazione selezionata" };

  const supabase = await createClient();

  // Verify the analysis belongs to the user's current org
  const { data: existing } = await supabase
    .from("analyses")
    .select("organization_id")
    .eq("id", id)
    .single();
  if (!existing || existing.organization_id !== orgId) {
    return { success: false, error: "Analisi non trovata o accesso negato" };
  }

  const { error } = await supabase.from("analyses").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/analyses");
  return { success: true, data: null };
}

export async function duplicateAnalysis(id: string): Promise<ActionResult<Record<string, unknown>>> {
  const context = await getAuthContext();
  const orgId = context.currentOrganizationId;
  if (!orgId) return { success: false, error: "Nessuna organizzazione selezionata" };

  const supabase = await createClient();

  // Fetch original and verify org ownership
  const { data: original, error: fetchError } = await supabase
    .from("analyses")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchError || !original) return { success: false, error: "Analisi non trovata" };
  if (original.organization_id !== orgId) {
    return { success: false, error: "Analisi non trovata o accesso negato" };
  }

  // Create copy
  const { data, error } = await supabase
    .from("analyses")
    .insert({
      site_id: original.site_id,
      organization_id: orgId,
      name: `${original.name} (copia)`,
      description: original.description,
      year: original.year,
      wacc: original.wacc,
      status: "draft",
      wizard_completed: false,
      created_by: context.user.id,
    })
    .select()
    .single();
  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/analyses");
  return { success: true, data };
}
