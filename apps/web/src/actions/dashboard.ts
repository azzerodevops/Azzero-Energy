"use server";

import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DashboardKPIs {
  totalSites: number;
  totalAnalyses: number;
  totalScenarios: number;
  completedScenarios: number;
  totalCapex: number;
  totalSavingsAnnual: number;
  avgCo2Reduction: number;
}

export interface AnalysisPerMonth {
  month: string;
  count: number;
}

export interface ScenariosByStatus {
  status: string;
  count: number;
}

export interface TopSiteBySavings {
  name: string;
  savings: number;
}

export interface DashboardChartData {
  analysisPerMonth: AnalysisPerMonth[];
  scenariosByStatus: ScenariosByStatus[];
  topSitesBySavings: TopSiteBySavings[];
}

export interface ActivityItem {
  id: string;
  type: "analysis_created" | "scenario_completed" | "scenario_failed";
  title: string;
  description: string;
  timestamp: string;
}

export interface MapSite {
  id: string;
  name: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  nace_code: string | null;
  sector: string | null;
  area_sqm: number | null;
  analysisCount: number;
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeNumber(value: unknown): number {
  if (value == null) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

// ---------------------------------------------------------------------------
// 1. getDashboardKPIs
// ---------------------------------------------------------------------------

export async function getDashboardKPIs(): Promise<
  { success: true; data: DashboardKPIs } | { success: false; error: string }
> {
  try {
    const supabase = await createClient();

    const [sitesRes, analysesRes, scenariosRes, completedRes, resultsRes] =
      await Promise.all([
        supabase
          .from("sites")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("analyses")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("scenarios")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("scenarios")
          .select("id", { count: "exact", head: true })
          .eq("status", "completed"),
        supabase
          .from("scenario_results")
          .select("total_capex, total_savings_annual, co2_reduction_percent"),
      ]);

    const results = resultsRes.data ?? [];

    let totalCapex = 0;
    let totalSavingsAnnual = 0;
    let sumCo2Reduction = 0;

    for (const r of results) {
      totalCapex += safeNumber(r.total_capex);
      totalSavingsAnnual += safeNumber(r.total_savings_annual);
      sumCo2Reduction += safeNumber(r.co2_reduction_percent);
    }

    const avgCo2Reduction =
      results.length > 0 ? sumCo2Reduction / results.length : 0;

    return {
      success: true as const,
      data: {
        totalSites: sitesRes.count ?? 0,
        totalAnalyses: analysesRes.count ?? 0,
        totalScenarios: scenariosRes.count ?? 0,
        completedScenarios: completedRes.count ?? 0,
        totalCapex,
        totalSavingsAnnual,
        avgCo2Reduction,
      },
    };
  } catch {
    return { success: false as const, error: "Errore nel caricamento dei KPI" };
  }
}

// ---------------------------------------------------------------------------
// 2. getDashboardChartData
// ---------------------------------------------------------------------------

export async function getDashboardChartData(): Promise<
  | { success: true; data: DashboardChartData }
  | { success: false; error: string }
> {
  try {
    const supabase = await createClient();

    // Calculate 12 months ago from today
    const now = new Date();
    const twelveMonthsAgo = new Date(
      now.getFullYear() - 1,
      now.getMonth(),
      1
    );
    const cutoff = twelveMonthsAgo.toISOString();

    const [analysesRes, scenariosRes, resultsRes] = await Promise.all([
      supabase
        .from("analyses")
        .select("created_at")
        .gte("created_at", cutoff)
        .order("created_at", { ascending: true }),
      supabase.from("scenarios").select("status"),
      supabase
        .from("scenario_results")
        .select(
          "total_savings_annual, scenario_id, scenarios(analysis_id, analyses(site_id, sites(name)))"
        ),
    ]);

    // --- Analysis per month (last 12 months) ---
    const monthCounts = new Map<string, number>();

    // Pre-fill all 12 months so we always return a complete series
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthCounts.set(key, 0);
    }

    for (const a of analysesRes.data ?? []) {
      const d = new Date(a.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
    }

    const analysisPerMonth: AnalysisPerMonth[] = Array.from(
      monthCounts.entries()
    ).map(([month, count]) => ({ month, count }));

    // --- Scenarios by status ---
    const statusCounts = new Map<string, number>();

    for (const s of scenariosRes.data ?? []) {
      const st = s.status ?? "unknown";
      statusCounts.set(st, (statusCounts.get(st) ?? 0) + 1);
    }

    const scenariosByStatus: ScenariosByStatus[] = Array.from(
      statusCounts.entries()
    ).map(([status, count]) => ({ status, count }));

    // --- Top 5 sites by savings ---
    const savingsBySite = new Map<string, number>();

    for (const r of resultsRes.data ?? []) {
      // Navigate nested join: scenarios -> analyses -> sites
      // Supabase may type nested joins as arrays; cast through unknown
      const scenarios = r.scenarios as unknown as Record<string, unknown> | null;
      const analyses = scenarios?.analyses as unknown as Record<string, unknown> | null;
      const sites = analyses?.sites as unknown as Record<string, unknown> | null;
      const siteName = (sites?.name as string) ?? null;

      if (siteName) {
        savingsBySite.set(
          siteName,
          (savingsBySite.get(siteName) ?? 0) +
            safeNumber(r.total_savings_annual)
        );
      }
    }

    const topSitesBySavings: TopSiteBySavings[] = Array.from(
      savingsBySite.entries()
    )
      .map(([name, savings]) => ({ name, savings }))
      .sort((a, b) => b.savings - a.savings)
      .slice(0, 5);

    return {
      success: true as const,
      data: { analysisPerMonth, scenariosByStatus, topSitesBySavings },
    };
  } catch {
    return {
      success: false as const,
      error: "Errore nel caricamento dei dati per i grafici",
    };
  }
}

// ---------------------------------------------------------------------------
// 3. getRecentActivity
// ---------------------------------------------------------------------------

export async function getRecentActivity(): Promise<
  | { success: true; data: ActivityItem[] }
  | { success: false; error: string }
> {
  try {
    const supabase = await createClient();

    const [analysesRes, scenariosRes] = await Promise.all([
      supabase
        .from("analyses")
        .select("id, name, created_at, sites(name)")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("scenarios")
        .select("id, name, status, updated_at, analyses(name)")
        .in("status", ["completed", "failed"])
        .order("updated_at", { ascending: false })
        .limit(5),
    ]);

    const items: ActivityItem[] = [];

    for (const a of analysesRes.data ?? []) {
      const site = a.sites as unknown as Record<string, unknown> | null;
      const siteName = (site?.name as string) ?? "Sito sconosciuto";
      items.push({
        id: a.id,
        type: "analysis_created",
        title: `Nuova analisi: ${a.name}`,
        description: `Analisi creata per il sito "${siteName}"`,
        timestamp: a.created_at,
      });
    }

    for (const s of scenariosRes.data ?? []) {
      const analysis = s.analyses as unknown as Record<string, unknown> | null;
      const analysisName = (analysis?.name as string) ?? "Analisi sconosciuta";
      const isCompleted = s.status === "completed";
      items.push({
        id: s.id,
        type: isCompleted ? "scenario_completed" : "scenario_failed",
        title: isCompleted
          ? `Scenario completato: ${s.name}`
          : `Scenario fallito: ${s.name}`,
        description: `Scenario dell'analisi "${analysisName}"`,
        timestamp: s.updated_at,
      });
    }

    // Sort all items by timestamp descending and take the latest 10
    items.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return { success: true as const, data: items.slice(0, 10) };
  } catch {
    return {
      success: false as const,
      error: "Errore nel caricamento delle attività recenti",
    };
  }
}

// ---------------------------------------------------------------------------
// 4. getSitesForMap
// ---------------------------------------------------------------------------

export async function getSitesForMap(): Promise<
  | { success: true; data: MapSite[] }
  | { success: false; error: string }
> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("sites")
      .select(
        "id, name, city, latitude, longitude, nace_code, sector, area_sqm, analyses(id)"
      );

    if (error) return { success: false as const, error: error.message };

    const sites: MapSite[] = (data ?? []).map((s) => {
      const analyses = (s.analyses ?? []) as Array<Record<string, unknown>>;
      return {
        id: s.id,
        name: s.name,
        city: s.city ?? null,
        latitude: s.latitude != null ? Number(s.latitude) : null,
        longitude: s.longitude != null ? Number(s.longitude) : null,
        nace_code: s.nace_code ?? null,
        sector: s.sector ?? null,
        area_sqm: s.area_sqm != null ? Number(s.area_sqm) : null,
        analysisCount: analyses.length,
      };
    });

    return { success: true as const, data: sites };
  } catch {
    return {
      success: false as const,
      error: "Errore nel caricamento dei siti per la mappa",
    };
  }
}

