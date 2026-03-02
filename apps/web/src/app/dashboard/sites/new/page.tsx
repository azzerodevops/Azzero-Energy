import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { SiteForm } from "@/components/sites/site-form";

export const dynamic = "force-dynamic";

export default async function NewSitePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Get user's organization
  const { data: membership } = await supabase
    .from("user_organizations")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) redirect("/dashboard");

  return (
    <div className="space-y-6">
      <PageHeader title="Nuovo impianto" description="Aggiungi un nuovo sito o stabilimento" />
      <SiteForm organizationId={membership.organization_id} />
    </div>
  );
}
