import { create } from "zustand";
import type {
  WizardStep1Input,
  WizardStep2Input,
  WizardStep3Input,
  WizardStep4Input,
  WizardStep5Input,
} from "@azzeroco2/shared";
import {
  wizardStep1Schema,
  wizardStep2Schema,
  wizardStep3Schema,
  wizardStep4Schema,
  wizardStep5Schema,
} from "@azzeroco2/shared";

// ============================================================
// AzzeroCO2 Energy - Wizard Zustand Store
// ============================================================

const MAX_STEP = 5;
const MIN_STEP = 1;

const defaultStep1: Partial<WizardStep1Input> = {
  name: "",
  site_id: undefined,
  year: new Date().getFullYear(),
  wacc: null,
  description: null,
};

const defaultStep2: Partial<WizardStep2Input> = {
  demands: [
    {
      end_use: "ELECTRICITY",
      annual_consumption_mwh: 0,
      profile_type: "office",
    },
  ],
};

const defaultStep3: Partial<WizardStep3Input> = {
  lighting_zones: [],
};

const defaultStep4: Partial<WizardStep4Input> = {
  technologies: [],
};

const defaultStep5: Partial<WizardStep5Input> = {
  objective: "cost",
  scenario_name: "Scenario Base",
  co2_target: null,
  budget_limit: null,
};

interface WizardState {
  currentStep: number;
  // Step data (persists across steps)
  step1: Partial<WizardStep1Input>;
  step2: Partial<WizardStep2Input>;
  step3: Partial<WizardStep3Input>;
  step4: Partial<WizardStep4Input>;
  step5: Partial<WizardStep5Input>;
  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateStep1: (data: Partial<WizardStep1Input>) => void;
  updateStep2: (data: Partial<WizardStep2Input>) => void;
  updateStep3: (data: Partial<WizardStep3Input>) => void;
  updateStep4: (data: Partial<WizardStep4Input>) => void;
  updateStep5: (data: Partial<WizardStep5Input>) => void;
  reset: () => void;
  // Computed
  isStepValid: (step: number) => boolean;
}

export const useWizardStore = create<WizardState>((set, get) => ({
  currentStep: MIN_STEP,
  step1: { ...defaultStep1 },
  step2: { ...defaultStep2 },
  step3: { ...defaultStep3 },
  step4: { ...defaultStep4 },
  step5: { ...defaultStep5 },

  setStep: (step) => {
    if (step >= MIN_STEP && step <= MAX_STEP) {
      set({ currentStep: step });
    }
  },

  nextStep: () => {
    const { currentStep } = get();
    if (currentStep < MAX_STEP) {
      set({ currentStep: currentStep + 1 });
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > MIN_STEP) {
      set({ currentStep: currentStep - 1 });
    }
  },

  updateStep1: (data) =>
    set((state) => ({ step1: { ...state.step1, ...data } })),

  updateStep2: (data) =>
    set((state) => ({ step2: { ...state.step2, ...data } })),

  updateStep3: (data) =>
    set((state) => ({ step3: { ...state.step3, ...data } })),

  updateStep4: (data) =>
    set((state) => ({ step4: { ...state.step4, ...data } })),

  updateStep5: (data) =>
    set((state) => ({ step5: { ...state.step5, ...data } })),

  reset: () =>
    set({
      currentStep: MIN_STEP,
      step1: { ...defaultStep1 },
      step2: { ...defaultStep2 },
      step3: { ...defaultStep3 },
      step4: { ...defaultStep4 },
      step5: { ...defaultStep5 },
    }),

  isStepValid: (step) => {
    const state = get();
    switch (step) {
      case 1:
        return wizardStep1Schema.safeParse(state.step1).success;
      case 2:
        return wizardStep2Schema.safeParse(state.step2).success;
      case 3:
        return wizardStep3Schema.safeParse(state.step3).success;
      case 4:
        return wizardStep4Schema.safeParse(state.step4).success;
      case 5:
        return wizardStep5Schema.safeParse(state.step5).success;
      default:
        return false;
    }
  },
}));
