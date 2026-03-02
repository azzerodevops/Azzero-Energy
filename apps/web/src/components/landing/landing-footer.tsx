import Image from "next/image";

export function LandingFooter() {
  return (
    <footer
      id="contact"
      className="border-t border-border bg-[#121827] py-12 text-white"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          {/* Logo */}
          <Image
            src="/logos/AZZEROCO2_LOGO_PAYOFF_ITA_POS.svg"
            alt="AzzeroCO2 Energy"
            width={180}
            height={40}
          />

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6">
            <a
              href="#features"
              className="text-sm text-white/60 transition-colors hover:text-white"
            >
              Funzionalità
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-white/60 transition-colors hover:text-white"
            >
              Come funziona
            </a>
            <a
              href="/privacy"
              className="text-sm text-white/60 transition-colors hover:text-white"
            >
              Privacy
            </a>
            <a
              href="#contact"
              className="text-sm text-white/60 transition-colors hover:text-white"
            >
              Contatti
            </a>
          </nav>
        </div>

        {/* Divider */}
        <div className="my-8 h-px bg-white/10" />

        {/* Copyright */}
        <p className="text-center text-xs text-white/40">
          &copy; 2026 AzzeroCO2 S.r.l. Società Benefit - Tutti i diritti
          riservati
        </p>
      </div>
    </footer>
  );
}
