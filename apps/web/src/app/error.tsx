"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sanitizeErrorMessage } from "@/lib/error-handler";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>

      <h1 className="mt-6 text-2xl font-semibold text-foreground">
        Si è verificato un errore
      </h1>

      <p className="mt-2 max-w-md text-center text-muted-foreground">
        Qualcosa è andato storto. Riprova o torna alla dashboard.
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

      <div className="mt-8 flex gap-3">
        <Button variant="outline" onClick={reset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Riprova
        </Button>
        <Button asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Torna alla dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
