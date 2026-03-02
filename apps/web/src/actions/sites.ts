"use server";

import { createClient } from "@/lib/supabase/server";
import { createSiteSchema, updateSiteSchema } from "@azzeroco2/shared";
import { revalidatePath } from "next/cache";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export interface NaceCodeRow {
  code: string;
  description: string;
  section: string;
  is_energy_relevant: boolean;
}

/**
 * Fetches all NACE codes from the database for the NaceSelector combobox.
 * Ordered by code for consistent display.
 */
export async function getNaceCodes(): Promise<ActionResult<NaceCodeRow[]>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non autenticato" };

  const { data, error } = await supabase
    .from("nace_codes")
    .select("code, description, section, is_energy_relevant")
    .order("code", { ascending: true });

  if (error) return { success: false, error: error.message };

  return { success: true, data: (data ?? []) as NaceCodeRow[] };
}

// The Supabase "sites" table has these columns (snake_case):
// id, organization_id, name, address, city, province, country, latitude, longitude,
// nace_code, sector, employees, area_sqm, roof_area_sqm, operating_hours, working_days,
// satellite_image_url, created_at, updated_at

export async function createSite(input: unknown): Promise<ActionResult<Record<string, unknown>>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non autenticato" };

  const parsed = createSiteSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  // Verify user belongs to the target organization
  const { data: membership } = await supabase
    .from("user_organizations")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("organization_id", parsed.data.organization_id)
    .limit(1)
    .single();
  if (!membership) return { success: false, error: "Non hai accesso a questa organizzazione" };

  const { data, error } = await supabase.from("sites").insert(parsed.data).select().single();
  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/sites");
  return { success: true, data };
}

export async function updateSite(id: string, input: unknown): Promise<ActionResult<Record<string, unknown>>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non autenticato" };

  const parsed = updateSiteSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { data, error } = await supabase.from("sites").update(parsed.data).eq("id", id).select().single();
  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/sites");
  revalidatePath(`/dashboard/sites/${id}`);
  return { success: true, data };
}

export async function deleteSite(id: string): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non autenticato" };

  const { error } = await supabase.from("sites").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/sites");
  return { success: true, data: null };
}
