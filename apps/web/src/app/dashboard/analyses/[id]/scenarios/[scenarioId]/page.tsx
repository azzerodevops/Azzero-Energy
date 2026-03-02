import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ScenarioDetailClient } from "./scenario-detail-client";

export const dynamic = "force-dynamic";

export default async function ScenarioDetailPage({
  params,
}: {
  params: Promise<{ id: string; scenarioId: string }>;
}) {
  const { id: analysisId, scenarioId } = await params;
  const supabase = await createClient();

  // Fetch scenario
  const { data: scenario } = await supabase
    .from("scenarios")
    .select("*")
    .eq("id", scenarioId)
    .single();

  if (!scenario) notFound();

  // Fetch analysis technologies with catalog info
  const { data: rawTechs } = await supabase
    .from("analysis_technologies")
    .select("id, technology_id, installed_capacity_kw, is_existing, technology_catalog(name, category, min_size_kw, max_size_kw)")
    .eq("analysis_id", analysisId);

  const technologies = (rawTechs ?? []).map((t) => ({
    ...t,
    technology_catalog: Array.isArray(t.technology_catalog) ? t.technology_catalog[0] ?? null : t.technology_catalog ?? null,
  }));

  // Fetch tech configs for this scenario
  const { data: techConfigs } = await supabase
    .from("scenario_tech_configs")
    .select("*")
    .eq("scenario_id", scenarioId);

  return (
    <ScenarioDetailClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      scenario={scenario as any}
      analysisId={analysisId}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      technologies={technologies as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      techConfigs={(techConfigs ?? []) as any}
    />
  );
}
