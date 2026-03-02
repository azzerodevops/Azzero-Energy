"use client";

import {
  Building2,
  BarChart3,
  Zap,
  TrendingDown,
  CircleDollarSign,
  Leaf,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardKPIs {
  totalSites: number;
  totalAnalyses: number;
  totalScenarios: number;
  completedScenarios: number;
  totalCapex: number;
  totalSavingsAnnual: number;
  avgCo2Reduction: number;
}

interface KPISummaryProps {
  kpis: DashboardKPIs;
}

interface KPICardDef {
  title: string;
  icon: LucideIcon;
  formattedValue: string;
  subtitle?: string;
}

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);

const formatPercent = (value: number): string =>
  new Intl.NumberFormat("it-IT", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value / 100);

function buildCards(kpis: DashboardKPIs): KPICardDef[] {
  return [
    {
      title: "Siti totali",
      icon: Building2,
      formattedValue: String(kpis.totalSites),
    },
    {
      title: "Analisi",
      icon: BarChart3,
      formattedValue: String(kpis.totalAnalyses),
    },
    {
      title: "Scenari completati",
      icon: Zap,
      formattedValue: `${kpis.completedScenarios} / ${kpis.totalScenarios}`,
    },
    {
      title: "CAPEX totale",
      icon: CircleDollarSign,
      formattedValue: formatCurrency(kpis.totalCapex),
    },
    {
      title: "Risparmio annuo",
      icon: TrendingDown,
      formattedValue: formatCurrency(kpis.totalSavingsAnnual),
      subtitle: "EUR/anno",
    },
    {
      title: "Riduzione CO\u2082",
      icon: Leaf,
      formattedValue: formatPercent(kpis.avgCo2Reduction),
      subtitle: "media scenari",
    },
  ];
}

export function KPISummary({ kpis }: KPISummaryProps) {
  const cards = buildCards(kpis);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {card.title}
              </p>
              <card.icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold">{card.formattedValue}</p>
            {card.subtitle && (
              <p className="mt-1 text-xs text-muted-foreground">
                {card.subtitle}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
