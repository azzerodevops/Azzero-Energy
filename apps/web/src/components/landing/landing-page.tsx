"use client";

import { LandingHeader } from "./landing-header";
import { VideoHero } from "./video-hero";
import { FeatureCards } from "./feature-cards";
import { HowItWorks } from "./how-it-works";
import { LandingFooter } from "./landing-footer";

export function LandingPage() {
  return (
    <div id="main-content" className="min-h-screen bg-background">
      <LandingHeader />
      <VideoHero />
      <FeatureCards />
      <HowItWorks />
      <LandingFooter />
    </div>
  );
}
