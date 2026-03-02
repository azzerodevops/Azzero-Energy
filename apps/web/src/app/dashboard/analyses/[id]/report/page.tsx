import { createClient } from "@/lib/supabase/server";
import { ReportClient } from "./report-client";

export const dynamic = "force-dynamic";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: analysisId } = await params;
  const supabase = await createClient();

  // Fetch completed scenarios for this analysis
  const { data: scenarios } = await supabase
    .from("scenarios")
    .select("id, name, objective, status")
    .eq("analysis_id", analysisId)
    .eq("status", "completed")
    .order("created_at");

  // Fetch existing reports
  const { data: reports } = await supabase
    .from("reports")
    .select("id, name, format, file_url, created_at")
    .eq("analysis_id", analysisId)
    .order("created_at", { ascending: false });

  return (
    <ReportClient
      analysisId={analysisId}
      scenarios={scenarios ?? []}
      reports={reports ?? []}
    />
  );
}
