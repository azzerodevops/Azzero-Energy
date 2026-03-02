"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SplashScreen } from "@/components/splash/splash-screen";
import { LandingPage } from "@/components/landing/landing-page";

export default function HomePage() {
  const [showSplash, setShowSplash] = useState(true);
  const router = useRouter();

  const handleSplashComplete = useCallback(
    (isAuthenticated: boolean) => {
      if (isAuthenticated) {
        router.push("/dashboard");
      } else {
        setShowSplash(false);
      }
    },
    [router],
  );

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return <LandingPage />;
}
