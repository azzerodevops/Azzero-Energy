"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { GitCompareArrows } from "lucide-react";
import { OBJECTIVE_LABELS, CHART_COLORS } from "@azzeroco2/shared";

interface ScenarioWithResults {
  id: string;
  name: string;
  objective: string;
  scenario_results: {
    total_capex: string | null;
    total_opex_annual: string | null;
    total_savings_annual: string | null;
    payback_years: string | null;
    irr: string | null;
    npv: string | null;
    co2_reduction_percent: string | null;
  } | null;
}

function fmt(val: string | null | undefined, decimals = 0): string {
  if (!val) return "—";
  const n = parseFloat(val);
  if (isNaN(n)) return "—";
  return n.toLocaleString("it-IT", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtEur(val: string | null | undefined): string {
  if (!val) return "—";
  const n = parseFloat(val);
  if (isNaN(n)) return "—";
  return `€ ${n.toLocaleString("it-IT", { maximumFractionDigits: 0 })}`;
}

export function CompareClient({ analysisId, scenarios }: { analysisId: string; scenarios: ScenarioWithResults[] }) {
  if (scenarios.length < 2) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/analyses/${analysisId}/scenarios`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Torna agli scenari
          </Link>
        </Button>
        <EmptyState
          icon={GitCompareArrows}
          title="Confronto non disponibile"
          description="Servono almeno 2 scenari completati per il confronto."
          actionLabel="Torna agli scenari"
          actionHref={`/dashboard/analyses/${analysisId}/scenarios`}
        />
      </div>
    );
  }

  const co2Data = scenarios.map(s => ({
    name: s.name,
    co2: s.scenario_results?.co2_reduction_percent
      ? parseFloat(s.scenario_results.co2_reduction_percent) * 100
      : 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/analyses/${analysisId}/scenarios`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-xl font-bold">Confronto scenari</h2>
      </div>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riepilogo finanziario</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metrica</TableHead>
                {scenarios.map(s => (
                  <TableHead key={s.id} className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span>{s.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {OBJECTIVE_LABELS[s.objective as keyof typeof OBJECTIVE_LABELS] ?? s.objective}
                      </Badge>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">CAPEX totale</TableCell>
                {scenarios.map(s => (
                  <TableCell key={s.id} className="text-center">{fmtEur(s.scenario_results?.total_capex)}</TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">OPEX annuo</TableCell>
                {scenarios.map(s => (
                  <TableCell key={s.id} className="text-center">{fmtEur(s.scenario_results?.total_opex_annual)}</TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Risparmio annuo</TableCell>
                {scenarios.map(s => (
                  <TableCell key={s.id} className="text-center">{fmtEur(s.scenario_results?.total_savings_annual)}</TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Payback</TableCell>
                {scenarios.map(s => {
                  const raw = s.scenario_results?.payback_years;
                  const formatted = raw ? `${fmt(raw, 1)} anni` : "—";
                  return <TableCell key={s.id} className="text-center">{formatted}</TableCell>;
                })}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">NPV</TableCell>
                {scenarios.map(s => (
                  <TableCell key={s.id} className="text-center">{fmtEur(s.scenario_results?.npv)}</TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Riduzione CO₂</TableCell>
                {scenarios.map(s => {
                  const raw = s.scenario_results?.co2_reduction_percent;
                  const formatted = raw ? `${(parseFloat(raw) * 100).toFixed(1)}%` : "—";
                  return <TableCell key={s.id} className="text-center">{formatted}</TableCell>;
                })}
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* CO2 Reduction Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riduzione CO₂ per scenario (%)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={co2Data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number | undefined) => [`${(value ?? 0).toFixed(1)}%`, "Riduzione CO₂"]}
              />
              <Bar dataKey="co2" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
