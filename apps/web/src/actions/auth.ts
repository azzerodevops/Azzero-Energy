"use server";

import {
  getAuthContext,
  setCurrentOrganization,
  type AuthContext,
} from "@/lib/auth/context";

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
    await setCurrentOrganization(orgId);
    return { success: true, data: undefined };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Errore cambio organizzazione";
    return { success: false, error: message };
  }
}
