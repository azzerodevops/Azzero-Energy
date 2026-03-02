"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AZZEROCO2_DOMAIN = "@azzeroco2.it";
const CURRENT_ORG_COOKIE = "azzeroco2_current_org";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuthOrganization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  role: string | null; // null for azzeroco2 admins viewing all orgs
}

export interface AuthContext {
  user: {
    id: string;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
  isAzzeroCO2Admin: boolean;
  organizations: AuthOrganization[];
  currentOrganizationId: string | null;
}

// ---------------------------------------------------------------------------
// getAuthContext
// ---------------------------------------------------------------------------

export async function getAuthContext(): Promise<AuthContext> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user || !user.email) {
    throw new Error("Non autenticato");
  }

  const isAzzeroCO2Admin = user.email.endsWith(AZZEROCO2_DOMAIN);

  let organizations: AuthOrganization[];

  if (isAzzeroCO2Admin) {
    // AzzeroCO2 admins can access all organizations
    const { data: orgs, error: orgsError } = await supabase
      .from("organizations")
      .select("id, name, slug, plan")
      .order("name");

    if (orgsError) {
      throw new Error(`Errore caricamento organizzazioni: ${orgsError.message}`);
    }

    organizations = (orgs ?? []).map((org) => ({
      ...org,
      role: null,
    }));
  } else {
    // Regular users: only their assigned organizations
    const { data: memberships, error: memberError } = await supabase
      .from("user_organizations")
      .select("role, organization_id, organizations(id, name, slug, plan)")
      .eq("user_id", user.id);

    if (memberError) {
      throw new Error(`Errore caricamento organizzazioni utente: ${memberError.message}`);
    }

    organizations = (memberships ?? []).map((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const org = (m as any).organizations;
      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        plan: org.plan,
        role: m.role,
      };
    });
  }

  // Read current org from cookie
  const cookieStore = await cookies();
  const currentOrgCookie = cookieStore.get(CURRENT_ORG_COOKIE)?.value ?? null;

  // Validate that the cookie value is one of the user's orgs
  const currentOrganizationId =
    currentOrgCookie && organizations.some((o) => o.id === currentOrgCookie)
      ? currentOrgCookie
      : organizations[0]?.id ?? null;

  // Fetch user profile from users table
  const { data: profile } = await supabase
    .from("users")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: profile?.full_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,
    },
    isAzzeroCO2Admin,
    organizations,
    currentOrganizationId,
  };
}

// ---------------------------------------------------------------------------
// verifyAnalysisOrg
// ---------------------------------------------------------------------------

/**
 * Verifies that the given analysis belongs to the specified organization.
 * Returns true if valid, false otherwise.
 */
export async function verifyAnalysisOrg(
  supabase: Awaited<ReturnType<typeof createClient>>,
  analysisId: string,
  orgId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("analyses")
    .select("organization_id")
    .eq("id", analysisId)
    .single();
  return data?.organization_id === orgId;
}

// ---------------------------------------------------------------------------
// setCurrentOrganization
// ---------------------------------------------------------------------------

export async function setCurrentOrganization(
  orgId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient();

  // Verify the user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user || !user.email) {
    return { success: false, error: "Non autenticato" };
  }

  const isAdmin = user.email.endsWith(AZZEROCO2_DOMAIN);

  // Admin users (@azzeroco2.it) can access any organization
  if (!isAdmin) {
    // Regular users: verify membership in the target organization
    const { data: membership, error: memberError } = await supabase
      .from("user_organizations")
      .select("id")
      .eq("user_id", user.id)
      .eq("organization_id", orgId)
      .maybeSingle();

    if (memberError) {
      return {
        success: false,
        error: "Errore nella verifica dell'accesso all'organizzazione",
      };
    }

    if (!membership) {
      return {
        success: false,
        error: "Non hai accesso a questa organizzazione",
      };
    }
  }

  const cookieStore = await cookies();

  cookieStore.set(CURRENT_ORG_COOKIE, orgId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  return { success: true };
}
