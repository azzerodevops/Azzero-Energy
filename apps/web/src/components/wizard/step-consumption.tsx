"use client";

import { useWizardStore } from "@/stores/wizard-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import {
  END_USE_LABELS,
  PROFILE_TYPE_LABELS,
  DEFAULT_PROFILE_TYPE_BY_END_USE,
} from "@azzeroco2/shared";
import type { WizardDemandItem } from "@azzeroco2/shared";
import { EnergyEstimator } from "@/components/wizard/energy-estimator";
import type { WizardSite } from "@/app/dashboard/analyses/new/wizard-client";

const PROFILE_TYPE_OPTIONS = Object.entries(PROFILE_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

const endUseEntries = Object.entries(END_USE_LABELS) as [
  keyof typeof END_USE_LABELS,
  string,
][];

interface StepConsumptionProps {
  sites: WizardSite[];
}

export function StepConsumption({ sites }: StepConsumptionProps) {
  const { step2, updateStep2 } = useWizardStore();

  const demands = step2.demands ?? [];

  function addDemand() {
    const updated: WizardDemandItem[] = [
      ...demands,
      {
        end_use: "ELECTRICITY",
        annual_consumption_mwh: 0,
        profile_type: DEFAULT_PROFILE_TYPE_BY_END_USE["ELECTRICITY"] ?? "office",
      },
    ];
    updateStep2({ demands: updated });
  }

  function removeDemand(index: number) {
    const updated = demands.filter((_, i) => i !== index);
    updateStep2({ demands: updated });
  }

  function updateDemand(
    index: number,
    field: keyof WizardDemandItem,
    value: WizardDemandItem[keyof WizardDemandItem],
  ) {
    const updated = [...demands];
    updated[index] = { ...updated[index], [field]: value };

    // When end_use changes, auto-update profile_type to sensible default
    if (field === "end_use" && typeof value === "string") {
      const defaultProfile =
        DEFAULT_PROFILE_TYPE_BY_END_USE[value] ?? "office";
      updated[index] = { ...updated[index], profile_type: defaultProfile };
    }

    updateStep2({ demands: updated });
  }

  return (
    <div className="space-y-4">
      {/* AI Energy Estimator */}
      <EnergyEstimator sites={sites} />

      {/* Manual consumption entry */}
      <Card>
      <CardHeader>
        <CardTitle>Consumi energetici</CardTitle>
        <CardDescription>
          Inserisci i consumi annuali per ciascun vettore energetico
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {demands.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
            <p className="mb-4 text-sm text-muted-foreground">
              Nessuna domanda energetica inserita.
            </p>
            <Button variant="outline" onClick={addDemand}>
              <Plus className="mr-2 h-4 w-4" />
              Aggiungi domanda
            </Button>
          </div>
        ) : (
          <>
            {demands.map((demand, index) => (
              <div
                key={index}
                className="grid grid-cols-1 items-end gap-3 rounded-lg border p-4 sm:grid-cols-4"
              >
                {/* End use type */}
                <div className="space-y-2">
                  <Label htmlFor={`demand-end-use-${index}`}>
                    Tipo utilizzo
                  </Label>
                  <Select
                    value={demand.end_use}
                    onValueChange={(v) =>
                      updateDemand(
                        index,
                        "end_use",
                        v as WizardDemandItem["end_use"],
                      )
                    }
                  >
                    <SelectTrigger id={`demand-end-use-${index}`}>
                      <SelectValue placeholder="Seleziona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {endUseEntries.map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Annual consumption */}
                <div className="space-y-2">
                  <Label htmlFor={`demand-consumption-${index}`}>
                    Consumo annuo (MWh)
                  </Label>
                  <Input
                    id={`demand-consumption-${index}`}
                    type="number"
                    min={0}
                    step="0.1"
                    placeholder="0"
                    value={
                      demand.annual_consumption_mwh === 0
                        ? ""
                        : demand.annual_consumption_mwh
                    }
                    onChange={(e) =>
                      updateDemand(
                        index,
                        "annual_consumption_mwh",
                        e.target.value ? Number(e.target.value) : 0,
                      )
                    }
                  />
                </div>

                {/* Profile type */}
                <div className="space-y-2">
                  <Label htmlFor={`demand-profile-${index}`}>
                    Tipo profilo
                  </Label>
                  <Select
                    value={demand.profile_type}
                    onValueChange={(v) =>
                      updateDemand(
                        index,
                        "profile_type",
                        v as WizardDemandItem["profile_type"],
                      )
                    }
                  >
                    <SelectTrigger id={`demand-profile-${index}`}>
                      <SelectValue placeholder="Seleziona profilo" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROFILE_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Delete button */}
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => removeDemand(index)}
                    aria-label={`Rimuovi domanda ${index + 1}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <Button variant="outline" onClick={addDemand}>
              <Plus className="mr-2 h-4 w-4" />
              Aggiungi domanda
            </Button>
          </>
        )}
      </CardContent>
      </Card>
    </div>
  );
}
