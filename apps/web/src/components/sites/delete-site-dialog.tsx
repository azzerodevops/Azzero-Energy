"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { deleteSite } from "@/actions/sites";

interface DeleteSiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
  siteName: string;
}

export function DeleteSiteDialog({ open, onOpenChange, siteId, siteName }: DeleteSiteDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const result = await deleteSite(siteId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Impianto eliminato");
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
      title="Elimina impianto"
      description={`Sei sicuro di voler eliminare "${siteName}"? Questa azione è irreversibile e rimuoverà anche tutte le analisi associate.`}
      onConfirm={handleDelete}
      loading={loading}
    />
  );
}
