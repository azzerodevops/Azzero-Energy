"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { END_USE_LABELS, CHART_COLORS } from "@azzeroco2/shared";

interface DemandSummary {
  end_use: string;
  annual_consumption_mwh: number;
}

export function EnergyOverviewChart({ demands }: { demands: DemandSummary[] }) {
  if (demands.length === 0) return null;

  const chartData = demands.map((d) => ({
    name: END_USE_LABELS[d.end_use as keyof typeof END_USE_LABELS] ?? d.end_use,
    value: d.annual_consumption_mwh,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Consumo per utilizzo (MWh/a)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number | string | undefined) => [`${Number(value ?? 0).toFixed(1)} MWh`, "Consumo"]}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
