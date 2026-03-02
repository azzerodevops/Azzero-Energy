import { createClient } from "@/lib/supabase/server";
import { TechnologiesClient } from "./technologies-client";

export const dynamic = "force-dynamic";

export default async function TechnologiesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: rawTechs } = await supabase
    .from("analysis_technologies")
    .select("id, technology_id, installed_capacity_kw, is_existing, notes, technology_catalog(name, category, capacity_unit)")
    .eq("analysis_id", id)
    .order("created_at");

  // Normalize joined data (Supabase may return array for FK joins)
  const analysisTechs = (rawTechs ?? []).map((t) => ({
    ...t,
    technology_catalog: Array.isArray(t.technology_catalog) ? t.technology_catalog[0] ?? null : t.technology_catalog ?? null,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <TechnologiesClient analysisId={id} technologies={analysisTechs as any} />;
}
