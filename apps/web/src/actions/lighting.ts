"use server";

import { createClient } from "@/lib/supabase/server";
import { createLightingZoneSchema, updateLightingZoneSchema } from "@azzeroco2/shared";
import { revalidatePath } from "next/cache";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export async function createLightingZone(input: unknown): Promise<ActionResult<Record<string, unknown>>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non autenticato" };
  const parsed = createLightingZoneSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  const { data, error } = await supabase.from("lighting_zones").insert(parsed.data).select().single();
  if (error) return { success: false, error: error.message };
  revalidatePath(`/dashboard/analyses/${parsed.data.analysis_id}/lighting`);
  return { success: true, data };
}

export async function updateLightingZone(id: string, analysisId: string, input: unknown): Promise<ActionResult<Record<string, unknown>>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non autenticato" };
  const parsed = updateLightingZoneSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  const { data, error } = await supabase.from("lighting_zones").update(parsed.data).eq("id", id).select().single();
  if (error) return { success: false, error: error.message };
  revalidatePath(`/dashboard/analyses/${analysisId}/lighting`);
  return { success: true, data };
}

export async function deleteLightingZone(id: string, analysisId: string): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non autenticato" };
  const { error } = await supabase.from("lighting_zones").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath(`/dashboard/analyses/${analysisId}/lighting`);
  return { success: true, data: null };
}
