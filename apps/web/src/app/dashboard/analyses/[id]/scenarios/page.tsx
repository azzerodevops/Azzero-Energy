import { createClient } from "@/lib/supabase/server";
import { ScenariosClient } from "./scenarios-client";

export const dynamic = "force-dynamic";

export default async function ScenariosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: rawScenarios } = await supabase
    .from("scenarios")
    .select("id, name, description, objective, status, co2_target, budget_limit, created_at, scenario_results(total_capex, total_savings_annual, co2_reduction_percent)")
    .eq("analysis_id", id)
    .order("created_at", { ascending: false });

  const scenarios = (rawScenarios ?? []).map((s) => ({
    ...s,
    scenario_results: Array.isArray(s.scenario_results)
      ? s.scenario_results[0] ?? null
      : s.scenario_results ?? null,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <ScenariosClient analysisId={id} scenarios={scenarios as any} />;
}
