import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { NewAnalysisDropdown } from "@/components/analyses/new-analysis-dropdown";
import { AnalysesTable } from "./analyses-table";

export const metadata: Metadata = { title: "Analisi" };
export const dynamic = "force-dynamic";

export default async function AnalysesPage() {
  const supabase = await createClient();
  const { data: rawAnalyses } = await supabase
    .from("analyses")
    .select("id, name, year, status, created_at, sites(name)")
    .order("created_at", { ascending: false });

  // Normalize the joined site object (Supabase may return array or object)
  const analyses = (rawAnalyses ?? []).map((a) => ({
    ...a,
    site: Array.isArray(a.sites) ? a.sites[0] ?? null : a.sites ?? null,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Analisi" description="Gestisci le tue analisi energetiche">
        <NewAnalysisDropdown />
      </PageHeader>
      <AnalysesTable data={analyses as Array<{ id: string; name: string; year: number; status: "draft" | "ready" | "calculated"; created_at: string; site: { name: string } | null }>} />
    </div>
  );
}
