"use client";

import { useMemo } from "react";
import {
  Zap,
  Factory,
  Snowflake,
  Battery,
  Leaf,
  Cpu,
  type LucideIcon,
} from "lucide-react";
import { useWizardStore } from "@/stores/wizard-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TechnologyCatalogItem {
  id: string;
  name: string;
  category: string;
  capex_per_kw: string | null;
  min_size_kw: string | null;
  max_size_kw: string | null;
}

interface StepTechnologiesProps {
  technologies: TechnologyCatalogItem[];
}

// ---------------------------------------------------------------------------
// Category helpers
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<string, string> = {
  generation: "Generazione",
  heating: "Riscaldamento",
  cooling: "Raffreddamento",
  storage: "Accumulo",
  efficiency: "Efficienza energetica",
};

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  generation: Zap,
  heating: Factory,
  cooling: Snowflake,
  storage: Battery,
  efficiency: Leaf,
};

const CATEGORY_ORDER = [
  "generation",
  "heating",
  "cooling",
  "storage",
  "efficiency",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StepTechnologies({ technologies }: StepTechnologiesProps) {
  const { step4, updateStep4 } = useWizardStore();
  const selected = step4.technologies ?? [];

  // Group technologies by category, respecting the defined order
  const grouped = useMemo(() => {
    const map = new Map<string, TechnologyCatalogItem[]>();

    for (const tech of technologies) {
      const cat = tech.category;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(tech);
    }

    // Sort by the predefined order; unknown categories go at the end
    const sorted = [...map.entries()].sort(([a], [b]) => {
      const ia = CATEGORY_ORDER.indexOf(a);
      const ib = CATEGORY_ORDER.indexOf(b);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });

    return sorted;
  }, [technologies]);

  // Selection helpers
  function isSelected(techId: string) {
    return selected.some((t) => t.technology_id === techId);
  }

  function getSelectedTech(techId: string) {
    return selected.find((t) => t.technology_id === techId);
  }

  function toggleTech(techId: string) {
    if (isSelected(techId)) {
      updateStep4({
        technologies: selected.filter((t) => t.technology_id !== techId),
      });
    } else {
      updateStep4({
        technologies: [
          ...selected,
          { technology_id: techId, installed_capacity_kw: 0, is_existing: false },
        ],
      });
    }
  }

  function updateTech(techId: string, field: string, value: unknown) {
    updateStep4({
      technologies: selected.map((t) =>
        t.technology_id === techId ? { ...t, [field]: value } : t,
      ),
    });
  }

  // Empty catalog
  if (technologies.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Selezione tecnologie</CardTitle>
          <CardDescription>
            Seleziona le tecnologie da valutare nell&apos;ottimizzazione
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Cpu}
            title="Catalogo vuoto"
            description="Non sono presenti tecnologie nel catalogo. Contatta l'amministratore per configurare il catalogo."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Selezione tecnologie</CardTitle>
        <CardDescription>
          Seleziona le tecnologie da valutare nell&apos;ottimizzazione
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Selection count */}
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {selected.length}
          </span>{" "}
          {selected.length === 1
            ? "tecnologia selezionata"
            : "tecnologie selezionate"}
        </p>

        {/* Category groups */}
        {grouped.map(([category, techs]) => {
          const CategoryIcon = CATEGORY_ICONS[category] ?? Cpu;
          const categoryLabel = CATEGORY_LABELS[category] ?? category;

          return (
            <div key={category} className="space-y-3">
              {/* Category header */}
              <div className="flex items-center gap-2 border-b pb-2">
                <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {categoryLabel}
                </h3>
              </div>

              {/* Technology cards */}
              <div className="grid gap-3 sm:grid-cols-2">
                {techs.map((tech) => {
                  const checked = isSelected(tech.id);
                  const selectedData = getSelectedTech(tech.id);

                  return (
                    <div
                      key={tech.id}
                      className={cn(
                        "rounded-lg border p-4 transition-colors",
                        checked
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/50",
                      )}
                    >
                      {/* Top row: checkbox + name + badge + capex */}
                      <div
                        role="button"
                        tabIndex={0}
                        className="flex w-full cursor-pointer items-start gap-3 text-left"
                        onClick={() => toggleTech(tech.id)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleTech(tech.id); } }}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleTech(tech.id)}
                          className="mt-0.5"
                          aria-label={`Seleziona ${tech.name}`}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium leading-tight">
                              {tech.name}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {categoryLabel}
                            </Badge>
                          </div>
                          {tech.capex_per_kw && (
                            <p className="text-xs text-muted-foreground">
                              CAPEX: &euro; {Number(tech.capex_per_kw).toLocaleString("it-IT")}/kW
                            </p>
                          )}
                          {(tech.min_size_kw || tech.max_size_kw) && (
                            <p className="text-xs text-muted-foreground">
                              Taglia:{" "}
                              {tech.min_size_kw
                                ? `${Number(tech.min_size_kw).toLocaleString("it-IT")} kW`
                                : "—"}{" "}
                              &ndash;{" "}
                              {tech.max_size_kw
                                ? `${Number(tech.max_size_kw).toLocaleString("it-IT")} kW`
                                : "—"}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Expanded details when selected */}
                      {checked && selectedData && (
                        <div className="mt-4 space-y-3 border-t pt-3">
                          {/* Installed capacity */}
                          <div className="space-y-1.5">
                            <Label
                              htmlFor={`capacity-${tech.id}`}
                              className="text-xs"
                            >
                              Capacit&agrave; installata (kW)
                            </Label>
                            <Input
                              id={`capacity-${tech.id}`}
                              type="number"
                              min={0}
                              step="0.1"
                              placeholder="0"
                              value={
                                selectedData.installed_capacity_kw === 0
                                  ? ""
                                  : selectedData.installed_capacity_kw
                              }
                              onChange={(e) =>
                                updateTech(
                                  tech.id,
                                  "installed_capacity_kw",
                                  e.target.value ? Number(e.target.value) : 0,
                                )
                              }
                              onClick={(e) => e.stopPropagation()}
                              className="h-8"
                            />
                          </div>

                          {/* Is existing toggle */}
                          <div className="flex items-center justify-between">
                            <Label
                              htmlFor={`existing-${tech.id}`}
                              className="text-xs"
                            >
                              Impianto esistente
                            </Label>
                            <Switch
                              id={`existing-${tech.id}`}
                              checked={selectedData.is_existing}
                              onCheckedChange={(val) =>
                                updateTech(tech.id, "is_existing", val)
                              }
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
