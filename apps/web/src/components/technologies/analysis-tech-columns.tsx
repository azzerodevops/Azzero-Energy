"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SortableHeader } from "@/components/ui/data-table";

interface AnalysisTechRow {
  id: string;
  technology_id: string;
  installed_capacity_kw: number | null;
  is_existing: boolean | null;
  notes: string | null;
  technology_catalog: { name: string; category: string; capacity_unit: string | null } | null;
}

export function getAnalysisTechColumns(
  onEdit: (row: AnalysisTechRow) => void,
  onDelete: (id: string, name: string) => void,
): ColumnDef<AnalysisTechRow>[] {
  return [
    {
      id: "name",
      header: ({ column }) => <SortableHeader column={column}>Tecnologia</SortableHeader>,
      accessorFn: (row) => row.technology_catalog?.name ?? "\u2014",
    },
    {
      id: "category",
      header: "Categoria",
      accessorFn: (row) => row.technology_catalog?.category ?? "\u2014",
      cell: ({ getValue }) => <Badge variant="secondary">{getValue() as string}</Badge>,
    },
    {
      accessorKey: "installed_capacity_kw",
      header: "Capacita",
      cell: ({ row }) => {
        const val = row.getValue("installed_capacity_kw") as number | null;
        const unit = row.original.technology_catalog?.capacity_unit ?? "kW";
        return val != null ? `${new Intl.NumberFormat("it-IT").format(val)} ${unit}` : "\u2014";
      },
    },
    {
      accessorKey: "is_existing",
      header: "Stato",
      cell: ({ row }) => row.getValue("is_existing") ? (
        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Esistente</Badge>
      ) : (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Nuova</Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const tech = row.original;
        const name = tech.technology_catalog?.name ?? "tecnologia";
        return (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => onEdit(tech)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(tech.id, name)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        );
      },
    },
  ];
}
