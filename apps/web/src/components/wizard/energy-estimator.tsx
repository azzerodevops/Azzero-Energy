"use client";

import { useCallback, useRef, useState } from "react";
import {
  Sparkles,
  Loader2,
  Send,
  Bot,
  User,
  ChevronDown,
  ChevronRight,
  Check,
  AlertCircle,
  MessageSquare,
  Zap,
  Flame,
  Thermometer,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useWizardStore } from "@/stores/wizard-store";
import type { WizardDemandItem } from "@azzeroco2/shared";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface EnergyEstimate {
  electricity_mwh: number;
  gas_mwh: number;
  heat_mwh: number;
  profile_suggestion: string;
  confidence: string;
}

interface EstimateResponse {
  estimates: EnergyEstimate;
  recommendations: string[];
  reasoning: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  estimateData?: EstimateResponse;
}

/* -------------------------------------------------------------------------- */
/*  Pre-built questions                                                       */
/* -------------------------------------------------------------------------- */

const PRESET_QUESTIONS = [
  {
    label: "Stima i consumi elettrici per il mio tipo di attivita",
    icon: Zap,
    questions: ["Stima i consumi elettrici annuali per il mio tipo di attivita e settore"],
  },
  {
    label: "Quale profilo di carico e tipico per il mio settore?",
    icon: Flame,
    questions: ["Quale profilo di carico orario e tipico per il mio settore? Descrivi il pattern giornaliero e stagionale"],
  },
  {
    label: "Stima completa di tutti i consumi energetici",
    icon: Thermometer,
    questions: [
      "Stima i consumi elettrici, di gas naturale e termici annuali",
      "Suggerisci il profilo di carico piu adatto",
      "Quali tecnologie sono consigliate per il mio caso?",
    ],
  },
] as const;

/* -------------------------------------------------------------------------- */
/*  Confidence badge                                                          */
/* -------------------------------------------------------------------------- */

function ConfidenceBadge({ level }: { level: string }) {
  const config: Record<string, { label: string; className: string }> = {
    alta: {
      label: "Confidenza alta",
      className: "bg-green-500/10 text-green-500 border-green-500/20",
    },
    media: {
      label: "Confidenza media",
      className: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    },
    bassa: {
      label: "Confidenza bassa",
      className: "bg-red-500/10 text-red-500 border-red-500/20",
    },
  };

  const c = config[level] ?? config.bassa;

  return (
    <Badge variant="outline" className={cn("text-xs", c.className)}>
      {c.label}
    </Badge>
  );
}

/* -------------------------------------------------------------------------- */
/*  Estimate result card (shown inside a chat message)                        */
/* -------------------------------------------------------------------------- */

