import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { WizardClient } from "./wizard-client";

export const dynamic = "force-dynamic";

export default async function NewAnalysisPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Get user's organization
  const { data: membership } = await supabase
    .from("user_organizations")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) redirect("/dashboard");

  // Get sites for the site selector (step 1) + energy estimator (step 2)
  const { data: sites } = await supabase
    .from("sites")
    .select("id, name, city, nace_code, sector, area_sqm, employees, operating_hours")
    .eq("organization_id", membership.organization_id)
    .order("name");

  // Get technology catalog for tech selection (step 4)
  const { data: technologies } = await supabase
    .from("technology_catalog")
    .select("id, name, category, capex_per_kw, min_size_kw, max_size_kw")
    .order("category")
    .order("name");

  return (
    <WizardClient
      organizationId={membership.organization_id}
      sites={sites ?? []}
      technologies={technologies ?? []}
    />
  );
}
