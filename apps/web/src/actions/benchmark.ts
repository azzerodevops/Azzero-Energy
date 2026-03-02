"use server";

import { createClient } from "@/lib/supabase/server";

// NACE sector benchmark data (average consumption MWh/employee/year)
// These are approximate Italian sector averages
const NACE_BENCHMARKS: Record<
  string,
  { label: string; avgConsumptionPerEmployee: number; avgConsumptionPerSqm: number }
> = {
  A: { label: "Agricoltura", avgConsumptionPerEmployee: 25, avgConsumptionPerSqm: 0.15 },
  B: { label: "Estrazione", avgConsumptionPerEmployee: 80, avgConsumptionPerSqm: 0.25 },
  C: { label: "Manifattura", avgConsumptionPerEmployee: 45, avgConsumptionPerSqm: 0.35 },
  D: { label: "Energia", avgConsumptionPerEmployee: 120, avgConsumptionPerSqm: 0.5 },
  E: { label: "Gestione rifiuti", avgConsumptionPerEmployee: 60, avgConsumptionPerSqm: 0.2 },
  F: { label: "Costruzioni", avgConsumptionPerEmployee: 15, avgConsumptionPerSqm: 0.1 },
  G: { label: "Commercio", avgConsumptionPerEmployee: 12, avgConsumptionPerSqm: 0.25 },
  H: { label: "Trasporti", avgConsumptionPerEmployee: 30, avgConsumptionPerSqm: 0.15 },
  I: {
    label: "Alloggio e ristorazione",
    avgConsumptionPerEmployee: 20,
    avgConsumptionPerSqm: 0.4,
  },
  J: { label: "Informatica", avgConsumptionPerEmployee: 8, avgConsumptionPerSqm: 0.2 },
  K: { label: "Finanza", avgConsumptionPerEmployee: 6, avgConsumptionPerSqm: 0.18 },
  L: { label: "Immobiliare", avgConsumptionPerEmployee: 10, avgConsumptionPerSqm: 0.22 },
};

export interface BenchmarkData {
  analysisName: string;
  siteNaceCode: string | null;
  sectorLabel: string;
  totalConsumptionMwh: number;
  employees: number | null;
  areaSqm: number | null;
  // Per employee comparison
  consumptionPerEmployee: number | null;
  sectorAvgPerEmployee: number | null;
  percentVsSectorEmployee: number | null; // positive = above average
  // Per sqm comparison
  consumptionPerSqm: number | null;
  sectorAvgPerSqm: number | null;
  percentVsSectorSqm: number | null;
}

export async function getBenchmarkData(
  analysisId: string
): Promise<{ success: true; data: BenchmarkData } | { success: false; error: string }> {
  try {
    const supabase = await createClient();

    // Fetch analysis with site info and demands
    const { data: analysis, error: analysisError } = await supabase
      .from("analyses")
      .select("name, sites(nace_code, employees, area_sqm)")
      .eq("id", analysisId)
      .single();

    if (analysisError || !analysis) {
      return { success: false, error: "Analisi non trovata" };
    }

    // Fetch demands for total consumption
    const { data: demands } = await supabase
      .from("demands")
      .select("annual_consumption_mwh")
      .eq("analysis_id", analysisId);

    const totalConsumption = (demands ?? []).reduce(
      (sum, d) => sum + Number(d.annual_consumption_mwh ?? 0),
      0
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const site = (analysis as any).sites ?? {};
    const naceCode = site.nace_code ? String(site.nace_code).charAt(0).toUpperCase() : null;
    const employees = site.employees ? Number(site.employees) : null;
    const areaSqm = site.area_sqm ? Number(site.area_sqm) : null;

    const benchmark = naceCode ? NACE_BENCHMARKS[naceCode] : null;

    // Calculate comparisons
    let consumptionPerEmployee: number | null = null;
    let percentVsSectorEmployee: number | null = null;
    let consumptionPerSqm: number | null = null;
    let percentVsSectorSqm: number | null = null;

    if (employees && employees > 0) {
      consumptionPerEmployee = totalConsumption / employees;
      if (benchmark) {
        percentVsSectorEmployee =
          ((consumptionPerEmployee - benchmark.avgConsumptionPerEmployee) /
            benchmark.avgConsumptionPerEmployee) *
          100;
      }
    }

    if (areaSqm && areaSqm > 0) {
      consumptionPerSqm = totalConsumption / areaSqm;
      if (benchmark) {
        percentVsSectorSqm =
          ((consumptionPerSqm - benchmark.avgConsumptionPerSqm) /
            benchmark.avgConsumptionPerSqm) *
          100;
      }
    }

    return {
      success: true,
      data: {
        analysisName: analysis.name ?? "",
        siteNaceCode: naceCode,
        sectorLabel: benchmark?.label ?? "Non classificato",
        totalConsumptionMwh: totalConsumption,
        employees,
        areaSqm,
        consumptionPerEmployee,
        sectorAvgPerEmployee: benchmark?.avgConsumptionPerEmployee ?? null,
        percentVsSectorEmployee,
        consumptionPerSqm,
        sectorAvgPerSqm: benchmark?.avgConsumptionPerSqm ?? null,
        percentVsSectorSqm,
      },
    };
  } catch {
    return { success: false, error: "Errore nel calcolo benchmark" };
  }
}
