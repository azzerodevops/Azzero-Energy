"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SortableHeader } from "@/components/ui/data-table";

interface SiteRow {
  id: string;
  name: string;
  city: string | null;
  nace_code: string | null;
  area_sqm: number | null;
  employees: number | null;
  created_at: string;
}

export function getSiteColumns(onDelete: (id: string, name: string) => void): ColumnDef<SiteRow>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column}>Nome</SortableHeader>,
    },
    {
      accessorKey: "city",
      header: "Città",
      cell: ({ row }) => row.getValue("city") || "—",
    },
    {
      accessorKey: "nace_code",
      header: "NACE",
      cell: ({ row }) => row.getValue("nace_code") || "—",
    },
    {
      accessorKey: "area_sqm",
      header: "Area (m²)",
      cell: ({ row }) => {
        const val = row.getValue("area_sqm") as number | null;
        return val ? new Intl.NumberFormat("it-IT").format(val) : "—";
      },
    },
    {
      accessorKey: "employees",
      header: "Dipendenti",
      cell: ({ row }) => row.getValue("employees") ?? "—",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const site = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/sites/${site.id}`}>
                  <Pencil className="mr-2 h-4 w-4" /> Modifica
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(site.id, site.name)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Elimina
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
