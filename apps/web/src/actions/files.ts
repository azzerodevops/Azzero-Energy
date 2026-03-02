"use server";

import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non autenticato" };

  const { data, error } = await supabase
    .from("files")
    .insert({ ...input, uploaded_by: user.id })
    .select()
    .single();
  if (error) return { success: false, error: error.message };

  revalidatePath(`/dashboard/analyses/${input.analysis_id}/files`);
  return { success: true, data };
}

export async function deleteFile(id: string, analysisId: string, storageKey: string): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non autenticato" };

  // Delete from storage
  await supabase.storage.from("analysis-files").remove([storageKey]);

  // Delete from DB
  const { error } = await supabase.from("files").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath(`/dashboard/analyses/${analysisId}/files`);
  return { success: true, data: null };
}
