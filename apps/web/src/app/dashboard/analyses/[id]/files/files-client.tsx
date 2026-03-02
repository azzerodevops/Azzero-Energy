"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, FileText, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { registerFile, deleteFile } from "@/actions/files";
import { createBrowserClient } from "@supabase/ssr";

interface FileRow {
  id: string;
  analysis_id: string;
  file_name: string;
  file_type: string | null;
  file_size_bytes: number | null;
  storage_path: string;
  created_at: string;
}

function formatBytes(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilesClient({ analysisId, files }: { analysisId: string; files: FileRow[] }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FileRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const path = `${analysisId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from("analysis-files").upload(path, file);
        if (uploadError) { toast.error(`Errore upload: ${uploadError.message}`); continue; }

        // Get organization_id from the analysis
        const { data: analysis } = await supabase
          .from("analyses")
          .select("organization_id")
          .eq("id", analysisId)
          .single();

        const result = await registerFile({
          organization_id: analysis?.organization_id ?? "",
          analysis_id: analysisId,
          name: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          storage_key: path,
        });
        if (!result.success) { toast.error(result.error); continue; }
        toast.success(`${file.name} caricato`);
      }
      router.refresh();
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }, [analysisId, router, supabase.storage]);

  async function handleDownload(file: FileRow) {
    const { data } = await supabase.storage.from("analysis-files").createSignedUrl(file.storage_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    else toast.error("Errore download");
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await deleteFile(deleteTarget.id, analysisId, deleteTarget.storage_path);
      if (!result.success) { toast.error(result.error); return; }
      toast.success("File eliminato");
      setDeleteTarget(null);
      router.refresh();
    } finally { setDeleting(false); }
  }

  if (files.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState icon={FileText} title="Nessun file" description="Carica bollette, report o altri documenti." actionLabel="Carica file" onAction={() => document.getElementById("file-upload")?.click()} />
        <input id="file-upload" type="file" multiple className="hidden" onChange={handleUpload} />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>File e documenti</CardTitle>
          <div>
            <Button size="sm" onClick={() => document.getElementById("file-upload")?.click()} disabled={uploading}>
              <Upload className="mr-2 h-4 w-4" /> {uploading ? "Caricamento..." : "Carica file"}
            </Button>
            <input id="file-upload" type="file" multiple className="hidden" onChange={handleUpload} />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Dimensione</TableHead>
                <TableHead>Caricato il</TableHead>
                <TableHead className="w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.file_name}</TableCell>
                  <TableCell>{f.file_type ?? "—"}</TableCell>
                  <TableCell>{formatBytes(f.file_size_bytes)}</TableCell>
                  <TableCell>{new Date(f.created_at).toLocaleDateString("it-IT")}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleDownload(f)}><Download className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(f)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {deleteTarget && <ConfirmDeleteDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)} title="Elimina file" description={`Eliminare "${deleteTarget.file_name}"?`} onConfirm={handleDelete} loading={deleting} />}
    </>
  );
}
