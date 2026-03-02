"use server";

import {
  getAuthContext,
  setCurrentOrganization,
  type AuthContext,
} from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// getClientAuthContext
// ---------------------------------------------------------------------------

export async function getClientAuthContext(): Promise<ActionResult<AuthContext>> {
  try {
    const context = await getAuthContext();
    return { success: true, data: context };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Errore autenticazione";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// switchOrganization
// ---------------------------------------------------------------------------

export async function switchOrganization(
  orgId: string
): Promise<ActionResult<void>> {
  try {
    const result = await setCurrentOrganization(orgId);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true, data: undefined };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Errore cambio organizzazione";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// updateOrganization
// ---------------------------------------------------------------------------

export async function updateOrganization(
  orgId: string,
  data: { name: string }
): Promise<ActionResult<void>> {
  try {
    const context = await getAuthContext();

    // Verify the user has access to this org
    const org = context.organizations.find((o) => o.id === orgId);
    if (!org) {
      return { success: false, error: "Organizzazione non trovata" };
    }

    // Verify write access: must be admin or AzzeroCO2 admin
    const hasWriteAccess = context.isAzzeroCO2Admin || org.role === "admin";
    if (!hasWriteAccess) {
      return { success: false, error: "Non hai i permessi per modificare questa organizzazione" };
    }

    // Validate input
    const name = data.name?.trim();
    if (!name) {
      return { success: false, error: "Il nome non può essere vuoto" };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("organizations")
      .update({ name })
      .eq("id", orgId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/organization");
    return { success: true, data: undefined };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Errore aggiornamento organizzazione";
    return { success: false, error: message };
  }
}
