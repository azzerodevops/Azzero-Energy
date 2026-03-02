"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { getDemandColumns } from "@/components/demand/demand-columns";
import { DemandForm } from "@/components/demand/demand-form";
import { EnergyOverviewChart } from "@/components/demand/energy-overview-chart";
import { ProfileChart } from "@/components/demand/profile-chart";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { deleteDemand } from "@/actions/demands";
import { CHART_COLORS } from "@azzeroco2/shared";

interface Demand {
  id: string;
  end_use: string;
  annual_consumption_mwh: number;
  profile_type: string | null;
  hourly_profile: number[] | null;
  notes: string | null;
}

export function DemandClient({ analysisId, demands }: { analysisId: string; demands: Demand[] }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Demand | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const columns = getDemandColumns(
    (row) => { setEditTarget(row as unknown as Demand); setFormOpen(true); },
    (id) => setDeleteId(id),
  );

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const result = await deleteDemand(deleteId, analysisId);
      if (!result.success) { toast.error(result.error); return; }
      toast.success("Domanda rimossa");
      setDeleteId(null);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  if (demands.length === 0 && !formOpen) {
    return (
      <>
        <EmptyState
          icon={Zap}
          title="Nessuna domanda energetica"
          description="Aggiungi le domande energetiche per questa analisi."
          actionLabel="Aggiungi domanda"
          onAction={() => setFormOpen(true)}
        />
        <DemandForm open={formOpen} onOpenChange={setFormOpen} analysisId={analysisId} />
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <EnergyOverviewChart demands={demands} />
        {demands[0]?.hourly_profile && (
          <ProfileChart
            title={`Profilo - ${demands[0].end_use}`}
            data={demands[0].hourly_profile}
            color={CHART_COLORS[0]}
          />
        )}
      </div>

      {/* Table */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Domande energetiche</h3>
        <Button size="sm" onClick={() => { setEditTarget(null); setFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Aggiungi
        </Button>
      </div>

      <DataTable columns={columns} data={demands} />

      <DemandForm
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditTarget(null); }}
        analysisId={analysisId}
        initialData={editTarget ? { ...editTarget, id: editTarget.id } as Record<string, unknown> & { id: string } : undefined}
      />

      {deleteId && (
        <ConfirmDeleteDialog
          open={!!deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
          title="Rimuovi domanda"
          description="Rimuovere questa domanda energetica dall'analisi?"
          onConfirm={handleDelete}
          loading={deleting}
        />
      )}
    </div>
  );
}
