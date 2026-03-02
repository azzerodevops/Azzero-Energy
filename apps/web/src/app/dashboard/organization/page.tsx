export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth/context";
import { redirect } from "next/navigation";
import { OrganizationClient } from "./organization-client";

export default async function OrganizationPage() {
  let context;
  try {
    context = await getAuthContext();
  } catch {
    redirect("/auth/login");
  }

  const orgId = context.currentOrganizationId;
  if (!orgId) redirect("/dashboard");

  // Determine the user's role for this org from context
  const currentOrg = context.organizations.find((o) => o.id === orgId);
  const currentUserRole = currentOrg?.role ?? (context.isAzzeroCO2Admin ? "admin" : "viewer");

  const supabase = await createClient();

  // Fetch organization details using the selected org ID
  const { data: organization } = await supabase
    .from("organizations")
    .select("id, name, slug, plan, created_at")
    .eq("id", orgId)
    .single();

  if (!organization) redirect("/dashboard");

  // Fetch members for this org
  const { data: members } = await supabase
    .from("user_organizations")
    .select("role, joined_at, users(id, email, full_name)")
    .eq("organization_id", orgId)
    .order("joined_at");

  const normalizedMembers = (members ?? []).map((m) => ({
    role: m.role,
    joinedAt: m.joined_at,
    user: Array.isArray(m.users) ? m.users[0] ?? null : m.users ?? null,
  }));

  return (
    <OrganizationClient
      organization={organization}
      members={normalizedMembers as Array<{
        role: string;
        joinedAt: string;
        user: { id: string; email: string; full_name: string | null } | null;
      }>}
      currentUserRole={currentUserRole}
    />
  );
}
