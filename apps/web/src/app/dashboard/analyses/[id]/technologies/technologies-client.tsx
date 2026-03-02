"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { getAnalysisTechColumns } from "@/components/technologies/analysis-tech-columns";
import { AddTechnologyDialog } from "@/components/technologies/add-technology-dialog";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { removeAnalysisTech } from "@/actions/technologies";

interface TechRow {
  id: string;
  technology_id: string;
  installed_capacity_kw: number | null;
  is_existing: boolean | null;
  notes: string | null;
  technology_catalog: { name: string; category: string; capacity_unit: string | null } | null;
}

export function TechnologiesClient({ analysisId, technologies }: { analysisId: string; technologies: TechRow[] }) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const columns = getAnalysisTechColumns(
    () => {}, // edit not implemented yet
    (id, name) => setDeleteTarget({ id, name }),
  );

  const existingTechIds = technologies.map((t) => t.technology_id);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await removeAnalysisTech(deleteTarget.id, analysisId);
      if (!result.success) { toast.error(result.error); return; }
      toast.success("Tecnologia rimossa");
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  if (technologies.length === 0 && !addOpen) {
    return (
      <>
        <EmptyState
          icon={Cpu}
          title="Nessuna tecnologia"
          description="Aggiungi tecnologie dal catalogo per questa analisi."
          actionLabel="Sfoglia catalogo"
          onAction={() => setAddOpen(true)}
        />
        <AddTechnologyDialog open={addOpen} onOpenChange={setAddOpen} analysisId={analysisId} existingTechIds={existingTechIds} />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Tecnologie nell&apos;analisi</h3>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Aggiungi
        </Button>
      </div>

      <DataTable columns={columns} data={technologies} />

      <AddTechnologyDialog open={addOpen} onOpenChange={setAddOpen} analysisId={analysisId} existingTechIds={existingTechIds} />

      {deleteTarget && (
        <ConfirmDeleteDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="Rimuovi tecnologia"
          description={`Rimuovere "${deleteTarget.name}" dall'analisi?`}
          onConfirm={handleDelete}
          loading={deleting}
        />
      )}
    </div>
  );
}
