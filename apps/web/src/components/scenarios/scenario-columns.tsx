"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { MoreHorizontal, Eye, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScenarioStatusBadge } from "./scenario-status-badge";
import { OBJECTIVE_LABELS } from "@azzeroco2/shared";

interface ScenarioRow {
  id: string;
  name: string;
  description: string | null;
  objective: string;
  status: string;
  created_at: string;
  scenario_results: {
    total_capex: string | null;
    total_savings_annual: string | null;
    co2_reduction_percent: string | null;
  } | null;
}

function fmtEur(val: string | null | undefined): string {
  if (!val) return "\u2014";
  const n = parseFloat(val);
  if (isNaN(n)) return "\u2014";
  return `\u20AC ${n.toLocaleString("it-IT", { maximumFractionDigits: 0 })}`;
}

export function getScenarioColumns(
  analysisId: string,
  onDuplicate: (id: string) => void,
  onDelete: (id: string, name: string) => void,
): ColumnDef<ScenarioRow>[] {
  return [
    {
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }) => {
        const s = row.original;
        return (
          <Link
            href={`/dashboard/analyses/${analysisId}/scenarios/${s.id}`}
            className="font-medium text-primary hover:underline"
          >
            {s.name}
          </Link>
        );
      },
    },
    {
      accessorKey: "objective",
      header: "Obiettivo",
      cell: ({ row }) => {
        const obj = row.original.objective;
        const label = OBJECTIVE_LABELS[obj as keyof typeof OBJECTIVE_LABELS] ?? obj;
        return <Badge variant="outline">{label}</Badge>;
      },
    },
    {
      accessorKey: "status",
      header: "Stato",
      cell: ({ row }) => <ScenarioStatusBadge status={row.original.status} />,
    },
    {
      id: "capex",
      header: () => <div className="text-right">CAPEX</div>,
      cell: ({ row }) => (
        <div className="text-right">{fmtEur(row.original.scenario_results?.total_capex)}</div>
      ),
    },
    {
      id: "savings",
      header: () => <div className="text-right">Risparmio/anno</div>,
      cell: ({ row }) => (
        <div className="text-right">{fmtEur(row.original.scenario_results?.total_savings_annual)}</div>
      ),
    },
    {
      id: "co2",
      header: () => <div className="text-right">Riduzione CO\u2082</div>,
      cell: ({ row }) => {
        const pct = row.original.scenario_results?.co2_reduction_percent;
        const formatted = pct ? `${(parseFloat(pct) * 100).toFixed(1)}%` : "\u2014";
        return <div className="text-right">{formatted}</div>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const s = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/analyses/${analysisId}/scenarios/${s.id}`}>
                  <Eye className="mr-2 h-4 w-4" /> Dettaglio
                </Link>
              </DropdownMenuItem>
              {s.status === "completed" && (
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/analyses/${analysisId}/scenarios/${s.id}/results`}>
                    <Eye className="mr-2 h-4 w-4" /> Risultati
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onDuplicate(s.id)}>
                <Copy className="mr-2 h-4 w-4" /> Duplica
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(s.id, s.name)}
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
