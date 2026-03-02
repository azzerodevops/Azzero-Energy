"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Battery, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { StorageForm } from "@/components/storage/storage-form";
import { deleteStorage } from "@/actions/storage";
import { STORAGE_TYPE_LABELS } from "@azzeroco2/shared";

interface StorageSystem {
  id: string;
  analysis_id: string;
  storage_type: string;
  capacity_kwh: number | null;
  max_charge_kw: number | null;
  max_discharge_kw: number | null;
  charge_efficiency: number | null;
  discharge_efficiency: number | null;
}

export function StorageClient({ analysisId, systems }: { analysisId: string; systems: StorageSystem[] }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StorageSystem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StorageSystem | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await deleteStorage(deleteTarget.id, analysisId);
      if (!result.success) { toast.error(result.error); return; }
      toast.success("Accumulo rimosso");
      setDeleteTarget(null);
      router.refresh();
    } finally { setDeleting(false); }
  }

  if (systems.length === 0 && !formOpen) {
    return (
      <>
        <EmptyState icon={Battery} title="Nessun accumulo" description="Aggiungi sistemi di accumulo energetico." actionLabel="Aggiungi accumulo" onAction={() => setFormOpen(true)} />
        <StorageForm open={formOpen} onOpenChange={setFormOpen} analysisId={analysisId} />
      </>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sistemi di accumulo</CardTitle>
          <Button size="sm" onClick={() => { setEditTarget(null); setFormOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Aggiungi</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Capacita (kWh)</TableHead>
                <TableHead>Carica (kW)</TableHead>
                <TableHead>Scarica (kW)</TableHead>
                <TableHead>Eff. carica</TableHead>
                <TableHead>Eff. scarica</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {systems.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{STORAGE_TYPE_LABELS[s.storage_type as keyof typeof STORAGE_TYPE_LABELS] ?? s.storage_type}</TableCell>
                  <TableCell>{s.capacity_kwh ?? "—"}</TableCell>
                  <TableCell>{s.max_charge_kw ?? "—"}</TableCell>
                  <TableCell>{s.max_discharge_kw ?? "—"}</TableCell>
                  <TableCell>{s.charge_efficiency != null ? `${(s.charge_efficiency * 100).toFixed(0)}%` : "—"}</TableCell>
                  <TableCell>{s.discharge_efficiency != null ? `${(s.discharge_efficiency * 100).toFixed(0)}%` : "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setEditTarget(s); setFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(s)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <StorageForm open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditTarget(null); }} analysisId={analysisId} initialData={editTarget ? { ...editTarget, id: editTarget.id } as Record<string, unknown> & { id: string } : undefined} />
      {deleteTarget && <ConfirmDeleteDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)} title="Rimuovi accumulo" description="Rimuovere questo sistema di accumulo?" onConfirm={handleDelete} loading={deleting} />}
    </>
  );
}
