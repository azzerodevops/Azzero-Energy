"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHART_COLORS } from "@azzeroco2/shared";

interface TechResultRow {
  id: string;
  technology_id: string;
  optimal_capacity_kw: string | null;
  annual_production_mwh: string | null;
  capex: string | null;
  annual_savings: string | null;
  technology_catalog: { name: string; category: string } | null;
}

interface ResultsChartsProps {
  techResults: TechResultRow[];
}

function shortName(name: string): string {
  if (name.length <= 16) return name;
  return name.slice(0, 14) + "\u2026";
}

function fmtEur(value: number): string {
  return `\u20AC ${value.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const tooltipStyle = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "var(--radius)",
  color: "hsl(var(--popover-foreground))",
};

export function ResultsCharts({ techResults }: ResultsChartsProps) {
  if (techResults.length === 0) return null;

  // Bar chart data: CAPEX vs Risparmio annuo per tecnologia
  const barData = techResults
    .filter((t) => t.capex || t.annual_savings)
    .map((t) => ({
      name: shortName(t.technology_catalog?.name ?? "N/D"),
      fullName: t.technology_catalog?.name ?? "N/D",
      capex: t.capex ? parseFloat(t.capex) : 0,
      risparmio: t.annual_savings ? parseFloat(t.annual_savings) : 0,
    }));

  // Pie chart data: produzione annua per tecnologia
  const pieData = techResults
    .filter(
      (t) =>
        t.annual_production_mwh &&
        parseFloat(t.annual_production_mwh) > 0,
    )
    .map((t, i) => ({
      name: t.technology_catalog?.name ?? "N/D",
      value: parseFloat(t.annual_production_mwh!),
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));

  const hasBarData = barData.length > 0;
  const hasPieData = pieData.length > 0;

  if (!hasBarData && !hasPieData) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Bar Chart: CAPEX vs Risparmio */}
      {hasBarData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              CAPEX vs Risparmio annuo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={barData}
                margin={{ top: 5, right: 20, bottom: 5, left: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="name"
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 12,
                  }}
                />
                <YAxis
                  tickFormatter={(v: number) =>
                    v >= 1000
                      ? `${(v / 1000).toLocaleString("it-IT")}k`
                      : v.toString()
                  }
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 12,
                  }}
                />
                <Tooltip
                  formatter={(value: number | undefined, name: string | undefined) => [
                    fmtEur(value ?? 0),
                    name === "capex" ? "CAPEX" : "Risparmio annuo",
                  ]}
                  labelFormatter={(_label: unknown, payload: readonly unknown[]) =>
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (payload as any)?.[0]?.payload?.fullName ?? String(_label)
                  }
                  contentStyle={tooltipStyle}
                />
                <Legend
                  formatter={(value: string) =>
                    value === "capex" ? "CAPEX" : "Risparmio annuo"
                  }
                />
                <Bar
                  dataKey="capex"
                  fill={CHART_COLORS[0]}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="risparmio"
                  fill={CHART_COLORS[1]}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Pie Chart: Produzione per tecnologia */}
      {hasPieData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Produzione annua per tecnologia (MWh)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }: { name?: string; percent?: number }) =>
                    `${shortName(name ?? "")} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number | undefined) => [
                    `${(value ?? 0).toLocaleString("it-IT", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} MWh`,
                    "Produzione",
                  ]}
                  contentStyle={tooltipStyle}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
