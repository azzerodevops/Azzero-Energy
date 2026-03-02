export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OrganizationClient } from "./organization-client";

export default async function OrganizationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Get user's organization membership
  const { data: membership } = await supabase
    .from("user_organizations")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) redirect("/dashboard");

  // Fetch organization details
  const { data: organization } = await supabase
    .from("organizations")
    .select("id, name, slug, plan, created_at")
    .eq("id", membership.organization_id)
    .single();

  if (!organization) redirect("/dashboard");

  // Fetch members
  const { data: members } = await supabase
    .from("user_organizations")
    .select("role, joined_at, users(id, email, full_name)")
    .eq("organization_id", membership.organization_id)
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
      currentUserRole={membership.role}
    />
  );
}