function EstimateResultCard({
  data,
  onApply,
  applied,
}: {
  data: EstimateResponse;
  onApply: () => void;
  applied: boolean;
}) {
  const { estimates, recommendations, reasoning } = data;

  return (
    <div className="space-y-4 mt-3">
      {/* Estimates grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-3 space-y-1">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="text-xs text-muted-foreground">Elettricita</span>
          </div>
          <p className="text-lg font-semibold">
            {estimates.electricity_mwh.toLocaleString("it-IT", {
              maximumFractionDigits: 1,
            })}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              MWh/anno
            </span>
          </p>
        </div>

        <div className="rounded-lg border bg-card p-3 space-y-1">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-xs text-muted-foreground">Gas naturale</span>
          </div>
          <p className="text-lg font-semibold">
            {estimates.gas_mwh.toLocaleString("it-IT", {
              maximumFractionDigits: 1,
            })}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              MWh/anno
            </span>
          </p>
        </div>

        <div className="rounded-lg border bg-card p-3 space-y-1">
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-red-500" />
            <span className="text-xs text-muted-foreground">
              Calore processo
            </span>
          </div>
          <p className="text-lg font-semibold">
            {estimates.heat_mwh.toLocaleString("it-IT", {
              maximumFractionDigits: 1,
            })}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              MWh/anno
            </span>
          </p>
        </div>
      </div>

      {/* Confidence + Profile */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ConfidenceBadge level={estimates.confidence} />
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Profilo di carico suggerito
          </p>
          <p className="text-sm">{estimates.profile_suggestion}</p>
        </div>
      </div>

      {/* Reasoning */}
      <div className="rounded-lg bg-muted/50 p-3">
        <p className="text-xs font-medium text-muted-foreground mb-1">
          Metodologia di stima
        </p>
        <p className="text-sm text-muted-foreground">{reasoning}</p>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Raccomandazioni
          </p>
          <ul className="space-y-1">
            {recommendations.map((rec, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <Sparkles className="h-3 w-3 mt-1 text-primary shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Apply button */}
      <Button
        size="sm"
        onClick={onApply}
        disabled={applied}
        className="w-full"
      >
        {applied ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            Stime applicate al wizard
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Applica stima ai consumi
          </>
        )}
      </Button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  EnergyEstimator                                                           */
/* -------------------------------------------------------------------------- */

interface EnergyEstimatorProps {
  sites: { id: string; name: string; nace_code?: string | null; sector?: string | null; area_sqm?: string | null; employees?: number | null; operating_hours?: number | null }[];
}

export function EnergyEstimator({ sites }: EnergyEstimatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [appliedMessageId, setAppliedMessageId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { step1, step2, updateStep2 } = useWizardStore();

  // Get the selected site details
  const selectedSite = sites.find((s) => s.id === step1.site_id);

  const scrollToBottom = useCallback(() => {
    // Small delay so DOM has time to update
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 50);
  }, []);

  // Build the site info object for the API
  function buildSiteInfo() {
    return {
      nace_code: selectedSite?.nace_code ?? null,
      sector: selectedSite?.sector ?? null,
      area_sqm: selectedSite?.area_sqm ? parseFloat(selectedSite.area_sqm) : null,
      employees: selectedSite?.employees ?? null,
      operating_hours: selectedSite?.operating_hours ?? null,
    };
  }

  async function sendQuestions(questions: string[], displayText: string) {
    if (loading) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: displayText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    scrollToBottom();

    try {
      const res = await fetch("http://localhost:8000/ai/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_info: buildSiteInfo(),
          questions,
        }),
      });

      if (!res.ok) {
        let detail = `Errore dal server (${res.status})`;
        try {
          const err = await res.json();
          if (err.detail) detail = err.detail;
        } catch {
          // Response body is not JSON
        }
        throw new Error(detail);
      }

      const result: EstimateResponse = await res.json();

      // Build assistant text from the response
      let assistantText = "";
      if (result.estimates.electricity_mwh > 0 || result.estimates.gas_mwh > 0 || result.estimates.heat_mwh > 0) {
        assistantText = "Ho analizzato le informazioni del sito e generato una stima dei consumi energetici. Ecco i risultati:";
      } else {
        assistantText = "Non ho abbastanza informazioni per una stima affidabile. Ti consiglio di inserire i dati manualmente.";
      }

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: assistantText,
        timestamp: new Date(),
        estimateData: result,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      scrollToBottom();
    } catch (e) {
      const isNetworkError =
        e instanceof TypeError &&
        ((e as TypeError).message === "Failed to fetch" ||
          (e as TypeError).message === "fetch failed");
      const msg = isNetworkError
        ? "Impossibile contattare il servizio AI. Verifica che il server sia avviato."
        : (e as Error).message || "Errore nella generazione della stima.";

      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: msg,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      toast.error(msg);
      scrollToBottom();
    } finally {
      setLoading(false);
    }
  }

  function handlePresetClick(preset: (typeof PRESET_QUESTIONS)[number]) {
    sendQuestions([...preset.questions], preset.label);
  }

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = inputValue.trim();
    if (!q) return;
    setInputValue("");
    sendQuestions([q], q);
  }

  function handleApplyEstimate(msg: ChatMessage) {
    if (!msg.estimateData) return;
    const { estimates } = msg.estimateData;

    // Build demand items from the estimates
    const newDemands: WizardDemandItem[] = [];

    if (estimates.electricity_mwh > 0) {
      newDemands.push({
        end_use: "ELECTRICITY",
        annual_consumption_mwh: Math.round(estimates.electricity_mwh * 10) / 10,
        profile_type: "nace_default",
      });
    }

    if (estimates.gas_mwh > 0) {
      newDemands.push({
        end_use: "HEAT_LOW_T",
        annual_consumption_mwh: Math.round(estimates.gas_mwh * 10) / 10,
        profile_type: "nace_default",
      });
    }

    if (estimates.heat_mwh > 0) {
      newDemands.push({
        end_use: "HEAT_HIGH_T",
        annual_consumption_mwh: Math.round(estimates.heat_mwh * 10) / 10,
        profile_type: "nace_default",
      });
    }

    // Fallback: if no estimates are nonzero, keep current demands
    if (newDemands.length === 0) {
      toast.error("Nessun consumo stimato da applicare.");
      return;
    }

    // Merge with existing demands that are NOT being overridden
    const existingDemands = step2.demands ?? [];
    const overriddenEndUses = new Set(newDemands.map((d) => d.end_use));
    const keptDemands = existingDemands.filter(
      (d) => !overriddenEndUses.has(d.end_use),
    );

    updateStep2({ demands: [...keptDemands, ...newDemands] });
    setAppliedMessageId(msg.id);
    toast.success("Stime applicate ai consumi del wizard!");
  }

  // Show a notice if no site is selected in step 1
  const hasSiteContext = !!selectedSite;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-primary/20">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer select-none hover:bg-muted/50 transition-colors rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-base">
                    Non conosci i tuoi consumi? Chiedi all&apos;assistente AI
                  </CardTitle>
                  <CardDescription className="mt-1">
                    L&apos;AI stimera i consumi energetici in base al tipo di
                    attivita e alle caratteristiche del sito
                  </CardDescription>
                </div>
              </div>
              {isOpen ? (
                <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            {/* Site context warning */}
            {!hasSiteContext && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <AlertCircle className="h-4 w-4 mt-0.5 text-amber-500 shrink-0" />
                <p className="text-sm text-amber-500">
                  Seleziona un impianto nello Step 1 per ottenere stime piu
                  accurate. L&apos;AI utilizzera le informazioni del sito
                  (codice NACE, superficie, dipendenti) come contesto.
                </p>
              </div>
            )}

            {/* Site context summary */}
            {hasSiteContext && (
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Contesto del sito selezionato
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedSite.nace_code && (
                    <Badge variant="outline" className="text-xs">
                      NACE: {selectedSite.nace_code}
                    </Badge>
                  )}
                  {selectedSite.sector && (
                    <Badge variant="outline" className="text-xs">
                      {selectedSite.sector}
                    </Badge>
                  )}
                  {selectedSite.area_sqm && (
                    <Badge variant="outline" className="text-xs">
                      {parseFloat(selectedSite.area_sqm).toLocaleString("it-IT")}{" "}
                      m{"\u00b2"}
                    </Badge>
                  )}
                  {selectedSite.employees != null && (
                    <Badge variant="outline" className="text-xs">
                      {selectedSite.employees} dipendenti
                    </Badge>
                  )}
                  {selectedSite.operating_hours != null && (
                    <Badge variant="outline" className="text-xs">
                      {selectedSite.operating_hours} ore/anno
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Preset questions */}
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Scegli una domanda per iniziare:
                </p>
                <div className="grid gap-2">
                  {PRESET_QUESTIONS.map((preset, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      className="justify-start h-auto py-3 px-4 text-left"
                      onClick={() => handlePresetClick(preset)}
                      disabled={loading}
                    >
                      <preset.icon className="mr-3 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-sm">{preset.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat messages */}
            {messages.length > 0 && (
              <ScrollArea className="h-[400px]">
                <div ref={scrollRef} className="space-y-4 pr-4 h-[400px] overflow-y-auto">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex gap-3",
                        msg.role === "user" ? "justify-end" : "justify-start",
                      )}
                    >
                      {msg.role === "assistant" && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}

                      <div
                        className={cn(
                          "max-w-[85%] rounded-lg px-4 py-3",
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted",
                        )}
                      >
                        <p className="text-sm">{msg.content}</p>

                        {/* Estimate data card */}
                        {msg.role === "assistant" && msg.estimateData && (
                          <EstimateResultCard
                            data={msg.estimateData}
                            onApply={() => handleApplyEstimate(msg)}
                            applied={appliedMessageId === msg.id}
                          />
                        )}

                        <p
                          className={cn(
                            "text-xs mt-2",
                            msg.role === "user"
                              ? "text-primary-foreground/60"
                              : "text-muted-foreground",
                          )}
                        >
                          {msg.timestamp.toLocaleTimeString("it-IT", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      {msg.role === "user" && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Loading indicator */}
                  {loading && (
                    <div className="flex gap-3 justify-start">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="rounded-lg bg-muted px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground">
                            Analisi in corso...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}

            {/* Free-text input */}
            <form
              onSubmit={handleCustomSubmit}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Scrivi una domanda sui tuoi consumi energetici..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={loading}
                  className="pl-10"
                />
              </div>
              <Button
                type="submit"
                size="icon"
                disabled={loading || !inputValue.trim()}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>

            {/* Preset buttons visible after conversation started */}
            {messages.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {PRESET_QUESTIONS.map((preset, i) => (
                  <Button
                    key={i}
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => handlePresetClick(preset)}
                    disabled={loading}
                  >
                    <preset.icon className="mr-1.5 h-3 w-3" />
                    {preset.label}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
