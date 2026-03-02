import Link from "next/link";
import { MapPinOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SiteNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <MapPinOff className="h-7 w-7 text-muted-foreground" />
      </div>

      <h1 className="mt-5 text-xl font-semibold text-foreground">
        Sito non trovato
      </h1>

      <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
        Il sito richiesto non esiste o non hai i permessi per visualizzarlo.
      </p>

      <Button asChild className="mt-6">
        <Link href="/dashboard/sites">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Torna ai siti
        </Link>
      </Button>
    </div>
  );
}
