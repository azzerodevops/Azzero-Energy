import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { ResultsClient } from "./results-client";

export const dynamic = "force-dynamic";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string; scenarioId: string }>;
}) {
  const { id: analysisId, scenarioId } = await params;
  const supabase = await createClient();

  // Fetch scenario
  const { data: scenario } = await supabase
    .from("scenarios")
    .select("id, name, objective, status")
    .eq("id", scenarioId)
    .single();

  if (!scenario) notFound();
  if (scenario.status !== "completed") {
    redirect(`/dashboard/analyses/${analysisId}/scenarios/${scenarioId}`);
  }

  // Fetch scenario results
  const { data: results } = await supabase
    .from("scenario_results")
    .select("*")
    .eq("scenario_id", scenarioId)
    .single();

  if (!results) notFound();

  // Fetch tech results with catalog name
  const { data: rawTechResults } = await supabase
    .from("tech_results")
    .select("*, technology_catalog(name, category)")
    .eq("scenario_result_id", results.id);

  const techResults = (rawTechResults ?? []).map((t) => ({
    ...t,
    technology_catalog: Array.isArray(t.technology_catalog)
      ? (t.technology_catalog[0] ?? null)
      : (t.technology_catalog ?? null),
  }));

  return (
    <ResultsClient
      analysisId={analysisId}
      scenario={scenario}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      results={results as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      techResults={techResults as any}
    />
  );
}
