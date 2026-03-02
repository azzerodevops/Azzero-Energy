"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LandingHeader() {
  return (
    <header className="fixed top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Image
          src="/logos/AzzeroCO2_LOGO_PAYOFF_ITA.svg"
          alt="AzzeroCO2 Energy"
          width={180}
          height={40}
          priority
        />
        <nav aria-label="Navigazione principale" className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Funzionalità
          </a>
          <a
            href="#how-it-works"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Come funziona
          </a>
          <a
            href="#contact"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Contatti
          </a>
        </nav>
        <Link href="/auth/login">
          <Button variant="default" size="sm">
            Accedi
          </Button>
        </Link>
      </div>
    </header>
  );
}
