"use client";

import { useMemo } from "react";
import { TrendingDown, CircleDollarSign, Leaf, Calculator } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TechForPreview {
  technology_id: string;
  name: string;
  category: string;
  capex_per_kw: number;
  capacity_kw: number;
  efficiency: number;
  lifetime: number;
}

interface ResourceForPreview {
  resource_type: string;
  buying_price: number;
  co2_factor: number;
}

interface ImpactPreviewProps {
  technologies: TechForPreview[];
  resources: ResourceForPreview[];
  totalDemandMwh: number;
  wacc: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ImpactPreview({
  technologies,
  resources,
  totalDemandMwh,
  wacc,
}: ImpactPreviewProps) {
  const preview = useMemo(() => {
    const avgPrice =
      resources.length > 0
        ? resources.reduce((sum, r) => sum + r.buying_price, 0) /
          resources.length
        : 100; // default EUR/MWh

    const avgCo2 =
      resources.length > 0
        ? resources.reduce((sum, r) => sum + r.co2_factor, 0) /
          resources.length
        : 0.4; // default tCO2/MWh

    let totalCapex = 0;
    let totalProduction = 0;

    for (const tech of technologies) {
      if (tech.capacity_kw <= 0) continue;
      const capex = tech.capex_per_kw * tech.capacity_kw;
      totalCapex += capex;

      // Annual production estimate (MWh)
      const productionMwh =
        (tech.capacity_kw * tech.efficiency * 8760) / 1000;
      totalProduction += productionMwh;
    }

    // Cap production at total demand
    const effectiveProduction = Math.min(totalProduction, totalDemandMwh);
    const annualSavings = effectiveProduction * avgPrice;
    const paybackYears = annualSavings > 0 ? totalCapex / annualSavings : 0;
    const co2Reduction =
      totalDemandMwh > 0
        ? (effectiveProduction / totalDemandMwh) * 100
        : 0;

    // CRF and annualized CAPEX (for future use)
    // CRF = wacc * (1+wacc)^lifetime / ((1+wacc)^lifetime - 1)
    // Using weighted average lifetime across technologies
    const _avgLifetime =
      technologies.length > 0
        ? technologies.reduce((sum, t) => sum + t.lifetime, 0) /
          technologies.length
        : 20;
    const _crf =
      wacc > 0 && _avgLifetime > 0
        ? (wacc * Math.pow(1 + wacc, _avgLifetime)) /
          (Math.pow(1 + wacc, _avgLifetime) - 1)
        : 0;
    void _crf;

    // avgCo2 used for CO2 reduction context (kept for future detailed breakdown)
    void avgCo2;

    return { totalCapex, annualSavings, paybackYears, co2Reduction };
  }, [technologies, resources, totalDemandMwh, wacc]);

  const { totalCapex, annualSavings, paybackYears, co2Reduction } = preview;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calculator className="h-4 w-4 text-muted-foreground" />
          Stima impatto (semplificata)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-4">
          {/* CAPEX totale */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CircleDollarSign className="h-3 w-3" />
              CAPEX totale
            </div>
            <p className="text-lg font-bold">{formatCurrency(totalCapex)}</p>
          </div>

          {/* Risparmio annuo stimato */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3" />
              Risparmio annuo
            </div>
            <p className="text-lg font-bold text-emerald-500">
              {formatCurrency(annualSavings)}
            </p>
          </div>

          {/* Payback */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CircleDollarSign className="h-3 w-3" />
              Payback
            </div>
            <p className="text-lg font-bold">
              {paybackYears > 0 && paybackYears < 100
                ? `${paybackYears.toFixed(1)} anni`
                : "\u2014"}
            </p>
          </div>

          {/* CO₂ reduction */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Leaf className="h-3 w-3" />
              Riduzione CO\u2082
            </div>
            <p className="text-lg font-bold text-emerald-500">
              {co2Reduction > 0 ? `${co2Reduction.toFixed(1)}%` : "\u2014"}
            </p>
          </div>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          * Stima semplificata. Il calcolo MILP completo fornir\u00e0 risultati
          pi\u00f9 precisi.
        </p>
      </CardContent>
    </Card>
  );
}
