"use client";

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
import { Textarea } from "@/components/ui/textarea";

interface StepGeneralProps {
  sites: { id: string; name: string; city: string | null }[];
}

export function StepGeneral({ sites }: StepGeneralProps) {
  const { step1, updateStep1 } = useWizardStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dati generali</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {/* Nome analisi */}
        <div className="space-y-2">
          <Label htmlFor="wizard-name">Nome analisi *</Label>
          <Input
            id="wizard-name"
            placeholder="Es. Audit energetico 2025"
            value={step1.name ?? ""}
            onChange={(e) => updateStep1({ name: e.target.value })}
          />
        </div>

        {/* Impianto */}
        <div className="space-y-2">
          <Label htmlFor="wizard-site">Impianto *</Label>
          {sites.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nessun impianto disponibile. Crea prima un impianto.
            </p>
          ) : (
            <Select
              value={step1.site_id ?? ""}
              onValueChange={(v) => updateStep1({ site_id: v })}
            >
              <SelectTrigger id="wizard-site">
                <SelectValue placeholder="Seleziona impianto" />
              </SelectTrigger>
              <SelectContent>
                {sites.map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.name}
                    {site.city ? ` — ${site.city}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Anno di riferimento */}
        <div className="space-y-2">
          <Label htmlFor="wizard-year">Anno di riferimento *</Label>
          <Input
            id="wizard-year"
            type="number"
            min={2020}
            max={2050}
            value={step1.year ?? new Date().getFullYear()}
            onChange={(e) =>
              updateStep1({ year: e.target.value ? Number(e.target.value) : undefined })
            }
          />
        </div>

        {/* WACC % */}
        <div className="space-y-2">
          <Label htmlFor="wizard-wacc">WACC (%)</Label>
          <Input
            id="wizard-wacc"
            type="number"
            step="0.1"
            min={0}
            max={100}
            placeholder="8"
            value={step1.wacc != null ? (step1.wacc * 100).toFixed(1) : ""}
            onChange={(e) =>
              updateStep1({
                wacc: e.target.value ? Number(e.target.value) / 100 : null,
              })
            }
          />
        </div>

        {/* Descrizione */}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="wizard-description">Descrizione</Label>
          <Textarea
            id="wizard-description"
            placeholder="Note sull'analisi..."
            value={step1.description ?? ""}
            onChange={(e) => updateStep1({ description: e.target.value || null })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
