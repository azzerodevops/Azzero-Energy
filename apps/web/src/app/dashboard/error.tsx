"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sanitizeErrorMessage } from "@/lib/error-handler";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-7 w-7 text-destructive" />
      </div>

      <h1 className="mt-5 text-xl font-semibold text-foreground">
        Errore nel caricamento
      </h1>

      <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
        Si è verificato un problema durante il caricamento di questa sezione.
      </p>

      {error.message && (
        <pre className="mt-4 max-w-lg overflow-x-auto rounded-md border border-border bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
          {sanitizeErrorMessage(error.message)}
        </pre>
      )}

      {error.digest && (
        <p className="mt-2 text-xs text-muted-foreground/60">
          Codice errore: {error.digest}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <Button variant="outline" onClick={reset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Riprova
        </Button>
        <Button asChild variant="ghost">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Torna alla panoramica
          </Link>
        </Button>
      </div>
    </div>
  );
}
