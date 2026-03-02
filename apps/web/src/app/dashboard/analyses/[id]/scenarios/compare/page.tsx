import { createClient } from "@/lib/supabase/server";
import { CompareClient } from "./compare-client";

export const dynamic = "force-dynamic";

export default async function ComparePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: analysisId } = await params;
  const supabase = await createClient();

  // Fetch completed scenarios with results
  const { data: rawScenarios } = await supabase
    .from("scenarios")
    .select("id, name, objective, status, scenario_results(total_capex, total_opex_annual, total_savings_annual, payback_years, irr, npv, co2_reduction_percent)")
    .eq("analysis_id", analysisId)
    .eq("status", "completed")
    .order("created_at");

  const scenarios = (rawScenarios ?? []).map((s) => ({
    ...s,
    scenario_results: Array.isArray(s.scenario_results)
      ? s.scenario_results[0] ?? null
      : s.scenario_results ?? null,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <CompareClient analysisId={analysisId} scenarios={scenarios as any} />;
}
