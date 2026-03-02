"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { KPISummary } from "@/components/dashboard/kpi-summary";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { MarketPrices } from "@/components/dashboard/market-prices";
import { MultiSiteTable } from "@/components/dashboard/multi-site-table";

const DashboardCharts = dynamic(
  () =>
    import("@/components/dashboard/dashboard-charts").then((m) => ({
      default: m.DashboardCharts,
    })),
  {
    loading: () => (
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    ),
  }
);

export interface DashboardKPIs {
  totalSites: number;
  totalAnalyses: number;
  totalScenarios: number;
  completedScenarios: number;
  totalCapex: number;
  totalSavingsAnnual: number;
  avgCo2Reduction: number;
}

export interface ChartData {
  analysisPerMonth: { month: string; count: number }[];
  scenariosByStatus: { status: string; count: number }[];
  topSitesBySavings: { name: string; savings: number }[];
}

export interface ActivityItem {
  id: string;
  type: "analysis_created" | "scenario_completed" | "scenario_failed";
  title: string;
  description: string;
  timestamp: string;
}

export interface MultiSiteRow {
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

interface DashboardClientProps {
  kpis: DashboardKPIs;
  chartData: ChartData;
  activity: ActivityItem[];
  multiSiteData: MultiSiteRow[];
}

export function DashboardClient({
  kpis,
  chartData,
  activity,
  multiSiteData,
}: DashboardClientProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Panoramica delle tue analisi energetiche
        </p>
      </div>

      {/* KPI Cards row */}
      <KPISummary kpis={kpis} />

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCharts chartData={chartData} />
      </div>

      {/* Activity + Market Prices row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentActivity activity={activity} />
        </div>
        <MarketPrices />
      </div>

      {/* Multi-site overview */}
      {multiSiteData.length > 0 && <MultiSiteTable data={multiSiteData} />}
    </div>
  );
}
