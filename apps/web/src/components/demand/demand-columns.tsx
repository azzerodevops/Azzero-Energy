"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SortableHeader } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { END_USE_LABELS } from "@azzeroco2/shared";

interface DemandRow {
  id: string;
  end_use: string;
  annual_consumption_mwh: number;
  profile_type: string | null;
}

const PROFILE_TYPE_LABELS: Record<string, string> = {
  nace_default: "NACE",
  custom: "Custom",
  upload: "Upload",
};

export function getDemandColumns(
  onEdit: (row: DemandRow) => void,
  onDelete: (id: string) => void,
): ColumnDef<DemandRow>[] {
  return [
    {
      accessorKey: "end_use",
      header: ({ column }) => <SortableHeader column={column}>Utilizzo</SortableHeader>,
      cell: ({ row }) => (
        <Badge variant="outline">
          {END_USE_LABELS[row.getValue("end_use") as keyof typeof END_USE_LABELS] ?? row.getValue("end_use")}
        </Badge>
      ),
    },
    {
      accessorKey: "annual_consumption_mwh",
      header: ({ column }) => <SortableHeader column={column}>Consumo (MWh/a)</SortableHeader>,
      cell: ({ row }) => new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 }).format(row.getValue("annual_consumption_mwh")),
    },
    {
      accessorKey: "profile_type",
      header: "Profilo",
      cell: ({ row }) => PROFILE_TYPE_LABELS[row.getValue("profile_type") as string] ?? "—",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const demand = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(demand)}>
                <Pencil className="mr-2 h-4 w-4" /> Modifica
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={() => onDelete(demand.id)}>
                <Trash2 className="mr-2 h-4 w-4" /> Elimina
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
