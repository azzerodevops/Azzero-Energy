"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Settings2, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { upsertTechConfig } from "@/actions/scenarios";

interface TechInAnalysis {
  id: string;
  technology_id: string;
  installed_capacity_kw: number | null;
  is_existing: boolean | null;
  technology_catalog: {
    name: string;
    category: string;
    min_size_kw: string | null;
    max_size_kw: string | null;
  } | null;
}

interface TechConfig {
  id: string;
  technology_id: string;
  min_capacity_kw: string | null;
  max_capacity_kw: string | null;
  force_include: boolean;
}

interface TechConfigPanelProps {
  scenarioId: string;
  analysisId?: string;
  technologies: TechInAnalysis[];
  techConfigs: TechConfig[];
}

export function TechConfigPanel({ scenarioId, technologies, techConfigs }: TechConfigPanelProps) {
  const configMap = new Map(techConfigs.map(tc => [tc.technology_id, tc]));

  if (technologies.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Settings2 className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p>Nessuna tecnologia nell&apos;analisi. Aggiungi tecnologie prima di configurare lo scenario.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Settings2 className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Configurazione tecnologie</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Imposta i vincoli di capacità per ogni tecnologia in questo scenario.
      </p>
      <div className="grid gap-4">
        {technologies.map((tech) => (
          <TechConfigRow
            key={tech.technology_id}
            tech={tech}
            config={configMap.get(tech.technology_id) ?? null}
            scenarioId={scenarioId}
          />
        ))}
      </div>
    </div>
  );
}

function TechConfigRow({
  tech,
  config,
  scenarioId,
}: {
  tech: TechInAnalysis;
  config: TechConfig | null;
  scenarioId: string;
}) {
  const catalog = tech.technology_catalog;
  const defaultMin = parseFloat(catalog?.min_size_kw ?? "0");
  const defaultMax = parseFloat(catalog?.max_size_kw ?? "100000");

  const [minCap, setMinCap] = useState(config?.min_capacity_kw ?? "");
  const [maxCap, setMaxCap] = useState(config?.max_capacity_kw ?? "");
  const [forceInclude, setForceInclude] = useState(config?.force_include ?? false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await upsertTechConfig({
        scenario_id: scenarioId,
        technology_id: tech.technology_id,
        min_capacity_kw: minCap ? parseFloat(minCap as string) : null,
        max_capacity_kw: maxCap ? parseFloat(maxCap as string) : null,
        force_include: forceInclude,
      });
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success(`Configurazione ${catalog?.name ?? "tecnologia"} salvata`);
      }
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            {catalog?.name ?? "Tecnologia"}
            <Badge variant="outline" className="text-xs font-normal">
              {catalog?.category ?? ""}
            </Badge>
            {tech.is_existing && (
              <Badge variant="secondary" className="text-xs">Esistente</Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Capacità min (kW)</Label>
            <Input
              type="number"
              min={0}
              step="0.1"
              placeholder={`Default: ${defaultMin}`}
              value={minCap}
              onChange={(e) => setMinCap(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Capacità max (kW)</Label>
            <Input
              type="number"
              min={0}
              step="0.1"
              placeholder={`Default: ${defaultMax}`}
              value={maxCap}
              onChange={(e) => setMaxCap(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex items-end gap-3 pb-0.5">
            <div className="flex items-center gap-2">
              <Switch
                checked={forceInclude}
                onCheckedChange={setForceInclude}
                id={`force-${tech.technology_id}`}
              />
              <Label htmlFor={`force-${tech.technology_id}`} className="text-xs">
                Forza inclusione
              </Label>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={handleSave} disabled={isPending}>
            {isPending ? "Salvataggio..." : "Salva"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