// ---------------------------------------------------------------------------
// 5. getMultiSiteData
// ---------------------------------------------------------------------------

export async function getMultiSiteData(): Promise<
  | { success: true; data: MultiSiteRow[] }
  | { success: false; error: string }
> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.from("sites").select(
      `id, name, city, nace_code,
       analyses(
         id,
         demands(annual_consumption_mwh),
         scenarios(
           id,
           scenario_results(total_capex, total_savings_annual, co2_reduction_percent)
         )
       )`
    );

    if (error) return { success: false as const, error: error.message };

    const rows: MultiSiteRow[] = (data ?? []).map((site) => {
      let totalConsumption = 0;
      let totalCapex = 0;
      let totalSavings = 0;
      let sumCo2 = 0;
      let co2Count = 0;
      let scenarioCount = 0;

      const analyses = (site.analyses ?? []) as Array<Record<string, unknown>>;

      for (const analysis of analyses) {
        // Aggregate demands
        const demands = (analysis.demands ?? []) as Array<
          Record<string, unknown>
        >;
        for (const d of demands) {
          totalConsumption += safeNumber(d.annual_consumption_mwh);
        }

        // Aggregate scenarios and their results
        const scenarios = (analysis.scenarios ?? []) as Array<
          Record<string, unknown>
        >;
        for (const scenario of scenarios) {
          scenarioCount++;

          // scenario_results is one-to-one, but Supabase returns it as array in nested select
          const results = (scenario.scenario_results ?? []) as Array<
            Record<string, unknown>
          >;
          for (const r of results) {
            totalCapex += safeNumber(r.total_capex);
            totalSavings += safeNumber(r.total_savings_annual);
            const co2 = safeNumber(r.co2_reduction_percent);
            if (co2 > 0) {
              sumCo2 += co2;
              co2Count++;
            }
          }
        }
      }

      return {
        id: site.id,
        name: site.name,
        city: site.city ?? null,
        nace_code: site.nace_code ?? null,
        totalConsumption,
        totalCapex,
        totalSavings,
        co2Reduction: co2Count > 0 ? sumCo2 / co2Count : 0,
        scenarioCount,
      };
    });

    return { success: true as const, data: rows };
  } catch {
    return {
      success: false as const,
      error: "Errore nel caricamento dei dati multi-sito",
    };
  }
}
