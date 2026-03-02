import type { Metadata } from "next";
import {
  getDashboardKPIs,
  getDashboardChartData,
  getRecentActivity,
  getMultiSiteData,
} from "@/actions/dashboard";
import type { DashboardKPIs } from "@/actions/dashboard";
import { DashboardClient } from "./dashboard-client";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const defaultKPIs: DashboardKPIs = {
  totalSites: 0,
  totalAnalyses: 0,
  totalScenarios: 0,
  completedScenarios: 0,
  totalCapex: 0,
  totalSavingsAnnual: 0,
  avgCo2Reduction: 0,
};

export default async function DashboardPage() {
  const [kpisResult, chartResult, activityResult, multiSiteResult] =
    await Promise.all([
      getDashboardKPIs(),
      getDashboardChartData(),
      getRecentActivity(),
      getMultiSiteData(),
    ]);

  const kpis = kpisResult.success ? kpisResult.data : defaultKPIs;
  const chartData = chartResult.success
    ? chartResult.data
    : { analysisPerMonth: [], scenariosByStatus: [], topSitesBySavings: [] };
  const activity = activityResult.success ? activityResult.data : [];
  const multiSiteData = multiSiteResult.success ? multiSiteResult.data : [];

  return (
    <DashboardClient
      kpis={kpis}
      chartData={chartData}
      activity={activity}
      multiSiteData={multiSiteData}
    />
  );
}
