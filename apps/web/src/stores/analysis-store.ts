import { create } from "zustand";

interface AnalysisContext {
  id: string;
  name: string;
  status: string;
  siteId: string;
  siteName?: string;
  year: number;
  organizationId: string;
}

interface AnalysisState {
  currentAnalysis: AnalysisContext | null;
  setAnalysis: (analysis: AnalysisContext) => void;
  clearAnalysis: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  currentAnalysis: null,
  setAnalysis: (analysis) => set({ currentAnalysis: analysis }),
  clearAnalysis: () => set({ currentAnalysis: null }),
}));
