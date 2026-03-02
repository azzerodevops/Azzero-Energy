"use client";

import Link from "next/link";
import {
  ArrowLeft,
  DollarSign,
  TrendingDown,
  Leaf,
  Clock,
  Calculator,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/shared/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResultsCharts } from "@/components/scenarios/results-charts";
import { OBJECTIVE_LABELS } from "@azzeroco2/shared";

interface ResultsClientProps {
  analysisId: string;
  scenario: { id: string; name: string; objective: string; status: string };
  results: {
    total_capex: string | null;
    total_opex_annual: string | null;
    total_savings_annual: string | null;
    payback_years: string | null;
    irr: string | null;
    npv: string | null;
    co2_reduction_percent: string | null;
    calculated_at: string;
  };
  techResults: Array<{
    id: string;
    technology_id: string;
    optimal_capacity_kw: string | null;
    annual_production_mwh: string | null;
    capex: string | null;
    annual_savings: string | null;
    technology_catalog: { name: string; category: string } | null;
  }>;
}

function fmt(val: string | null | undefined, decimals = 0): string {
  if (!val) return "\u2014";
  const n = parseFloat(val);
  if (isNaN(n)) return "\u2014";
  return n.toLocaleString("it-IT", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtEur(val: string | null | undefined): string {
  if (!val) return "\u2014";
  const n = parseFloat(val);
  if (isNaN(n)) return "\u2014";
  return `\u20AC ${n.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function ResultsClient({
  analysisId,
  scenario,
  results,
  techResults,
}: ResultsClientProps) {
  const objectiveLabel =
    OBJECTIVE_LABELS[scenario.objective as keyof typeof OBJECTIVE_LABELS] ??
    scenario.objective;
  const co2Pct = results.co2_reduction_percent
    ? parseFloat(results.co2_reduction_percent) * 100
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link
            href={`/dashboard/analyses/${analysisId}/scenarios/${scenario.id}`}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">
              Risultati: {scenario.name}
            </h2>
            <Badge variant="outline">{objectiveLabel}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Calcolato il{" "}
            {new Date(results.calculated_at).toLocaleDateString("it-IT")}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="CAPEX totale"
          value={fmtEur(results.total_capex)}
          icon={DollarSign}
          iconColor="text-blue-500"
        />
        <KpiCard
          title="Risparmio annuo"
          value={fmtEur(results.total_savings_annual)}
          icon={TrendingDown}
          iconColor="text-emerald-500"
        />
        <KpiCard
          title="Payback"
          value={
            results.payback_years
              ? `${fmt(results.payback_years, 1)} anni`
              : "\u2014"
          }
          icon={Clock}
          iconColor="text-amber-500"
        />
        <KpiCard
          title="Riduzione CO\u2082"
          value={co2Pct !== null ? `${co2Pct.toFixed(1)}%` : "\u2014"}
          icon={Leaf}
          iconColor="text-green-500"
        />
      </div>

      {/* Additional financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="OPEX annuo"
          value={fmtEur(results.total_opex_annual)}
          icon={Calculator}
          iconColor="text-orange-500"
        />
        <KpiCard
          title="NPV"
          value={fmtEur(results.npv)}
          icon={BarChart3}
          iconColor="text-purple-500"
        />
        <KpiCard
          title="IRR"
          value={
            results.irr
              ? `${(parseFloat(results.irr) * 100).toFixed(1)}%`
              : "\u2014"
          }
          icon={TrendingDown}
          iconColor="text-cyan-500"
        />
      </div>

      {/* Charts */}
      <ResultsCharts techResults={techResults} />

      {/* Technology Results Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dettaglio tecnologie</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tecnologia</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">
                  Capacit\u00E0 ottimale
                </TableHead>
                <TableHead className="text-right">Produzione annua</TableHead>
                <TableHead className="text-right">CAPEX</TableHead>
                <TableHead className="text-right">Risparmio annuo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {techResults.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    Nessun risultato tecnologico disponibile.
                  </TableCell>
                </TableRow>
              ) : (
                techResults.map((tr) => (
                  <TableRow key={tr.id}>
                    <TableCell className="font-medium">
                      {tr.technology_catalog?.name ?? "\u2014"}
                    </TableCell>
                    <TableCell>
                      {tr.technology_catalog?.category ?? "\u2014"}
                    </TableCell>
                    <TableCell className="text-right">
                      {fmt(tr.optimal_capacity_kw, 1)} kW
                    </TableCell>
                    <TableCell className="text-right">
                      {fmt(tr.annual_production_mwh, 1)} MWh
                    </TableCell>
                    <TableCell className="text-right">
                      {fmtEur(tr.capex)}
                    </TableCell>
                    <TableCell className="text-right">
                      {fmtEur(tr.annual_savings)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
