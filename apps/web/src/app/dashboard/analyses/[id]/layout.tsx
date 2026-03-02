import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { AnalysisHeader } from "@/components/analyses/analysis-header";
import { AnalysisTabsNav } from "@/components/analyses/analysis-tabs-nav";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("analyses")
    .select("name")
    .eq("id", id)
    .single();

  return { title: data?.name ?? "Analisi" };
}

export default async function AnalysisDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: analysis } = await supabase
    .from("analyses")
    .select("id, name, status, year, description, wacc, site_id, sites(name)")
    .eq("id", id)
    .single();

  if (!analysis) notFound();

  const siteData = analysis.sites as unknown as { name: string } | { name: string }[] | null;
  const siteName = Array.isArray(siteData) ? siteData[0]?.name ?? "Sito sconosciuto" : siteData?.name ?? "Sito sconosciuto";

  return (
    <div className="space-y-6">
      <AnalysisHeader
        analysis={{
          id: analysis.id,
          name: analysis.name,
          status: analysis.status as "draft" | "ready" | "calculated",
          year: analysis.year,
        }}
        siteName={siteName}
      />
      <AnalysisTabsNav analysisId={analysis.id} />
      {children}
    </div>
  );
}
