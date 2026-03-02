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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Lightbulb, Info } from "lucide-react";
import { FIXTURE_TYPES } from "@azzeroco2/shared";

export function StepThermal() {
  const { step3, updateStep3 } = useWizardStore();

  const zones = step3.lighting_zones ?? [];

  function addZone() {
    updateStep3({
      lighting_zones: [
        ...zones,
        {
          name: "",
          area_m2: undefined,
          current_fixture: "",
          operating_hours: undefined,
          power_kw: undefined,
        },
      ],
    });
  }

  function removeZone(index: number) {
    updateStep3({
      lighting_zones: zones.filter((_, i) => i !== index),
    });
  }

  function updateZone(index: number, field: string, value: unknown) {
    const updated = [...zones];
    updated[index] = { ...updated[index], [field]: value };
    updateStep3({ lighting_zones: updated });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Lightbulb className="h-5 w-5 text-primary" />
          <CardTitle>Dettagli termici e illuminazione</CardTitle>
          {zones.length > 0 && (
            <Badge variant="secondary">{zones.length}</Badge>
          )}
        </div>
        <CardDescription>
          Opzionale &mdash; aggiungi zone illuminazione per valutare interventi
          di relamping
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info message when no zones */}
        {zones.length === 0 && (
          <div className="flex items-center gap-2 rounded-md border border-muted-foreground/20 bg-muted/50 px-4 py-3">
            <Info className="h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Se non hai zone da aggiungere, puoi procedere al passaggio
              successivo.
            </p>
          </div>
        )}

        {/* Lighting zone rows */}
        {zones.map((zone, index) => (
          <div
            key={index}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="grid grid-cols-2 gap-3 items-end sm:grid-cols-6">
              {/* Zone name */}
              <div className="space-y-2 col-span-2 sm:col-span-2">
                <Label htmlFor={`zone-name-${index}`}>Nome zona</Label>
                <Input
                  id={`zone-name-${index}`}
                  placeholder="Es. Ufficio piano 1"
                  value={zone.name ?? ""}
                  onChange={(e) => updateZone(index, "name", e.target.value)}
                />
              </div>

              {/* Area m2 */}
              <div className="space-y-2">
                <Label htmlFor={`zone-area-${index}`}>Area (m&sup2;)</Label>
                <Input
                  id={`zone-area-${index}`}
                  type="number"
                  min={0}
                  step="0.1"
                  placeholder="0"
                  value={zone.area_m2 ?? ""}
                  onChange={(e) =>
                    updateZone(
                      index,
                      "area_m2",
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                />
              </div>

              {/* Fixture type */}
              <div className="space-y-2">
                <Label htmlFor={`zone-fixture-${index}`}>Tipo lampada</Label>
                <Select
                  value={zone.current_fixture ?? ""}
                  onValueChange={(v) =>
                    updateZone(index, "current_fixture", v)
                  }
                >
                  <SelectTrigger id={`zone-fixture-${index}`}>
                    <SelectValue placeholder="Seleziona" />
                  </SelectTrigger>
                  <SelectContent>
                    {FIXTURE_TYPES.map((fixture) => (
                      <SelectItem key={fixture} value={fixture}>
                        {fixture}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Operating hours */}
              <div className="space-y-2">
                <Label htmlFor={`zone-hours-${index}`}>Ore/anno</Label>
                <Input
                  id={`zone-hours-${index}`}
                  type="number"
                  min={0}
                  max={8760}
                  step="1"
                  placeholder="0"
                  value={zone.operating_hours ?? ""}
                  onChange={(e) =>
                    updateZone(
                      index,
                      "operating_hours",
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                />
              </div>

              {/* Power kW + remove button */}
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`zone-power-${index}`}>Potenza (kW)</Label>
                  <Input
                    id={`zone-power-${index}`}
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0"
                    value={zone.power_kw ?? ""}
                    onChange={(e) =>
                      updateZone(
                        index,
                        "power_kw",
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeZone(index)}
                  aria-label={`Rimuovi zona ${zone.name || index + 1}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {/* Add zone button */}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={addZone}
        >
          <Plus className="mr-2 h-4 w-4" />
          Aggiungi zona
        </Button>
      </CardContent>
    </Card>
  );
}
