import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KPISummary } from "@/components/dashboard/kpi-summary";

const sampleKPIs = {
  totalSites: 12,
  totalAnalyses: 45,
  totalScenarios: 20,
  completedScenarios: 15,
  totalCapex: 250000,
  totalSavingsAnnual: 87500,
  avgCo2Reduction: 32.5,
};

describe("KPISummary", () => {
  it("renders all 6 KPI cards with correct titles", () => {
    render(<KPISummary kpis={sampleKPIs} />);

    expect(screen.getByText("Siti totali")).toBeInTheDocument();
    expect(screen.getByText("Analisi")).toBeInTheDocument();
    expect(screen.getByText("Scenari completati")).toBeInTheDocument();
    expect(screen.getByText("CAPEX totale")).toBeInTheDocument();
    expect(screen.getByText("Risparmio annuo")).toBeInTheDocument();
    expect(screen.getByText("Riduzione CO\u2082")).toBeInTheDocument();
  });

  it("renders plain numeric values correctly", () => {
    render(<KPISummary kpis={sampleKPIs} />);

    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("45")).toBeInTheDocument();
    expect(screen.getByText("15 / 20")).toBeInTheDocument();
  });

  it("formats currency values with EUR symbol", () => {
    render(<KPISummary kpis={sampleKPIs} />);

    // Intl.NumberFormat with it-IT locale and EUR currency
    // 250000 => "250.000 €" (or similar locale variant)
    const capexEl = screen.getByText((content) =>
      content.includes("250.000") && content.includes("€"),
    );
    expect(capexEl).toBeInTheDocument();

    const savingsEl = screen.getByText((content) =>
      content.includes("87.500") && content.includes("€"),
    );
    expect(savingsEl).toBeInTheDocument();
  });

  it("formats percentage values correctly", () => {
    render(<KPISummary kpis={sampleKPIs} />);

    // 32.5 / 100 = 0.325 => "32,5%" in it-IT locale
    const percentEl = screen.getByText((content) =>
      content.includes("32,5") && content.includes("%"),
    );
    expect(percentEl).toBeInTheDocument();
  });

  it("renders subtitles for savings and CO2 cards", () => {
    render(<KPISummary kpis={sampleKPIs} />);

    expect(screen.getByText("EUR/anno")).toBeInTheDocument();
    expect(screen.getByText("media scenari")).toBeInTheDocument();
  });

  it("renders correctly with zero/default values", () => {
    const zeroKPIs = {
      totalSites: 0,
      totalAnalyses: 0,
      totalScenarios: 0,
      completedScenarios: 0,
      totalCapex: 0,
      totalSavingsAnnual: 0,
      avgCo2Reduction: 0,
    };

    render(<KPISummary kpis={zeroKPIs} />);

    // "0" appears for totalSites and totalAnalyses
    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBeGreaterThanOrEqual(2);

    // "0 / 0" for scenarios
    expect(screen.getByText("0 / 0")).toBeInTheDocument();

    // Currency zero: "0 €" (it-IT)
    const zeroCurrencies = screen.getAllByText((content) =>
      content.includes("0") && content.includes("€"),
    );
    expect(zeroCurrencies.length).toBe(2);

    // Percentage zero: "0%" (it-IT)
    const zeroPercent = screen.getByText((content) =>
      content.includes("0") && content.includes("%"),
    );
    expect(zeroPercent).toBeInTheDocument();
  });
});
