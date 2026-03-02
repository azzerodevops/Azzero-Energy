import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <p className="text-8xl font-extrabold tracking-tighter text-primary">
        404
      </p>

      <h1 className="mt-4 text-2xl font-semibold text-foreground">
        Pagina non trovata
      </h1>

      <p className="mt-2 max-w-md text-center text-muted-foreground">
        La pagina che stai cercando non esiste o è stata spostata.
      </p>

      <Button asChild className="mt-8" size="lg">
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Torna alla dashboard
        </Link>
      </Button>
    </div>
  );
}
