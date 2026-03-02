import { createClient } from "@/lib/supabase/server";
import { FilesClient } from "./files-client";

export const dynamic = "force-dynamic";

export default async function FilesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("analysis_files").select("*").eq("analysis_id", id).order("created_at", { ascending: false });
  return <FilesClient analysisId={id} files={data ?? []} />;
}
