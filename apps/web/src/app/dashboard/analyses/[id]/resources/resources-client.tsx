"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { ResourceTypeBadge } from "@/components/resources/resource-type-badge";
import { ResourceForm } from "@/components/resources/resource-form";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { deleteResource } from "@/actions/resources";

interface Resource {
  id: string;
  analysis_id: string;
  resource_type: string;
  buying_price: number | null;
  selling_price: number | null;
  co2_factor: number | null;
  max_availability: number | null;
  notes: string | null;
}

interface ResourcesClientProps {
  analysisId: string;
  resources: Resource[];
}

export function ResourcesClient({ analysisId, resources }: ResourcesClientProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Resource | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await deleteResource(deleteTarget.id, analysisId);
      if (!result.success) { toast.error(result.error); return; }
      toast.success("Risorsa rimossa");
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  function formatPrice(val: number | null) {
    if (val == null) return "\u2014";
    return `\u20AC ${val.toFixed(2)}/MWh`;
  }

  if (resources.length === 0 && !formOpen) {
    return (
      <>
        <EmptyState
          icon={Zap}
          title="Nessuna risorsa energetica"
          description="Aggiungi le risorse energetiche disponibili per questa analisi."
          actionLabel="Aggiungi risorsa"
          onAction={() => setFormOpen(true)}
        />
        <ResourceForm open={formOpen} onOpenChange={setFormOpen} analysisId={analysisId} />
      </>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Risorse energetiche</CardTitle>
          <Button size="sm" onClick={() => { setEditTarget(null); setFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Aggiungi
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Prezzo acquisto</TableHead>
                <TableHead>Prezzo vendita</TableHead>
                <TableHead>CO₂ (tCO₂/MWh)</TableHead>
                <TableHead>Disp. max (MWh/a)</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources.map((r) => (
                <TableRow key={r.id}>
                  <TableCell><ResourceTypeBadge type={r.resource_type} /></TableCell>
                  <TableCell>{formatPrice(r.buying_price)}</TableCell>
                  <TableCell>{formatPrice(r.selling_price)}</TableCell>
                  <TableCell>{r.co2_factor?.toFixed(3) ?? "\u2014"}</TableCell>
                  <TableCell>{r.max_availability != null ? new Intl.NumberFormat("it-IT").format(r.max_availability) : "\u2014"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setEditTarget(r); setFormOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(r)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ResourceForm
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditTarget(null); }}
        analysisId={analysisId}
        initialData={editTarget ? { ...editTarget, id: editTarget.id } as Record<string, unknown> & { id: string } : undefined}
      />

      {deleteTarget && (
        <ConfirmDeleteDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="Rimuovi risorsa"
          description="Rimuovere questa risorsa energetica dall'analisi?"
          onConfirm={handleDelete}
          loading={deleting}
        />
      )}
    </>
  );
}
