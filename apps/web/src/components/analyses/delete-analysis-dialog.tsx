"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { deleteAnalysis } from "@/actions/analyses";

interface DeleteAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysisId: string;
  analysisName: string;
}

export function DeleteAnalysisDialog({ open, onOpenChange, analysisId, analysisName }: DeleteAnalysisDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const result = await deleteAnalysis(analysisId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Analisi eliminata");
      onOpenChange(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Elimina analisi"
      description={`Sei sicuro di voler eliminare "${analysisName}"? Verranno rimossi tutti i dati associati (domande, risorse, tecnologie, etc.).`}
      onConfirm={handleDelete}
      loading={loading}
    />
  );
}
