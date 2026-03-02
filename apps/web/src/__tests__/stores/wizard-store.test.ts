import { describe, it, expect, beforeEach } from "vitest";
import { useWizardStore } from "@/stores/wizard-store";

const currentYear = new Date().getFullYear();

describe("useWizardStore", () => {
  beforeEach(() => {
    useWizardStore.getState().reset();
  });

  describe("initial state", () => {
    it("should start at step 1", () => {
      expect(useWizardStore.getState().currentStep).toBe(1);
    });

    it("should have default step1 data", () => {
      const { step1 } = useWizardStore.getState();
      expect(step1.name).toBe("");
      expect(step1.site_id).toBeUndefined();
      expect(step1.year).toBe(currentYear);
      expect(step1.wacc).toBeNull();
      expect(step1.description).toBeNull();
    });

    it("should have default step2 data with one empty demand", () => {
      const { step2 } = useWizardStore.getState();
      expect(step2.demands).toHaveLength(1);
      expect(step2.demands![0]).toEqual({
        end_use: "ELECTRICITY",
        annual_consumption_mwh: 0,
        profile_type: "nace_default",
      });
    });

    it("should have default step3 data with empty lighting_zones", () => {
      const { step3 } = useWizardStore.getState();
      expect(step3.lighting_zones).toEqual([]);
    });

    it("should have default step4 data with empty technologies", () => {
      const { step4 } = useWizardStore.getState();
      expect(step4.technologies).toEqual([]);
    });

    it("should have default step5 data", () => {
      const { step5 } = useWizardStore.getState();
      expect(step5.objective).toBe("cost");
      expect(step5.scenario_name).toBe("Scenario Base");
      expect(step5.co2_target).toBeNull();
      expect(step5.budget_limit).toBeNull();
    });
  });

  describe("nextStep", () => {
    it("should advance from step 1 to step 2", () => {
      useWizardStore.getState().nextStep();
      expect(useWizardStore.getState().currentStep).toBe(2);
    });

    it("should not go beyond step 5", () => {
      useWizardStore.setState({ currentStep: 5 });
      useWizardStore.getState().nextStep();
      expect(useWizardStore.getState().currentStep).toBe(5);
    });

    it("should advance sequentially through all steps", () => {
      const { nextStep } = useWizardStore.getState();
      for (let i = 2; i <= 5; i++) {
        nextStep();
        expect(useWizardStore.getState().currentStep).toBe(i);
      }
    });
  });

  describe("prevStep", () => {
    it("should go back from step 3 to step 2", () => {
      useWizardStore.setState({ currentStep: 3 });
      useWizardStore.getState().prevStep();
      expect(useWizardStore.getState().currentStep).toBe(2);
    });

    it("should not go below step 1", () => {
      useWizardStore.getState().prevStep();
      expect(useWizardStore.getState().currentStep).toBe(1);
    });
  });

  describe("setStep", () => {
    it("should set step to a valid value", () => {
      useWizardStore.getState().setStep(4);
      expect(useWizardStore.getState().currentStep).toBe(4);
    });

    it("should ignore step below MIN_STEP (1)", () => {
      useWizardStore.getState().setStep(0);
      expect(useWizardStore.getState().currentStep).toBe(1);
    });

    it("should ignore step above MAX_STEP (5)", () => {
      useWizardStore.getState().setStep(6);
      expect(useWizardStore.getState().currentStep).toBe(1);
    });

    it("should accept boundary values 1 and 5", () => {
      useWizardStore.getState().setStep(1);
      expect(useWizardStore.getState().currentStep).toBe(1);
      useWizardStore.getState().setStep(5);
      expect(useWizardStore.getState().currentStep).toBe(5);
    });
  });

  describe("updateStep1", () => {
    it("should merge partial data into step1", () => {
      useWizardStore.getState().updateStep1({ name: "Audit Energetico" });
      const { step1 } = useWizardStore.getState();
      expect(step1.name).toBe("Audit Energetico");
      // Other fields remain unchanged
      expect(step1.year).toBe(currentYear);
    });

    it("should update multiple fields at once", () => {
      const siteId = "550e8400-e29b-41d4-a716-446655440000";
      useWizardStore.getState().updateStep1({
        name: "Test Audit",
        site_id: siteId,
        year: 2026,
      });
      const { step1 } = useWizardStore.getState();
      expect(step1.name).toBe("Test Audit");
      expect(step1.site_id).toBe(siteId);
      expect(step1.year).toBe(2026);
    });
  });

  describe("updateStep2", () => {
    it("should update demands array", () => {
      const demands = [
        {
          end_use: "ELECTRICITY" as const,
          annual_consumption_mwh: 150,
          profile_type: "nace_default" as const,
        },
        {
          end_use: "HEAT_HIGH_T" as const,
          annual_consumption_mwh: 80,
          profile_type: "custom" as const,
        },
      ];
      useWizardStore.getState().updateStep2({ demands });
      expect(useWizardStore.getState().step2.demands).toEqual(demands);
    });
  });

  describe("updateStep3", () => {
    it("should update lighting_zones", () => {
      const zones = [
        { name: "Uffici", area_m2: 200, operating_hours: 2000 },
        { name: "Magazzino", area_m2: 500 },
      ];
      useWizardStore.getState().updateStep3({ lighting_zones: zones });
      expect(useWizardStore.getState().step3.lighting_zones).toEqual(zones);
    });
  });

  describe("updateStep4", () => {
    it("should update technologies", () => {
      const techs = [
        {
          technology_id: "550e8400-e29b-41d4-a716-446655440001",
          installed_capacity_kw: 100,
          is_existing: true,
        },
      ];
      useWizardStore.getState().updateStep4({ technologies: techs });
      expect(useWizardStore.getState().step4.technologies).toEqual(techs);
    });
  });

  describe("updateStep5", () => {
    it("should update scenario configuration", () => {
      useWizardStore.getState().updateStep5({
        objective: "decarbonization",
        scenario_name: "Scenario Green",
        co2_target: 0.5,
      });
      const { step5 } = useWizardStore.getState();
      expect(step5.objective).toBe("decarbonization");
      expect(step5.scenario_name).toBe("Scenario Green");
      expect(step5.co2_target).toBe(0.5);
      // budget_limit was not updated, should remain null
      expect(step5.budget_limit).toBeNull();
    });
  });

  describe("isStepValid", () => {
    it("should return false for step1 with empty default data", () => {
      // Default step1 has name="" and no site_id, which should fail validation
      expect(useWizardStore.getState().isStepValid(1)).toBe(false);
    });

    it("should return true for step1 with valid data", () => {
      useWizardStore.getState().updateStep1({
        name: "Audit 2025",
        site_id: "550e8400-e29b-41d4-a716-446655440000",
        year: 2025,
      });
      expect(useWizardStore.getState().isStepValid(1)).toBe(true);
    });

    it("should return true for step2 with valid demand", () => {
      useWizardStore.getState().updateStep2({
        demands: [
          {
            end_use: "ELECTRICITY",
            annual_consumption_mwh: 100,
            profile_type: "nace_default",
          },
        ],
      });
      expect(useWizardStore.getState().isStepValid(2)).toBe(true);
    });

    it("should return true for step3 with default empty lighting_zones", () => {
      // step3 lighting_zones defaults to [] which is valid
      expect(useWizardStore.getState().isStepValid(3)).toBe(true);
    });

    it("should return false for step4 with empty technologies (min 1 required)", () => {
      expect(useWizardStore.getState().isStepValid(4)).toBe(false);
    });

    it("should return true for step4 with valid technology", () => {
      useWizardStore.getState().updateStep4({
        technologies: [
          {
            technology_id: "550e8400-e29b-41d4-a716-446655440001",
            installed_capacity_kw: 50,
            is_existing: false,
          },
        ],
      });
      expect(useWizardStore.getState().isStepValid(4)).toBe(true);
    });

    it("should return true for step5 with valid default data", () => {
      // Default step5 has objective="cost" and scenario_name="Scenario Base"
      expect(useWizardStore.getState().isStepValid(5)).toBe(true);
    });

    it("should return false for an invalid step number", () => {
      expect(useWizardStore.getState().isStepValid(0)).toBe(false);
      expect(useWizardStore.getState().isStepValid(6)).toBe(false);
    });
  });

  describe("reset", () => {
    it("should reset currentStep to 1", () => {
      useWizardStore.setState({ currentStep: 4 });
      useWizardStore.getState().reset();
      expect(useWizardStore.getState().currentStep).toBe(1);
    });

    it("should restore all step data to defaults", () => {
      // Modify all steps
      useWizardStore.getState().updateStep1({ name: "Modified" });
      useWizardStore.getState().updateStep2({
        demands: [
          {
            end_use: "HEAT_LOW_T",
            annual_consumption_mwh: 999,
            profile_type: "custom",
          },
        ],
      });
      useWizardStore.getState().updateStep5({
        objective: "decarbonization",
        scenario_name: "Custom Scenario",
      });

      useWizardStore.getState().reset();

      const state = useWizardStore.getState();
      expect(state.step1.name).toBe("");
      expect(state.step2.demands![0].end_use).toBe("ELECTRICITY");
      expect(state.step5.objective).toBe("cost");
      expect(state.step5.scenario_name).toBe("Scenario Base");
    });

    it("should produce independent default objects (no shared references)", () => {
      useWizardStore.getState().reset();
      const firstReset = useWizardStore.getState().step2.demands;

      useWizardStore.getState().updateStep2({
        demands: [
          {
            end_use: "COLD",
            annual_consumption_mwh: 50,
            profile_type: "upload",
          },
        ],
      });
      useWizardStore.getState().reset();
      const secondReset = useWizardStore.getState().step2.demands;

      // Both resets should produce equal but not identical objects
      expect(secondReset).toEqual(firstReset);
    });
  });
});
