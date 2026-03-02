"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CHART_COLORS,
  SCENARIO_STATUS_LABELS,
} from "@azzeroco2/shared";

interface ChartData {
  analysisPerMonth: { month: string; count: number }[];
  scenariosByStatus: { status: string; count: number }[];
  topSitesBySavings: { name: string; savings: number }[];
}

interface DashboardChartsProps {
  chartData: ChartData;
}

const STATUS_CHART_COLORS: Record<string, string> = {
  draft: "#64748B",
  queued: "#F59E0B",
  running: "#3B82F6",
  completed: "#10B981",
  failed: "#EF4444",
  outdated: "#F97316",
};

const tooltipStyle = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "var(--radius)",
  color: "hsl(var(--popover-foreground))",
};

function formatEur(value: number | undefined): string {
  if (value == null) return "";
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function DashboardCharts({ chartData }: DashboardChartsProps) {
  return (
    <>
      {/* Chart 1: Analisi per mese */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Analisi per mese</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.analysisPerMonth.length === 0 ? (
            <p className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
              Nessun dato disponibile
            </p>
          ) : (
            <div role="img" aria-label="Grafico a barre: numero di analisi create per mese">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData.analysisPerMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number | undefined, name: string | undefined) => [
                      value ?? 0,
                      name === "count" ? "Analisi" : (name ?? ""),
                    ]}
                  />
                  <Bar dataKey="count" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart 2: Scenari per stato */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scenari per stato</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.scenariosByStatus.length === 0 ? (
            <p className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
              Nessun dato disponibile
            </p>
          ) : (
            <div role="img" aria-label="Grafico a torta: distribuzione degli scenari per stato (bozza, in coda, in esecuzione, completato, fallito, obsoleto)">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={chartData.scenariosByStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {chartData.scenariosByStatus.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_CHART_COLORS[entry.status] ?? "#64748B"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number | undefined, name: string | undefined) => [
                      value ?? 0,
                      name
                        ? SCENARIO_STATUS_LABELS[name as keyof typeof SCENARIO_STATUS_LABELS] ?? name
                        : "",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
                {chartData.scenariosByStatus.map((entry) => (
                  <div key={entry.status} className="flex items-center gap-1.5 text-xs">
                    <span
                      aria-hidden="true"
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: STATUS_CHART_COLORS[entry.status] ?? "#64748B",
                      }}
                    />
                    <span className="text-muted-foreground">
                      {SCENARIO_STATUS_LABELS[entry.status as keyof typeof SCENARIO_STATUS_LABELS] ??
                        entry.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart 3: Top siti per risparmio */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Top siti per risparmio</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.topSitesBySavings.length === 0 ? (
            <p className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
              Nessun dato disponibile
            </p>
          ) : (
            <div role="img" aria-label="Grafico a barre orizzontali: classifica dei siti con maggiore risparmio economico">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData.topSitesBySavings} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  type="number"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                  tickFormatter={(value: number) => formatEur(value)}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number | undefined, name: string | undefined) => [
                    formatEur(value),
                    name === "savings" ? "Risparmio" : (name ?? ""),
                  ]}
                />
                <Bar dataKey="savings" fill={CHART_COLORS[1]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
