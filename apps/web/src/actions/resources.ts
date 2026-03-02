"use server";

import { createClient } from "@/lib/supabase/server";
import { createResourceSchema, updateResourceSchema } from "@azzeroco2/shared";
import { revalidatePath } from "next/cache";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export async function createResource(input: unknown): Promise<ActionResult<Record<string, unknown>>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non autenticato" };

  const parsed = createResourceSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { data, error } = await supabase.from("analysis_resources").insert(parsed.data).select().single();
  if (error) return { success: false, error: error.message };

  revalidatePath(`/dashboard/analyses/${parsed.data.analysis_id}/resources`);
  return { success: true, data };
}

export async function updateResource(id: string, analysisId: string, input: unknown): Promise<ActionResult<Record<string, unknown>>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non autenticato" };

  const parsed = updateResourceSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { data, error } = await supabase.from("analysis_resources").update(parsed.data).eq("id", id).select().single();
  if (error) return { success: false, error: error.message };

  revalidatePath(`/dashboard/analyses/${analysisId}/resources`);
  return { success: true, data };
}

export async function deleteResource(id: string, analysisId: string): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non autenticato" };

  const { error } = await supabase.from("analysis_resources").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath(`/dashboard/analyses/${analysisId}/resources`);
  return { success: true, data: null };
}
