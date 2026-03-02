"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { DataTable, SortableHeader } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";

interface MultiSiteRow {
  id: string;
  name: string;
  city: string | null;
  nace_code: string | null;
  totalConsumption: number;
  totalCapex: number;
  totalSavings: number;
  co2Reduction: number;
  scenarioCount: number;
}

interface MultiSiteTableProps {
  data: MultiSiteRow[];
}

const columns: ColumnDef<MultiSiteRow>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <SortableHeader column={column}>Sito</SortableHeader>
    ),
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.getValue("name")}</p>
        <p className="text-xs text-muted-foreground">
          {row.original.city ?? "\u2014"}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "nace_code",
    header: "NACE",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs">
        {row.getValue("nace_code") ?? "\u2014"}
      </Badge>
    ),
  },
  {
    accessorKey: "totalConsumption",
    header: ({ column }) => (
      <SortableHeader column={column}>Consumo (MWh)</SortableHeader>
    ),
    cell: ({ row }) => {
      const val = row.getValue("totalConsumption") as number;
      return (
        <span>
          {val.toLocaleString("it-IT", { maximumFractionDigits: 0 })}
        </span>
      );
    },
  },
  {
    accessorKey: "totalCapex",
    header: ({ column }) => (
      <SortableHeader column={column}>CAPEX (&euro;)</SortableHeader>
    ),
    cell: ({ row }) => {
      const val = row.getValue("totalCapex") as number;
      return (
        <span>
          {val > 0
            ? `\u20AC ${val.toLocaleString("it-IT", { maximumFractionDigits: 0 })}`
            : "\u2014"}
        </span>
      );
    },
  },
  {
    accessorKey: "totalSavings",
    header: ({ column }) => (
      <SortableHeader column={column}>Risparmio (&euro;/a)</SortableHeader>
    ),
    cell: ({ row }) => {
      const val = row.getValue("totalSavings") as number;
      return (
        <span className={val > 0 ? "text-emerald-500" : ""}>
          {val > 0
            ? `\u20AC ${val.toLocaleString("it-IT", { maximumFractionDigits: 0 })}`
            : "\u2014"}
        </span>
      );
    },
  },
  {
    accessorKey: "co2Reduction",
    header: ({ column }) => (
      <SortableHeader column={column}>
        CO<sub>2</sub> (%)
      </SortableHeader>
    ),
    cell: ({ row }) => {
      const val = row.getValue("co2Reduction") as number;
      return (
        <span className={val > 0 ? "text-emerald-500" : ""}>
          {val > 0
            ? `${val.toLocaleString("it-IT", { maximumFractionDigits: 1 })}%`
            : "\u2014"}
        </span>
      );
    },
  },
  {
    accessorKey: "scenarioCount",
    header: "Scenari",
    cell: ({ row }) => <span>{row.getValue("scenarioCount")}</span>,
  },
];

export function MultiSiteTable({ data }: MultiSiteTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Panoramica multi-sito
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={data}
          searchKey="name"
          searchPlaceholder="Cerca sito..."
        />
      </CardContent>
    </Card>
  );
}
