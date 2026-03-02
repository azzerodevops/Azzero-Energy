import { createClient } from "@/lib/supabase/server";
import { DemandClient } from "./demand-client";

export const dynamic = "force-dynamic";

export default async function DemandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: demands } = await supabase
    .from("demands")
    .select("id, end_use, annual_consumption_mwh, profile_type, hourly_profile, notes")
    .eq("analysis_id", id)
    .order("created_at");

  return <DemandClient analysisId={id} demands={demands ?? []} />;
}
