"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function VideoHero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
      {/* Background video (decorative) */}
      <video
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source
          src="/videos/12808704_1920_1080_25fps.mp4"
          type="video/mp4"
        />
      </video>

      {/* Gradient overlay (decorative) */}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 mx-auto max-w-4xl px-6 text-center"
      >
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-6xl">
          Decarbonizza il tuo impianto
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80 md:text-xl">
          Analisi energetica, ottimizzazione e reporting ESG in un&apos;unica
          piattaforma intelligente
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/auth/login">
            <Button size="lg" className="min-w-[160px] text-base">
              Accedi
            </Button>
          </Link>
          <a href="#features">
            <Button
              variant="outline"
              size="lg"
              className="min-w-[160px] border-white/30 text-base text-white hover:bg-white/10 hover:text-white"
            >
              Scopri di più
            </Button>
          </a>
        </div>
      </motion.div>
    </section>
  );
}
