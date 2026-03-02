import { describe, it, expect } from "vitest";
import {
  BRAND_COLORS,
  APP_NAME,
  APP_DESCRIPTION,
  NACE_SECTORS,
  END_USE_LABELS,
  RESOURCE_TYPE_LABELS,
  STORAGE_TYPE_LABELS,
  ANALYSIS_STATUS_LABELS,
  ANALYSIS_STATUS_COLORS,
  FIXTURE_TYPES,
  CHART_COLORS,
  SCENARIO_STATUS_LABELS,
  SCENARIO_STATUS_COLORS,
  OBJECTIVE_LABELS,
  OBJECTIVE_COLORS,
  WIZARD_STEPS,
} from "@azzeroco2/shared";

// ===========================================================================
// BRAND_COLORS
// ===========================================================================

describe("BRAND_COLORS", () => {
  it("has all required color keys", () => {
    const requiredKeys = [
      "primary",
      "secondary",
      "accent",
      "warning",
      "error",
      "dark",
      "darkCard",
      "text",
      "textMuted",
    ];
    for (const key of requiredKeys) {
      expect(BRAND_COLORS).toHaveProperty(key);
    }
  });

  it("all color values are valid hex codes", () => {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    for (const [key, value] of Object.entries(BRAND_COLORS)) {
      expect(value, `BRAND_COLORS.${key} should be a valid hex code`).toMatch(
        hexRegex
      );
    }
  });

  it("has correct primary and secondary values", () => {
    expect(BRAND_COLORS.primary).toBe("#0097D7");
    expect(BRAND_COLORS.secondary).toBe("#00B894");
  });
});

// ===========================================================================
// APP constants
// ===========================================================================

describe("APP constants", () => {
  it("APP_NAME is set", () => {
    expect(APP_NAME).toBe("AzzeroCO2 Energy");
  });

  it("APP_DESCRIPTION is set", () => {
    expect(APP_DESCRIPTION).toBe("Il clima nelle nostre mani");
  });
});

// ===========================================================================
// NACE_SECTORS
// ===========================================================================

