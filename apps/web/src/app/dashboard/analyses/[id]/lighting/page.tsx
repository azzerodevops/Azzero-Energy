import { createClient } from "@/lib/supabase/server";
import { LightingClient } from "./lighting-client";

export const dynamic = "force-dynamic";

export default async function LightingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("lighting_zones").select("*").eq("analysis_id", id).order("created_at");
  return <LightingClient analysisId={id} zones={data ?? []} />;
}
