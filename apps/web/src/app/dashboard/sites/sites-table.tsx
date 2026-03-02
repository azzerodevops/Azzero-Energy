"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { getSiteColumns } from "@/components/sites/site-columns";
import { DeleteSiteDialog } from "@/components/sites/delete-site-dialog";
import { MapPin } from "lucide-react";

interface SiteRow {
  id: string;
  name: string;
  city: string | null;
  nace_code: string | null;
  area_sqm: number | null;
  employees: number | null;
  created_at: string;
}

export function SitesTable({ data }: { data: SiteRow[] }) {
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const columns = getSiteColumns((id, name) => setDeleteTarget({ id, name }));

  if (data.length === 0) {
    return (
      <EmptyState
        icon={MapPin}
        title="Nessun impianto"
        description="Crea il tuo primo impianto per iniziare le analisi energetiche."
        actionLabel="Nuovo impianto"
        actionHref="/dashboard/sites/new"
      />
    );
  }

  return (
    <>
      <DataTable columns={columns} data={data} searchKey="name" searchPlaceholder="Cerca impianto..." />
      {deleteTarget && (
        <DeleteSiteDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          siteId={deleteTarget.id}
          siteName={deleteTarget.name}
        />
      )}
    </>
  );
}
