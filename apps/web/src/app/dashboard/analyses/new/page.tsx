import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth/context";
import { redirect } from "next/navigation";
import { WizardClient } from "./wizard-client";

export const dynamic = "force-dynamic";

export default async function NewAnalysisPage() {
  let context;
  try {
    context = await getAuthContext();
  } catch {
    redirect("/auth/login");
  }

  const orgId = context.currentOrganizationId;
  if (!orgId) redirect("/dashboard");

  const supabase = await createClient();

  // Get sites for the site selector (step 1) + energy estimator (step 2)
  const { data: sites } = await supabase
    .from("sites")
    .select("id, name, city, nace_code, sector, area_sqm, employees, operating_hours")
    .eq("organization_id", orgId)
    .order("name");

  // Get technology catalog for tech selection (step 4)
  const { data: technologies } = await supabase
    .from("technology_catalog")
    .select("id, name, category, capex_per_kw, min_size_kw, max_size_kw")
    .order("category")
    .order("name");

  return (
    <WizardClient
      organizationId={orgId}
      sites={sites ?? []}
      technologies={technologies ?? []}
    />
  );
}
