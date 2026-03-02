"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Trash2, Copy, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SortableHeader } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/shared/status-badge";

interface AnalysisRow {
  id: string;
  name: string;
  year: number;
  status: "draft" | "ready" | "calculated";
  created_at: string;
  site: { name: string } | null;
}

export function getAnalysisColumns(
  onDelete: (id: string, name: string) => void,
  onDuplicate: (id: string) => void,
): ColumnDef<AnalysisRow>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column}>Nome</SortableHeader>,
      cell: ({ row }) => (
        <Link href={`/dashboard/analyses/${row.original.id}/general`} className="font-medium hover:underline">
          {row.getValue("name")}
        </Link>
      ),
    },
    {
      id: "site_name",
      header: "Impianto",
      cell: ({ row }) => row.original.site?.name ?? "—",
    },
    {
      accessorKey: "year",
      header: ({ column }) => <SortableHeader column={column}>Anno</SortableHeader>,
    },
    {
      accessorKey: "status",
      header: "Stato",
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => <SortableHeader column={column}>Creato il</SortableHeader>,
      cell: ({ row }) => new Date(row.getValue("created_at")).toLocaleDateString("it-IT"),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const analysis = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/analyses/${analysis.id}/general`}>
                  <ExternalLink className="mr-2 h-4 w-4" /> Apri
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(analysis.id)}>
                <Copy className="mr-2 h-4 w-4" /> Duplica
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => onDelete(analysis.id, analysis.name)}>
                <Trash2 className="mr-2 h-4 w-4" /> Elimina
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
