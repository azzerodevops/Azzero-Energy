"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, FlaskConical, GitCompareArrows } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { ScenarioFormDialog } from "@/components/scenarios/scenario-form-dialog";
import { getScenarioColumns } from "@/components/scenarios/scenario-columns";
import { deleteScenario, duplicateScenario } from "@/actions/scenarios";

interface ScenarioRow {
  id: string;
  name: string;
  description: string | null;
  objective: string;
  status: string;
  co2_target: string | null;
  budget_limit: string | null;
  created_at: string;
  scenario_results: {
    total_capex: string | null;
    total_savings_annual: string | null;
    co2_reduction_percent: string | null;
  } | null;
}

export function ScenariosClient({ analysisId, scenarios }: { analysisId: string; scenarios: ScenarioRow[] }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const completedCount = scenarios.filter(s => s.status === "completed").length;

  async function handleDuplicate(id: string) {
    const result = await duplicateScenario(id, analysisId);
    if (!result.success) { toast.error(result.error); return; }
    toast.success("Scenario duplicato");
    router.refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await deleteScenario(deleteTarget.id, analysisId);
      if (!result.success) { toast.error(result.error); return; }
      toast.success("Scenario eliminato");
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  const columns = getScenarioColumns(
    analysisId,
    (id) => handleDuplicate(id),
    (id, name) => setDeleteTarget({ id, name }),
  );

  if (scenarios.length === 0 && !createOpen) {
    return (
      <>
        <EmptyState
          icon={FlaskConical}
          title="Nessuno scenario"
          description="Crea il tuo primo scenario di ottimizzazione per questa analisi."
          actionLabel="Crea scenario"
          onAction={() => setCreateOpen(true)}
        />
        <ScenarioFormDialog open={createOpen} onOpenChange={setCreateOpen} analysisId={analysisId} />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Scenari di ottimizzazione</h3>
        <div className="flex gap-2">
          {completedCount >= 2 && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/analyses/${analysisId}/scenarios/compare`}>
                <GitCompareArrows className="mr-2 h-4 w-4" /> Confronta
              </Link>
            </Button>
          )}
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Crea scenario
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={scenarios} />

      <ScenarioFormDialog open={createOpen} onOpenChange={setCreateOpen} analysisId={analysisId} />

      {deleteTarget && (
        <ConfirmDeleteDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="Elimina scenario"
          description={`Eliminare lo scenario "${deleteTarget.name}" e tutti i suoi risultati?`}
          onConfirm={handleDelete}
          loading={deleting}
        />
      )}
    </div>
  );
}
