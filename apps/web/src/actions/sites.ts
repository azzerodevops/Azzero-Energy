"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth/context";
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
  // NACE codes are a global reference table — only need auth check, not full context
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

export async function createSite(input: unknown): Promise<ActionResult<Record<string, unknown>>> {
  const context = await getAuthContext();
  const orgId = context.currentOrganizationId;
  if (!orgId) return { success: false, error: "Nessuna organizzazione selezionata" };

  const parsed = createSiteSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  // Verify the target org matches the user's current org
  if (parsed.data.organization_id !== orgId) {
    return { success: false, error: "Non hai accesso a questa organizzazione" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("sites").insert(parsed.data).select().single();
  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/sites");
  return { success: true, data };
}

export async function updateSite(id: string, input: unknown): Promise<ActionResult<Record<string, unknown>>> {
  const context = await getAuthContext();
  const orgId = context.currentOrganizationId;
  if (!orgId) return { success: false, error: "Nessuna organizzazione selezionata" };

  const parsed = updateSiteSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();

  // Verify the site belongs to the user's current org
  const { data: existing } = await supabase
    .from("sites")
    .select("organization_id")
    .eq("id", id)
    .single();
  if (!existing || existing.organization_id !== orgId) {
    return { success: false, error: "Sito non trovato o accesso negato" };
  }

  const { data, error } = await supabase.from("sites").update(parsed.data).eq("id", id).select().single();
  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/sites");
  revalidatePath(`/dashboard/sites/${id}`);
  return { success: true, data };
}

export async function deleteSite(id: string): Promise<ActionResult<null>> {
  const context = await getAuthContext();
  const orgId = context.currentOrganizationId;
  if (!orgId) return { success: false, error: "Nessuna organizzazione selezionata" };

  const supabase = await createClient();

  // Verify the site belongs to the user's current org
  const { data: existing } = await supabase
    .from("sites")
    .select("organization_id")
    .eq("id", id)
    .single();
  if (!existing || existing.organization_id !== orgId) {
    return { success: false, error: "Sito non trovato o accesso negato" };
  }

  const { error } = await supabase.from("sites").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/sites");
  return { success: true, data: null };
}
