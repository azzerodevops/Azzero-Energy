"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, Zap, Flame } from "lucide-react";
import {
  AreaChart,
  Area,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Static mock data for Italian energy market prices (PUN + PSV)
// These would come from GME/ARERA APIs in production
const ELECTRICITY_PRICES = [
  { month: "Mar", price: 125 },
  { month: "Apr", price: 118 },
  { month: "Mag", price: 112 },
  { month: "Giu", price: 108 },
  { month: "Lug", price: 115 },
  { month: "Ago", price: 120 },
  { month: "Set", price: 118 },
  { month: "Ott", price: 122 },
  { month: "Nov", price: 130 },
  { month: "Dic", price: 135 },
  { month: "Gen", price: 132 },
  { month: "Feb", price: 128 },
];

const GAS_PRICES = [
  { month: "Mar", price: 42 },
  { month: "Apr", price: 40 },
  { month: "Mag", price: 38 },
  { month: "Giu", price: 35 },
  { month: "Lug", price: 33 },
  { month: "Ago", price: 34 },
  { month: "Set", price: 37 },
  { month: "Ott", price: 40 },
  { month: "Nov", price: 45 },
  { month: "Dic", price: 48 },
  { month: "Gen", price: 46 },
  { month: "Feb", price: 44 },
];

const tooltipStyle = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "var(--radius)",
  color: "hsl(var(--popover-foreground))",
};

export function MarketPrices() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Prezzi mercato energetico</CardTitle>
        <p className="text-xs text-muted-foreground">
          Dati indicativi — Fonte: GME/ARERA
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Electricity section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-full p-1.5 bg-blue-500/10">
                <Zap className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium">Elettricità (PUN)</p>
                <p className="text-xs text-muted-foreground">
                  Prezzo Unico Nazionale
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">
                € 128{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  /MWh
                </span>
              </p>
              <Badge variant="outline" className="text-xs text-red-500">
                <TrendingDown className="h-3 w-3 mr-1" />
                -2,3%
              </Badge>
            </div>
          </div>
          {/* Mini area chart */}
          <div className="h-[80px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ELECTRICITY_PRICES}>
                <defs>
                  <linearGradient id="elecGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0097D7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0097D7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#0097D7"
                  fill="url(#elecGrad)"
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number | undefined) => [
                    `€ ${value}/MWh`,
                    "Prezzo",
                  ]}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t" />

        {/* Gas section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-full p-1.5 bg-orange-500/10">
                <Flame className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-medium">Gas naturale (PSV)</p>
                <p className="text-xs text-muted-foreground">
                  Punto di Scambio Virtuale
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">
                € 44{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  /MWh
                </span>
              </p>
              <Badge variant="outline" className="text-xs text-red-500">
                <TrendingDown className="h-3 w-3 mr-1" />
                -4,3%
              </Badge>
            </div>
          </div>
          {/* Mini area chart for gas */}
          <div className="h-[80px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={GAS_PRICES}>
                <defs>
                  <linearGradient id="gasGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#F97316"
                  fill="url(#gasGrad)"
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number | undefined) => [
                    `€ ${value}/MWh`,
                    "Prezzo",
                  ]}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
