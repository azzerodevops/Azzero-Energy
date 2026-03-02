"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { getAnalysisColumns } from "@/components/analyses/analysis-columns";
import { DeleteAnalysisDialog } from "@/components/analyses/delete-analysis-dialog";
import { duplicateAnalysis } from "@/actions/analyses";
import { Button } from "@/components/ui/button";
import { BarChart3, Wand2, FileEdit } from "lucide-react";

interface AnalysisRow {
  id: string;
  name: string;
  year: number;
  status: "draft" | "ready" | "calculated";
  created_at: string;
  site: { name: string } | null;
}

export function AnalysesTable({ data }: { data: AnalysisRow[] }) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  async function handleDuplicate(id: string) {
    const result = await duplicateAnalysis(id);
    if (result.success) {
      toast.success("Analisi duplicata");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  const columns = getAnalysisColumns(
    (id, name) => setDeleteTarget({ id, name }),
    handleDuplicate,
  );

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <BarChart3 className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Nessuna analisi</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Crea la tua prima analisi energetica per iniziare.
        </p>
        <div className="mt-4 flex gap-3">
          <Button asChild>
            <Link href="/dashboard/analyses/new">
              <Wand2 className="mr-2 h-4 w-4" /> Procedura guidata
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/analyses/new/manual">
              <FileEdit className="mr-2 h-4 w-4" /> Creazione manuale
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <DataTable columns={columns} data={data} searchKey="name" searchPlaceholder="Cerca analisi..." />
      {deleteTarget && (
        <DeleteAnalysisDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          analysisId={deleteTarget.id}
          analysisName={deleteTarget.name}
        />
      )}
    </>
  );
}
