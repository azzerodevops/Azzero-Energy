import { describe, it, expect, beforeEach } from "vitest";
import { useAnalysisStore } from "@/stores/analysis-store";

const mockAnalysis = {
  id: "analysis-001",
  name: "Audit Energetico 2025",
  status: "draft",
  siteId: "site-abc",
  siteName: "Stabilimento Roma",
  year: 2025,
  organizationId: "org-1",
};

const mockAnalysis2 = {
  id: "analysis-002",
  name: "Audit Energetico 2026",
  status: "completed",
  siteId: "site-xyz",
  siteName: "Stabilimento Milano",
  year: 2026,
  organizationId: "org-1",
};

describe("useAnalysisStore", () => {
  beforeEach(() => {
    // Reset store to initial state
    useAnalysisStore.setState({ currentAnalysis: null });
  });

  describe("initial state", () => {
    it("should have currentAnalysis as null", () => {
      expect(useAnalysisStore.getState().currentAnalysis).toBeNull();
    });
  });

  describe("setAnalysis", () => {
    it("should set the current analysis", () => {
      useAnalysisStore.getState().setAnalysis(mockAnalysis);
      expect(useAnalysisStore.getState().currentAnalysis).toEqual(
        mockAnalysis
      );
    });

    it("should replace the current analysis", () => {
      useAnalysisStore.getState().setAnalysis(mockAnalysis);
      useAnalysisStore.getState().setAnalysis(mockAnalysis2);
      expect(useAnalysisStore.getState().currentAnalysis).toEqual(
        mockAnalysis2
      );
    });

    it("should accept analysis without optional siteName", () => {
      const analysisNoSiteName = {
        id: "analysis-003",
        name: "Test Analysis",
        status: "draft",
        siteId: "site-123",
        year: 2025,
        organizationId: "org-2",
      };
      useAnalysisStore.getState().setAnalysis(analysisNoSiteName);
      expect(useAnalysisStore.getState().currentAnalysis).toEqual(
        analysisNoSiteName
      );
      expect(
        useAnalysisStore.getState().currentAnalysis?.siteName
      ).toBeUndefined();
    });
  });

  describe("clearAnalysis", () => {
    it("should reset currentAnalysis to null", () => {
      useAnalysisStore.getState().setAnalysis(mockAnalysis);
      useAnalysisStore.getState().clearAnalysis();
      expect(useAnalysisStore.getState().currentAnalysis).toBeNull();
    });

    it("should be idempotent when already null", () => {
      useAnalysisStore.getState().clearAnalysis();
      expect(useAnalysisStore.getState().currentAnalysis).toBeNull();
    });
  });
});