describe("NACE_SECTORS", () => {
  it("is a non-empty array", () => {
    expect(NACE_SECTORS.length).toBeGreaterThan(0);
  });

  it("each entry has code and label", () => {
    for (const sector of NACE_SECTORS) {
      expect(sector).toHaveProperty("code");
      expect(sector).toHaveProperty("label");
      expect(typeof sector.code).toBe("string");
      expect(typeof sector.label).toBe("string");
      expect(sector.code.length).toBeGreaterThan(0);
      expect(sector.label.length).toBeGreaterThan(0);
    }
  });

  it("has unique codes", () => {
    const codes = NACE_SECTORS.map((s) => s.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

// ===========================================================================
// SCENARIO_STATUS_LABELS / SCENARIO_STATUS_COLORS consistency
// ===========================================================================

describe("SCENARIO_STATUS_LABELS", () => {
  const expectedStatuses = [
    "draft",
    "queued",
    "running",
    "completed",
    "failed",
    "outdated",
  ];

  it("covers all scenario statuses", () => {
    for (const status of expectedStatuses) {
      expect(SCENARIO_STATUS_LABELS).toHaveProperty(status);
    }
  });

  it("all labels are non-empty strings", () => {
    for (const [key, label] of Object.entries(SCENARIO_STATUS_LABELS)) {
      expect(typeof label, `Label for ${key}`).toBe("string");
      expect((label as string).length, `Label for ${key}`).toBeGreaterThan(0);
    }
  });
});

describe("SCENARIO_STATUS_COLORS", () => {
  it("has the same keys as SCENARIO_STATUS_LABELS", () => {
    const labelKeys = Object.keys(SCENARIO_STATUS_LABELS).sort();
    const colorKeys = Object.keys(SCENARIO_STATUS_COLORS).sort();
    expect(colorKeys).toEqual(labelKeys);
  });

  it("all color values are Tailwind class strings", () => {
    for (const [key, value] of Object.entries(SCENARIO_STATUS_COLORS)) {
      expect(typeof value, `Color for ${key}`).toBe("string");
      expect((value as string).length, `Color for ${key}`).toBeGreaterThan(0);
      // All colors contain bg- and text- classes
      expect(value, `Color for ${key} should contain bg- class`).toContain("bg-");
      expect(value, `Color for ${key} should contain text- class`).toContain("text-");
    }
  });
});

// ===========================================================================
// ANALYSIS_STATUS_LABELS / ANALYSIS_STATUS_COLORS consistency
// ===========================================================================

describe("ANALYSIS_STATUS_LABELS / ANALYSIS_STATUS_COLORS", () => {
  it("have the same keys", () => {
    const labelKeys = Object.keys(ANALYSIS_STATUS_LABELS).sort();
    const colorKeys = Object.keys(ANALYSIS_STATUS_COLORS).sort();
    expect(colorKeys).toEqual(labelKeys);
  });

  it("labels are non-empty Italian strings", () => {
    for (const [key, label] of Object.entries(ANALYSIS_STATUS_LABELS)) {
      expect(typeof label, `Label for ${key}`).toBe("string");
      expect((label as string).length, `Label for ${key}`).toBeGreaterThan(0);
    }
  });
});

// ===========================================================================
// OBJECTIVE_LABELS / OBJECTIVE_COLORS consistency
// ===========================================================================

describe("OBJECTIVE_LABELS / OBJECTIVE_COLORS", () => {
  it("have the same keys", () => {
    const labelKeys = Object.keys(OBJECTIVE_LABELS).sort();
    const colorKeys = Object.keys(OBJECTIVE_COLORS).sort();
    expect(colorKeys).toEqual(labelKeys);
  });

  it("cover cost and decarbonization", () => {
    expect(OBJECTIVE_LABELS).toHaveProperty("cost");
    expect(OBJECTIVE_LABELS).toHaveProperty("decarbonization");
  });
});

// ===========================================================================
// END_USE_LABELS
// ===========================================================================

describe("END_USE_LABELS", () => {
  const expectedKeys = [
    "ELECTRICITY",
    "HEAT_HIGH_T",
    "HEAT_MED_T",
    "HEAT_LOW_T",
    "COLD",
  ];

  it("covers all end use types", () => {
    for (const key of expectedKeys) {
      expect(END_USE_LABELS).toHaveProperty(key);
    }
  });

  it("all labels are non-empty", () => {
    for (const [key, label] of Object.entries(END_USE_LABELS)) {
      expect((label as string).length, `Label for ${key}`).toBeGreaterThan(0);
    }
  });
});

// ===========================================================================
// RESOURCE_TYPE_LABELS
// ===========================================================================

describe("RESOURCE_TYPE_LABELS", () => {
  const expectedKeys = [
    "electricity",
    "natural_gas",
    "biomass",
    "diesel",
    "lpg",
    "solar",
    "wind",
    "hydrogen",
  ];

  it("covers all resource types", () => {
    for (const key of expectedKeys) {
      expect(RESOURCE_TYPE_LABELS).toHaveProperty(key);
    }
  });
});

// ===========================================================================
// STORAGE_TYPE_LABELS
// ===========================================================================

describe("STORAGE_TYPE_LABELS", () => {
  it("covers all storage types", () => {
    expect(STORAGE_TYPE_LABELS).toHaveProperty("battery_lion");
    expect(STORAGE_TYPE_LABELS).toHaveProperty("thermal_hot");
    expect(STORAGE_TYPE_LABELS).toHaveProperty("thermal_cold");
  });
});

// ===========================================================================
// FIXTURE_TYPES
// ===========================================================================

describe("FIXTURE_TYPES", () => {
  it("is a non-empty array", () => {
    expect(FIXTURE_TYPES.length).toBeGreaterThan(0);
  });

  it("contains LED", () => {
    expect(FIXTURE_TYPES).toContain("LED");
  });
});

// ===========================================================================
// CHART_COLORS
// ===========================================================================

describe("CHART_COLORS", () => {
  it("is a non-empty array", () => {
    expect(CHART_COLORS.length).toBeGreaterThan(0);
  });

  it("all values are valid hex codes", () => {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    for (const color of CHART_COLORS) {
      expect(color).toMatch(hexRegex);
    }
  });

  it("starts with brand primary color", () => {
    expect(CHART_COLORS[0]).toBe(BRAND_COLORS.primary);
  });
});

// ===========================================================================
// WIZARD_STEPS
// ===========================================================================

describe("WIZARD_STEPS", () => {
  it("has 5 steps", () => {
    expect(WIZARD_STEPS).toHaveLength(5);
  });

  it("steps are numbered 1 through 5", () => {
    for (let i = 0; i < WIZARD_STEPS.length; i++) {
      expect(WIZARD_STEPS[i].number).toBe(i + 1);
    }
  });

  it("each step has label and description", () => {
    for (const step of WIZARD_STEPS) {
      expect(step.label.length).toBeGreaterThan(0);
      expect(step.description.length).toBeGreaterThan(0);
    }
  });
});
