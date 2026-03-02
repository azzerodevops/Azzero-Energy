"use server";

import { createClient } from "@/lib/supabase/server";
import { createAnalysisSchema, updateAnalysisSchema } from "@azzeroco2/shared";
import { revalidatePath } from "next/cache";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export async function createAnalysis(input: unknown): Promise<ActionResult<Record<string, unknown>>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non autenticato" };

  const parsed = createAnalysisSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { data, error } = await supabase
    .from("analyses")
    .insert({ ...parsed.data, status: "draft", wizard_completed: false, created_by: user.id })
    .select()
    .single();
  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/analyses");
  return { success: true, data };
}

export async function updateAnalysis(id: string, input: unknown): Promise<ActionResult<Record<string, unknown>>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non autenticato" };

  const parsed = updateAnalysisSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non autenticato" };

  const { error } = await supabase.from("analyses").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/analyses");
  return { success: true, data: null };
}

export async function duplicateAnalysis(id: string): Promise<ActionResult<Record<string, unknown>>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non autenticato" };

  // Fetch original
  const { data: original, error: fetchError } = await supabase
    .from("analyses")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchError || !original) return { success: false, error: "Analisi non trovata" };

  // Create copy
  const { data, error } = await supabase
    .from("analyses")
    .insert({
      site_id: original.site_id,
      organization_id: original.organization_id,
      name: `${original.name} (copia)`,
      description: original.description,
      year: original.year,
      wacc: original.wacc,
      status: "draft",
      wizard_completed: false,
      created_by: user.id,
    })
    .select()
    .single();
  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/analyses");
  return { success: true, data };
}
