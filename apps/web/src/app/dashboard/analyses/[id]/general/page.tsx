import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { AnalysisForm } from "@/components/analyses/analysis-form";

export const dynamic = "force-dynamic";

export default async function GeneralPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: analysis } = await supabase
    .from("analyses")
    .select("*")
    .eq("id", id)
    .single();

  if (!analysis) notFound();

  // Get sites for the selector
  const { data: sites } = await supabase
    .from("sites")
    .select("id, name, city")
    .eq("organization_id", analysis.organization_id)
    .order("name");

  return (
    <AnalysisForm
      organizationId={analysis.organization_id}
      sites={sites ?? []}
      initialData={analysis}
    />
  );
}
