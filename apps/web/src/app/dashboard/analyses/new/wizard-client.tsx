"use client";

import { useEffect } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useWizardStore } from "@/stores/wizard-store";
import { WizardStepper } from "@/components/wizard/wizard-stepper";
import { StepGeneral } from "@/components/wizard/step-general";
import { StepConsumption } from "@/components/wizard/step-consumption";
import { StepThermal } from "@/components/wizard/step-thermal";
import { StepTechnologies } from "@/components/wizard/step-technologies";
import { StepSummary } from "@/components/wizard/step-summary";
import { Button } from "@/components/ui/button";

export interface WizardSite {
  id: string;
  name: string;
  city: string | null;
  nace_code?: string | null;
  sector?: string | null;
  area_sqm?: string | null;
  employees?: number | null;
  operating_hours?: number | null;
}

interface WizardClientProps {
  organizationId: string;
  sites: WizardSite[];
  technologies: {
    id: string;
    name: string;
    category: string;
    capex_per_kw: string | null;
    min_size_kw: string | null;
    max_size_kw: string | null;
  }[];
}

export function WizardClient({
  organizationId,
  sites,
  technologies,
}: WizardClientProps) {
  const { currentStep, setStep, nextStep, prevStep, reset, isStepValid } =
    useWizardStore();

  // Reset wizard state on mount
  useEffect(() => {
    reset();
  }, [reset]);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold">Nuova analisi energetica</h1>
        <p className="text-muted-foreground">
          Segui i passaggi per configurare la tua analisi
        </p>
      </div>

      {/* Stepper */}
      <WizardStepper currentStep={currentStep} onStepClick={setStep} />

      {/* Step content */}
      <div className="min-h-[400px]">
        {currentStep === 1 && (
          <StepGeneral sites={sites} />
        )}
        {currentStep === 2 && <StepConsumption sites={sites} />}
        {currentStep === 3 && <StepThermal />}
        {currentStep === 4 && <StepTechnologies technologies={technologies} />}
        {currentStep === 5 && (
          <StepSummary organizationId={organizationId} />
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Indietro
        </Button>

        {currentStep < 5 ? (
          <Button onClick={nextStep} disabled={!isStepValid(currentStep)}>
            Avanti
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
