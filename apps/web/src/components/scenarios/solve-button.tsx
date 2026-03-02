"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Play,
  Loader2,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Wrench,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  launchOptimization,
  getScenarioStatus,
  validateScenario,
  type ValidationResult,
} from "@/actions/scenarios";

interface SolveButtonProps {
  scenarioId: string;
  analysisId: string;
  status: string;
  errorMessage?: string | null;
}

export function SolveButton({
  scenarioId,
  analysisId,
  status: initialStatus,
  errorMessage: initialErrorMessage,
}: SolveButtonProps) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  const [launching, setLaunching] = useState(false);
  const [validating, setValidating] = useState(false);
  const [polling, setPolling] = useState(
    initialStatus === "queued" || initialStatus === "running"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(
    initialErrorMessage ?? null
  );

  // Validation dialog state
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);

  // Error detail dialog state
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  // Poll for status changes
  useEffect(() => {
    if (!polling) return;

    const interval = setInterval(async () => {
      const result = await getScenarioStatus(scenarioId);
      if (!result.success) return;

      const newStatus = result.data.status as string;
      setCurrentStatus(newStatus);

      if (newStatus === "completed") {
        setPolling(false);
        setErrorMessage(null);
        toast.success("Ottimizzazione completata!");
        router.refresh();
      } else if (newStatus === "failed") {
        setPolling(false);
        const errMsg =
          (result.data as { error_message?: string | null }).error_message ??
          null;
        setErrorMessage(errMsg);
        toast.error("Ottimizzazione fallita", {
          description: errMsg
            ? errMsg.substring(0, 120) + (errMsg.length > 120 ? "..." : "")
            : undefined,
          action: errMsg
            ? {
                label: "Dettagli",
                onClick: () => setShowErrorDialog(true),
              }
            : undefined,
        });
        router.refresh();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [polling, scenarioId, router]);

  async function handleLaunch() {
    // Step 1: Validate before launching
    setValidating(true);
    try {
      const valResult = await validateScenario(scenarioId);
      if (!valResult.success) {
        toast.error(valResult.error);
        return;
      }

      const validation = valResult.data;

      // If there are errors or warnings, show the dialog
      if (
        !validation.valid ||
        validation.warnings.length > 0 ||
        validation.auto_fixes_applied.length > 0
      ) {
        setValidationResult(validation);
        setShowValidationDialog(true);
        return;
      }

      // All clear — launch directly
      await doLaunch();
    } finally {
      setValidating(false);
    }
  }

  async function doLaunch() {
    setLaunching(true);
    setShowValidationDialog(false);
    try {
      const result = await launchOptimization(scenarioId, analysisId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Calcolo avviato");
      setCurrentStatus("queued");
      setErrorMessage(null);
      setPolling(true);
    } finally {
      setLaunching(false);
    }
  }

  const isRunning = currentStatus === "queued" || currentStatus === "running";
  const isCompleted = currentStatus === "completed";
  const isFailed = currentStatus === "failed";

  return (
    <>
      {/* Main button */}
      {isRunning ? (
        <Button size="sm" disabled>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {currentStatus === "queued" ? "In coda..." : "Calcolo in corso..."}
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleLaunch}
            disabled={launching || validating}
            variant={isCompleted ? "outline" : "default"}
          >
            {launching || validating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            {validating
              ? "Validazione..."
              : isCompleted
                ? "Ricalcola"
                : isFailed
                  ? "Riprova"
                  : "Lancia calcolo"}
          </Button>

          {/* Show error details button for failed scenarios */}
          {isFailed && errorMessage && (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={() => setShowErrorDialog(true)}
            >
              <Info className="mr-1 h-4 w-4" />
              Dettagli errore
            </Button>
          )}
        </div>
      )}

      {/* Validation results dialog */}
      <Dialog
        open={showValidationDialog}
        onOpenChange={setShowValidationDialog}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {validationResult?.valid ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Avvisi prima del calcolo
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  Errori di validazione
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {validationResult?.valid
                ? "Sono stati rilevati degli avvisi. Puoi comunque procedere con il calcolo."
                : "Correggi i seguenti errori prima di lanciare l'ottimizzazione."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Errors */}
            {validationResult?.errors && validationResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-destructive flex items-center gap-1.5">
                  <XCircle className="h-4 w-4" />
                  Errori ({validationResult.errors.length})
                </h4>
                <ul className="space-y-1.5">
                  {validationResult.errors.map((err, i) => (
                    <li
                      key={i}
                      className="text-sm text-destructive/90 bg-destructive/10 rounded-md px-3 py-2"
                    >
                      {err}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings */}
            {validationResult?.warnings &&
              validationResult.warnings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-amber-500 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" />
                    Avvisi ({validationResult.warnings.length})
                  </h4>
                  <ul className="space-y-1.5">
                    {validationResult.warnings.map((warn, i) => (
                      <li
                        key={i}
                        className="text-sm text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-md px-3 py-2"
                      >
                        {warn}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {/* Auto-fixes */}
            {validationResult?.auto_fixes_applied &&
              validationResult.auto_fixes_applied.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-blue-500 flex items-center gap-1.5">
                    <Wrench className="h-4 w-4" />
                    Correzioni automatiche applicate (
                    {validationResult.auto_fixes_applied.length})
                  </h4>
                  <ul className="space-y-1.5">
                    {validationResult.auto_fixes_applied.map((fix, i) => (
                      <li
                        key={i}
                        className="text-sm text-blue-600 dark:text-blue-400 bg-blue-500/10 rounded-md px-3 py-2"
                      >
                        <CheckCircle2 className="inline h-3.5 w-3.5 mr-1.5" />
                        {fix}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowValidationDialog(false)}
            >
              Annulla
            </Button>
            {validationResult?.valid && (
              <Button
                onClick={doLaunch}
                disabled={launching}
              >
                {launching ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Procedi con il calcolo
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error details dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Ottimizzazione fallita
            </DialogTitle>
            <DialogDescription>
              Dettagli sull&apos;errore dell&apos;ultima esecuzione.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-sm text-destructive/90 bg-destructive/10 rounded-md px-4 py-3 whitespace-pre-wrap">
              {errorMessage}
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium">Suggerimenti:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Verifica che i consumi energetici siano configurati correttamente</li>
                <li>Controlla che le tecnologie abbiano dati di conversione (input/output)</li>
                <li>Prova a rilassare i vincoli di budget o capacità</li>
                <li>Aggiungi più tecnologie per dare più flessibilità al solver</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowErrorDialog(false)}
            >
              Chiudi
            </Button>
            <Button onClick={handleLaunch} disabled={launching || validating}>
              {validating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Riprova
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
