import { createClient } from "@/lib/supabase/server";
import { ResourcesClient } from "./resources-client";

export const dynamic = "force-dynamic";

export default async function ResourcesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: resources } = await supabase
    .from("analysis_resources")
    .select("*")
    .eq("analysis_id", id)
    .order("created_at");

  return <ResourcesClient analysisId={id} resources={resources ?? []} />;
}
