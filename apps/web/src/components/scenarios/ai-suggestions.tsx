"use client";

import { useState } from "react";
import {
  Sparkles,
  Loader2,
  Lightbulb,
  ArrowRight,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface TechSuggestion {
  technology_name: string;
  category: string;
  rationale: string;
  estimated_capacity_kw: number | null;
  estimated_savings_percent: number | null;
  priority: string;
  co2_impact: string;
}

interface SuggestionsData {
  suggestions: TechSuggestion[];
  overall_assessment: string;
  key_opportunities: string[];
}

interface AISuggestionsProps {
  analysisId: string;
  scenarioId: string;
  onApplySuggestion?: (suggestion: TechSuggestion) => void;
}

/* -------------------------------------------------------------------------- */
/*  SuggestionCard (internal)                                                 */
/* -------------------------------------------------------------------------- */

function SuggestionCard({
  suggestion,
  onApply,
}: {
  suggestion: TechSuggestion;
  onApply?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const priorityColors: Record<string, string> = {
    high: "bg-red-500/10 text-red-500 border-red-500/20",
    medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    low: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };

  const priorityLabels: Record<string, string> = {
    high: "Alta",
    medium: "Media",
    low: "Bassa",
  };

  return (
    <div className="rounded-lg border p-4 space-y-2">
      {/* Header row — click to toggle */}
      <div
        role="button"
        tabIndex={0}
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded(!expanded); } }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium">{suggestion.technology_name}</p>
          <Badge variant="outline" className="text-xs">
            {suggestion.category}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              priorityColors[suggestion.priority] ?? priorityColors.low,
            )}
          >
            {priorityLabels[suggestion.priority] ?? suggestion.priority}
          </Badge>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0" />
        )}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="space-y-2 pt-2">
          <p className="text-sm text-muted-foreground">
            {suggestion.rationale}
          </p>

          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            {suggestion.estimated_capacity_kw != null && (
              <span>Capacità: {suggestion.estimated_capacity_kw} kW</span>
            )}
            {suggestion.estimated_savings_percent != null && (
              <span>
                Risparmio: ~{suggestion.estimated_savings_percent}%
              </span>
            )}
            <span>CO{"\u2082"}: {suggestion.co2_impact}</span>
          </div>

          {onApply && (
            <Button size="sm" variant="outline" onClick={onApply}>
              <ArrowRight className="mr-2 h-3 w-3" />
              Applica
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  AISuggestions                                                              */
/* -------------------------------------------------------------------------- */

export function AISuggestions({
  analysisId,
  scenarioId,
  onApplySuggestion,
}: AISuggestionsProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SuggestionsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Keep scenarioId available for future use (e.g. scoped requests)
  void scenarioId;

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `http://localhost:8000/ai/suggestions/${analysisId}`,
        { method: "POST" },
      );
      if (!res.ok) {
        let detail = `Errore dal server (${res.status})`;
        try {
          const err = await res.json();
          if (err.detail) detail = err.detail;
        } catch {
          // Response body is not JSON — use status text
        }
        throw new Error(detail);
      }
      const result: SuggestionsData = await res.json();
      setData(result);
    } catch (e) {
      const isNetworkError =
        e instanceof TypeError && ((e as TypeError).message === "Failed to fetch" || (e as TypeError).message === "fetch failed");
      const msg = isNetworkError
        ? "Impossibile contattare il servizio AI. Verifica che il server sia avviato."
        : (e as Error).message || "Errore nella generazione dei suggerimenti.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  /* ---- Error state ---- */
  if (error && !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Suggerimenti AI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <AlertCircle className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleGenerate} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Riprova
          </Button>
        </CardContent>
      </Card>
    );
  }

  /* ---- Results state ---- */
  if (data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Suggerimenti AI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall assessment */}
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
            <p className="text-sm">{data.overall_assessment}</p>
          </div>

          {/* Key opportunities */}
          {data.key_opportunities.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Opportunità chiave:</p>
              <ul className="space-y-1">
                {data.key_opportunities.map((opp, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <Lightbulb className="h-4 w-4 mt-0.5 text-amber-500 shrink-0" />
                    {opp}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions list */}
          <div className="space-y-3">
            {data.suggestions.map((suggestion, i) => (
              <SuggestionCard
                key={i}
                suggestion={suggestion}
                onApply={
                  onApplySuggestion
                    ? () => onApplySuggestion(suggestion)
                    : undefined
                }
              />
            ))}
          </div>

          {/* Regenerate */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Rigenera suggerimenti
          </Button>
        </CardContent>
      </Card>
    );
  }

  /* ---- Initial state ---- */
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Suggerimenti AI
        </CardTitle>
        <CardDescription>
          L&apos;AI analizzerà il profilo energetico e suggerirà le tecnologie
          più adatte
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analisi in corso...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Genera suggerimenti
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
