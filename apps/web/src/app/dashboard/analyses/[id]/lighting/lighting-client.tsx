"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Lightbulb, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { LightingZoneForm } from "@/components/lighting/lighting-zone-form";
import { deleteLightingZone } from "@/actions/lighting";

interface Zone {
  id: string;
  analysis_id: string;
  zone_name: string;
  area_sqm: number | null;
  fixture_type: string | null;
  wattage_per_fixture: number | null;
  fixture_count: number | null;
  operating_hours_year: number | null;
  relamping_wattage: number | null;
  relamping_fixture_count: number | null;
}

function calcKwh(wattage: number | null, count: number | null, hours: number | null) {
  if (!wattage || !count || !hours) return null;
  return (wattage * count * hours) / 1000;
}

export function LightingClient({ analysisId, zones }: { analysisId: string; zones: Zone[] }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Zone | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Zone | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await deleteLightingZone(deleteTarget.id, analysisId);
      if (!result.success) { toast.error(result.error); return; }
      toast.success("Zona rimossa");
      setDeleteTarget(null);
      router.refresh();
    } finally { setDeleting(false); }
  }

  const totalCurrentKwh = zones.reduce((sum, z) => sum + (calcKwh(z.wattage_per_fixture, z.fixture_count, z.operating_hours_year) ?? 0), 0);
  const totalRelampKwh = zones.reduce((sum, z) => sum + (calcKwh(z.relamping_wattage, z.relamping_fixture_count ?? z.fixture_count, z.operating_hours_year) ?? 0), 0);
  const savings = totalCurrentKwh - totalRelampKwh;

  if (zones.length === 0 && !formOpen) {
    return (
      <>
        <EmptyState icon={Lightbulb} title="Nessuna zona illuminazione" description="Aggiungi le zone di illuminazione per l'analisi relamping." actionLabel="Aggiungi zona" onAction={() => setFormOpen(true)} />
        <LightingZoneForm open={formOpen} onOpenChange={setFormOpen} analysisId={analysisId} />
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Summary */}
      {zones.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Consumo attuale</p><p className="text-2xl font-bold">{(totalCurrentKwh / 1000).toFixed(1)} MWh/a</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Consumo post-relamping</p><p className="text-2xl font-bold">{(totalRelampKwh / 1000).toFixed(1)} MWh/a</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Risparmio stimato</p><p className="text-2xl font-bold text-green-500">{(savings / 1000).toFixed(1)} MWh/a</p></CardContent></Card>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Zone illuminazione</CardTitle>
          <Button size="sm" onClick={() => { setEditTarget(null); setFormOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Aggiungi</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zona</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>W/lamp.</TableHead>
                <TableHead>N. lamp.</TableHead>
                <TableHead>Ore/a</TableHead>
                <TableHead>kWh/a</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {zones.map((z) => {
                const kwh = calcKwh(z.wattage_per_fixture, z.fixture_count, z.operating_hours_year);
                return (
                  <TableRow key={z.id}>
                    <TableCell className="font-medium">{z.zone_name}</TableCell>
                    <TableCell>{z.fixture_type ?? "—"}</TableCell>
                    <TableCell>{z.wattage_per_fixture ?? "—"}</TableCell>
                    <TableCell>{z.fixture_count ?? "—"}</TableCell>
                    <TableCell>{z.operating_hours_year ?? "—"}</TableCell>
                    <TableCell>{kwh != null ? new Intl.NumberFormat("it-IT", { maximumFractionDigits: 0 }).format(kwh) : "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setEditTarget(z); setFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(z)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <LightingZoneForm open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditTarget(null); }} analysisId={analysisId} initialData={editTarget ? { ...editTarget, id: editTarget.id } as Record<string, unknown> & { id: string } : undefined} />
      {deleteTarget && <ConfirmDeleteDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)} title="Rimuovi zona" description={`Rimuovere "${deleteTarget.zone_name}"?`} onConfirm={handleDelete} loading={deleting} />}
    </div>
  );
}
