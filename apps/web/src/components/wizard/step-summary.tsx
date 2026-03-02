"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWizardStore } from "@/stores/wizard-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rocket, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { END_USE_LABELS, OBJECTIVE_LABELS } from "@azzeroco2/shared";
import { completeWizard } from "@/actions/wizard";

interface StepSummaryProps {
  organizationId: string;
}

export function StepSummary({ organizationId }: StepSummaryProps) {
  const router = useRouter();
  const { step1, step2, step3, step4, step5, updateStep5, isStepValid } = useWizardStore();
  const [launching, setLaunching] = useState(false);

  // All previous steps must be valid + step 5 itself
  const canLaunch = isStepValid(1) && isStepValid(2) && isStepValid(3) && isStepValid(4) && isStepValid(5);

  // Compute total consumption
  const totalConsumption = (step2.demands ?? []).reduce(
    (sum, d) => sum + (d.annual_consumption_mwh ?? 0),
    0,
  );

  const lightingZoneCount = step3.lighting_zones?.length ?? 0;
  const techCount = step4.technologies?.length ?? 0;

  async function handleLaunch() {
    setLaunching(true);
    try {
      const store = useWizardStore.getState();
      const result = await completeWizard({
        organization_id: organizationId,
        step1: store.step1,
        step2: store.step2,
        step3: store.step3,
        step4: store.step4,
        step5: store.step5,
      });
      if (!result.success) {
        toast.error(result.error);
        setLaunching(false);
        return;
      }
      toast.success("Analisi creata con successo!");
      store.reset();
      router.push(`/dashboard/analyses/${result.data.analysisId}/scenarios`);
    } catch {
      toast.error("Errore imprevisto durante la creazione dell'analisi");
      setLaunching(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* ---- Summary: General Data ---- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riepilogo analisi</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <span className="text-muted-foreground">Nome:</span>{" "}
            <span className="font-medium">{step1.name || "—"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Anno:</span>{" "}
            <span className="font-medium">{step1.year ?? "—"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">WACC:</span>{" "}
            <span className="font-medium">
              {step1.wacc != null ? `${(step1.wacc * 100).toFixed(1)}%` : "Default"}
            </span>
          </div>
          <div className="sm:col-span-2">
            <span className="text-muted-foreground">Descrizione:</span>{" "}
            <span className="font-medium">{step1.description ?? "—"}</span>
          </div>
        </CardContent>
      </Card>

      {/* ---- Summary: Energy Demands ---- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Consumi energetici</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(step2.demands ?? []).length === 0 ? (
            <p className="text-muted-foreground">Nessun consumo configurato</p>
          ) : (
            <>
              {(step2.demands ?? []).map((d, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span>
                    {END_USE_LABELS[d.end_use as keyof typeof END_USE_LABELS] ?? d.end_use}
                  </span>
                  <Badge variant="secondary">
                    {d.annual_consumption_mwh.toLocaleString("it-IT")} MWh
                  </Badge>
                </div>
              ))}
              <div className="flex items-center justify-between border-t pt-2 font-medium">
                <span>Totale</span>
                <Badge variant="outline">
                  {totalConsumption.toLocaleString("it-IT")} MWh
                </Badge>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ---- Summary: Lighting ---- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Illuminazione</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {lightingZoneCount > 0 ? (
            <p>
              <span className="font-medium">{lightingZoneCount}</span>{" "}
              {lightingZoneCount === 1 ? "zona configurata" : "zone configurate"}
            </p>
          ) : (
            <p className="text-muted-foreground">Nessuna zona configurata</p>
          )}
        </CardContent>
      </Card>

      {/* ---- Summary: Technologies ---- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tecnologie selezionate</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {techCount > 0 ? (
            <p>
              <span className="font-medium">{techCount}</span>{" "}
              {techCount === 1 ? "tecnologia selezionata" : "tecnologie selezionate"}
            </p>
          ) : (
            <p className="text-muted-foreground">Nessuna tecnologia selezionata</p>
          )}
        </CardContent>
      </Card>

      {/* ---- Scenario Configuration ---- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configurazione primo scenario</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {/* Scenario name */}
          <div className="space-y-2">
            <Label htmlFor="wizard-scenario-name">Nome scenario</Label>
            <Input
              id="wizard-scenario-name"
              placeholder="Scenario Base"
              value={step5.scenario_name ?? "Scenario Base"}
              onChange={(e) => updateStep5({ scenario_name: e.target.value })}
            />
          </div>

          {/* Objective */}
          <div className="space-y-2">
            <Label htmlFor="wizard-objective">Obiettivo</Label>
            <Select
              value={step5.objective ?? "cost"}
              onValueChange={(v) =>
                updateStep5({
                  objective: v as "cost" | "decarbonization",
                  // Reset conditional fields when switching objective
                  ...(v === "cost" ? { co2_target: null } : { budget_limit: null }),
                })
              }
            >
              <SelectTrigger id="wizard-objective">
                <SelectValue placeholder="Seleziona obiettivo" />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(OBJECTIVE_LABELS) as [string, string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Conditional: CO2 target for decarbonization */}
          {step5.objective === "decarbonization" && (
            <div className="space-y-2">
              <Label htmlFor="wizard-co2-target">Target CO2 riduzione (%)</Label>
              <Input
                id="wizard-co2-target"
                type="number"
                min={0}
                max={100}
                step={1}
                placeholder="Es. 30"
                value={
                  step5.co2_target != null
                    ? (step5.co2_target * 100).toFixed(0)
                    : ""
                }
                onChange={(e) =>
                  updateStep5({
                    co2_target: e.target.value
                      ? Number(e.target.value) / 100
                      : null,
                  })
                }
              />
            </div>
          )}

          {/* Conditional: Budget limit for cost */}
          {step5.objective === "cost" && (
            <div className="space-y-2">
              <Label htmlFor="wizard-budget">Budget massimo (EUR)</Label>
              <Input
                id="wizard-budget"
                type="number"
                min={0}
                step={1000}
                placeholder="Opzionale"
                value={step5.budget_limit ?? ""}
                onChange={(e) =>
                  updateStep5({
                    budget_limit: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---- Launch Button ---- */}
      <Button
        className="w-full"
        size="lg"
        disabled={launching || !canLaunch}
        onClick={handleLaunch}
      >
        {launching ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creazione in corso...
          </>
        ) : (
          <>
            <Rocket className="mr-2 h-4 w-4" />
            Crea analisi e lancia calcolo
          </>
        )}
      </Button>
    </div>
  );
}
