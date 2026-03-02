"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function getReports(
  analysisId: string,
): Promise<ActionResult<Record<string, unknown>[]>> {
  const supabase = await createClient();
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
  const supabase = await createClient();
  const { error } = await supabase.from("reports").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath(`/dashboard/analyses/${analysisId}/report`);
  return { success: true, data: null };
}
