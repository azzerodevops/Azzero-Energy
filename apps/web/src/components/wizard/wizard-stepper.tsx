"use client";

import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { WIZARD_STEPS } from "@azzeroco2/shared";
import { cn } from "@/lib/utils";

interface WizardStepperProps {
  currentStep: number;
  onStepClick: (step: number) => void;
}

export function WizardStepper({ currentStep, onStepClick }: WizardStepperProps) {
  const currentStepData = WIZARD_STEPS.find((s) => s.number === currentStep);

  function handleStepClick(stepNumber: number) {
    // Allow clicking only on completed or current steps
    if (stepNumber <= currentStep) {
      onStepClick(stepNumber);
    }
  }

  return (
    <>
      {/* Desktop stepper */}
      <nav aria-label="Progresso wizard" className="hidden sm:block">
        <ol className="flex items-center justify-between">
          {WIZARD_STEPS.map((step, index) => {
            const isCompleted = step.number < currentStep;
            const isCurrent = step.number === currentStep;
            const isFuture = step.number > currentStep;
            const isLast = index === WIZARD_STEPS.length - 1;

            return (
              <li
                key={step.number}
                className={cn("flex items-center", !isLast && "flex-1")}
              >
                <div className="flex flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStepClick(step.number)}
                    disabled={isFuture}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all",
                      isCompleted &&
                        "border-primary bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90",
                      isCurrent &&
                        "border-primary bg-primary/10 text-primary ring-4 ring-primary/20",
                      isFuture &&
                        "border-muted-foreground/30 bg-transparent text-muted-foreground/50 cursor-not-allowed"
                    )}
                    aria-current={isCurrent ? "step" : undefined}
                    aria-label={`Passo ${step.number}: ${step.label}`}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      step.number
                    )}
                  </button>
                  <span
                    className={cn(
                      "text-xs font-medium text-center max-w-[100px]",
                      isCurrent && "text-primary",
                      isCompleted && "text-foreground",
                      isFuture && "text-muted-foreground/50"
                    )}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connecting line */}
                {!isLast && (
                  <div
                    className={cn(
                      "mx-2 mt-[-1.5rem] h-0.5 flex-1 transition-colors",
                      step.number < currentStep
                        ? "bg-primary"
                        : "bg-muted-foreground/20"
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Mobile stepper: current step label with prev/next arrows */}
      <nav
        aria-label="Progresso wizard"
        className="flex items-center justify-between sm:hidden"
      >
        <button
          type="button"
          onClick={() => handleStepClick(currentStep - 1)}
          disabled={currentStep <= 1}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
            currentStep <= 1
              ? "border-muted-foreground/20 text-muted-foreground/30 cursor-not-allowed"
              : "border-muted-foreground/40 text-foreground hover:bg-muted cursor-pointer"
          )}
          aria-label="Passo precedente"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold",
                "border-primary bg-primary/10 text-primary"
              )}
            >
              {currentStep}
            </span>
            <span className="text-sm font-medium text-foreground">
              {currentStepData?.label}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            Passo {currentStep} di {WIZARD_STEPS.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleStepClick(currentStep + 1)}
          disabled
          className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors border-muted-foreground/20 text-muted-foreground/30 cursor-not-allowed"
          aria-label="Usa il pulsante Avanti per procedere"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </nav>
    </>
  );
}
