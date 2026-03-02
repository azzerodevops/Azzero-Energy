"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TechConfigPanel } from "@/components/scenarios/tech-config-panel";
import { ScenarioFormDialog } from "@/components/scenarios/scenario-form-dialog";
import { SolveButton } from "@/components/scenarios/solve-button";
import { SCENARIO_STATUS_LABELS, SCENARIO_STATUS_COLORS, OBJECTIVE_LABELS } from "@azzeroco2/shared";

interface ScenarioDetailClientProps {
  scenario: {
    id: string;
    name: string;
    description: string | null;
    objective: string;
    status: string;
    error_message?: string | null;
    co2_target: string | null;
    budget_limit: string | null;
    analysis_id: string;
  };
  analysisId: string;
  technologies: {
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
  }[];
  techConfigs: {
    id: string;
    technology_id: string;
    min_capacity_kw: string | null;
    max_capacity_kw: string | null;
    force_include: boolean;
  }[];
}

export function ScenarioDetailClient({ scenario, analysisId, technologies, techConfigs }: ScenarioDetailClientProps) {
  const [editOpen, setEditOpen] = useState(false);

  const statusLabel = SCENARIO_STATUS_LABELS[scenario.status as keyof typeof SCENARIO_STATUS_LABELS] ?? scenario.status;
  const statusColor = SCENARIO_STATUS_COLORS[scenario.status as keyof typeof SCENARIO_STATUS_COLORS] ?? "";
  const objectiveLabel = OBJECTIVE_LABELS[scenario.objective as keyof typeof OBJECTIVE_LABELS] ?? scenario.objective;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/analyses/${analysisId}/scenarios`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{scenario.name}</h2>
              <Badge variant="outline" className={statusColor}>{statusLabel}</Badge>
              <Badge variant="outline">{objectiveLabel}</Badge>
            </div>
            {scenario.description && (
              <p className="text-sm text-muted-foreground mt-1">{scenario.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Modifica
          </Button>
          <SolveButton
            scenarioId={scenario.id}
            analysisId={analysisId}
            status={scenario.status}
            errorMessage={scenario.error_message}
          />
        </div>
      </div>

      {/* Error banner for failed scenarios */}
      {scenario.status === "failed" && scenario.error_message && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-start gap-3 pt-4">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">
                L&apos;ultima ottimizzazione e fallita
              </p>
              <p className="text-sm text-destructive/80 whitespace-pre-wrap">
                {scenario.error_message}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tech Config */}
      <TechConfigPanel
        scenarioId={scenario.id}
        analysisId={analysisId}
        technologies={technologies}
        techConfigs={techConfigs}
      />

      {/* Results link if completed */}
      {scenario.status === "completed" && (
        <div className="flex justify-center">
          <Button asChild>
            <Link href={`/dashboard/analyses/${analysisId}/scenarios/${scenario.id}/results`}>
              Visualizza risultati
            </Link>
          </Button>
        </div>
      )}

      <ScenarioFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        analysisId={analysisId}
        scenario={scenario}
      />
    </div>
  );
}
