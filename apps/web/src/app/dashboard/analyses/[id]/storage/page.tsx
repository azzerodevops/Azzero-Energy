import { createClient } from "@/lib/supabase/server";
import { StorageClient } from "./storage-client";

export const dynamic = "force-dynamic";

export default async function StoragePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("storage_systems").select("*").eq("analysis_id", id).order("created_at");
  return <StorageClient analysisId={id} systems={data ?? []} />;
}
