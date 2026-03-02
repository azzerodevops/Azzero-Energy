"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

interface SplashScreenProps {
  onComplete: (isAuthenticated: boolean) => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const check = async () => {
      const [authResult] = await Promise.all([
        supabase.auth.getSession(),
        new Promise((resolve) => setTimeout(resolve, 2000)), // minimum 2s
      ]);

      setFadeOut(true);
      setTimeout(() => {
        onComplete(!!authResult.data.session);
      }, 500); // wait for fade-out animation
    };

    check();
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#121827] transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="relative">
        {/* Layer 1: Ghost logo at 15% opacity */}
        <div className="flex flex-col items-center gap-4 opacity-[0.15]">
          <Image
            src="/logos/AZZEROCO2_LOGO_PAYOFF_ITA_POS.svg"
            alt="AzzeroCO2 Energy"
            width={280}
            height={80}
            priority
          />
          <p className="text-[13px] font-light tracking-widest text-white">
            Caricamento in corso...
          </p>
        </div>

        {/* Layer 2: Shimmer overlay with mask animation */}
        <div
          className="absolute inset-0 flex flex-col items-center gap-4 animate-logo-wave"
          style={{
            maskImage:
              "linear-gradient(110deg, transparent 30%, white 50%, transparent 70%)",
            WebkitMaskImage:
              "linear-gradient(110deg, transparent 30%, white 50%, transparent 70%)",
            maskSize: "300% 100%",
            WebkitMaskSize: "300% 100%",
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
          }}
        >
          <Image
            src="/logos/AZZEROCO2_LOGO_PAYOFF_ITA_POS.svg"
            alt=""
            width={280}
            height={80}
            priority
          />
          <p className="text-[13px] font-light tracking-widest text-white/60">
            Caricamento in corso...
          </p>
        </div>
      </div>
    </div>
  );
}
