"use client";

import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BenchmarkData {
  analysisName: string;
  siteNaceCode: string | null;
  sectorLabel: string;
  totalConsumptionMwh: number;
  employees: number | null;
  areaSqm: number | null;
  consumptionPerEmployee: number | null;
  sectorAvgPerEmployee: number | null;
  percentVsSectorEmployee: number | null;
  consumptionPerSqm: number | null;
  sectorAvgPerSqm: number | null;
  percentVsSectorSqm: number | null;
}

interface BenchmarkCardProps {
  data: BenchmarkData;
}

function ComparisonRow({
  label,
  yourValue,
  avgValue,
  unit,
  percentDiff,
}: {
  label: string;
  yourValue: number;
  avgValue: number;
  unit: string;
  percentDiff: number;
}) {
  const isAbove = percentDiff > 5;
  const isBelow = percentDiff < -5;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          {isAbove && (
            <Badge
              variant="outline"
              className="text-xs bg-red-500/10 text-red-500 border-red-500/20"
            >
              <TrendingUp className="h-3 w-3 mr-1" />+
              {Math.abs(percentDiff).toFixed(0)}% sopra la media
            </Badge>
          )}
          {isBelow && (
            <Badge
              variant="outline"
              className="text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
            >
              <TrendingDown className="h-3 w-3 mr-1" />
              {Math.abs(percentDiff).toFixed(0)}% sotto la media
            </Badge>
          )}
          {!isAbove && !isBelow && (
            <Badge variant="outline" className="text-xs">
              <Minus className="h-3 w-3 mr-1" />
              Nella media
            </Badge>
          )}
        </div>
      </div>
      {/* Visual bar comparison */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs">
          <span className="w-16 text-muted-foreground">Tu:</span>
          <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full ${isAbove ? "bg-red-500" : isBelow ? "bg-emerald-500" : "bg-primary"}`}
              style={{
                width: `${Math.min((yourValue / Math.max(yourValue, avgValue)) * 100, 100)}%`,
              }}
            />
          </div>
          <span className="w-24 text-right font-medium">
            {yourValue.toLocaleString("it-IT", { maximumFractionDigits: 1 })} {unit}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-16 text-muted-foreground">Media:</span>
          <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-muted-foreground/30"
              style={{
                width: `${Math.min((avgValue / Math.max(yourValue, avgValue)) * 100, 100)}%`,
              }}
            />
          </div>
          <span className="w-24 text-right">
            {avgValue.toLocaleString("it-IT", { maximumFractionDigits: 1 })} {unit}
          </span>
        </div>
      </div>
    </div>
  );
}

export function BenchmarkCard({ data }: BenchmarkCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Benchmark settoriale
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          Settore:{" "}
          <Badge variant="outline">
            {data.siteNaceCode ?? "\u2014"} \u2014 {data.sectorLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total consumption */}
        <div className="text-center py-2">
          <p className="text-sm text-muted-foreground">Consumo totale</p>
          <p className="text-2xl font-bold">
            {data.totalConsumptionMwh.toLocaleString("it-IT", { maximumFractionDigits: 0 })} MWh
          </p>
        </div>

        {/* Comparison bars */}
        <div className="space-y-4">
          {/* Per employee comparison */}
          {data.consumptionPerEmployee != null && data.sectorAvgPerEmployee != null && (
            <ComparisonRow
              label="Per dipendente"
              yourValue={data.consumptionPerEmployee}
              avgValue={data.sectorAvgPerEmployee}
              unit="MWh/dip"
              percentDiff={data.percentVsSectorEmployee ?? 0}
            />
          )}

          {/* Per sqm comparison */}
          {data.consumptionPerSqm != null && data.sectorAvgPerSqm != null && (
            <ComparisonRow
              label="Per m\u00B2"
              yourValue={data.consumptionPerSqm}
              avgValue={data.sectorAvgPerSqm}
              unit="MWh/m\u00B2"
              percentDiff={data.percentVsSectorSqm ?? 0}
            />
          )}
        </div>

        {/* No data message */}
        {!data.employees && !data.areaSqm && (
          <p className="text-sm text-muted-foreground text-center">
            Aggiungi il numero di dipendenti o la superficie del sito per il confronto settoriale.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
