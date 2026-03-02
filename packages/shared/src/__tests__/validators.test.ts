import { describe, it, expect } from "vitest";
import { ZodError } from "zod";
import {
  // index.ts validators
  organizationSchema,
  createOrganizationSchema,
  updateOrganizationSchema,
  userSchema,
  createUserSchema,
  energyAnalysisSchema,
  createEnergyAnalysisSchema,
  optimizationResultSchema,
  createOptimizationResultSchema,
  auditLogSchema,
  createAuditLogSchema,
  // sites
  createSiteSchema,
  updateSiteSchema,
  // analyses
  createAnalysisSchema,
  updateAnalysisSchema,
  // demands
  createDemandSchema,
  updateDemandSchema,
  // resources
  createResourceSchema,
  updateResourceSchema,
  // technologies
  addAnalysisTechSchema,
  updateAnalysisTechSchema,
  // storage
  createStorageSchema,
  updateStorageSchema,
  // lighting
  createLightingZoneSchema,
  updateLightingZoneSchema,
  // files
  registerFileSchema,
  // scenarios
  createScenarioSchema,
  updateScenarioSchema,
  createScenarioTechConfigSchema,
  // wizard
  wizardStep1Schema,
  wizardStep2Schema,
  wizardStep3Schema,
  wizardStep4Schema,
  wizardStep5Schema,
  wizardDemandItemSchema,
  wizardLightingZoneSchema,
  wizardTechItemSchema,
} from "../validators";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
const VALID_UUID_2 = "660e8400-e29b-41d4-a716-446655440000";

function expectParseSuccess<T>(schema: { parse: (d: unknown) => T }, data: unknown): T {
  return schema.parse(data);
}

function expectParseFailure(schema: { parse: (d: unknown) => unknown }, data: unknown): ZodError {
  try {
    schema.parse(data);
    throw new Error("Expected ZodError but parsing succeeded");
  } catch (e) {
    expect(e).toBeInstanceOf(ZodError);
    return e as ZodError;
  }
}

// ===========================================================================
// Organization
// ===========================================================================

describe("organizationSchema", () => {
  const validOrg = {
    id: VALID_UUID,
    name: "My Org",
    slug: "my-org",
    plan: "pro" as const,
    createdAt: new Date().toISOString(),
  };

  it("parses a valid organization", () => {
    const result = expectParseSuccess(organizationSchema, validOrg);
    expect(result.name).toBe("My Org");
    expect(result.plan).toBe("pro");
  });

  it("rejects empty name", () => {
    expectParseFailure(organizationSchema, { ...validOrg, name: "" });
  });

  it("rejects invalid plan", () => {
    expectParseFailure(organizationSchema, { ...validOrg, plan: "platinum" });
  });

  it("rejects invalid uuid", () => {
    expectParseFailure(organizationSchema, { ...validOrg, id: "not-a-uuid" });
  });
});

describe("createOrganizationSchema", () => {
  it("omits id and createdAt", () => {
    const result = expectParseSuccess(createOrganizationSchema, {
      name: "New Org",
      slug: "new-org",
      plan: "free",
    });
    expect(result.name).toBe("New Org");
  });

  it("rejects when name is missing", () => {
    expectParseFailure(createOrganizationSchema, { slug: "test", plan: "free" });
  });
});

describe("updateOrganizationSchema", () => {
  it("allows partial fields", () => {
    const result = expectParseSuccess(updateOrganizationSchema, { name: "Updated" });
    expect(result.name).toBe("Updated");
  });

  it("allows empty object (all fields optional)", () => {
    const result = expectParseSuccess(updateOrganizationSchema, {});
    expect(result).toEqual({});
  });
});

// ===========================================================================
// User
// ===========================================================================

describe("userSchema", () => {
  const validUser = {
    id: VALID_UUID,
    email: "user@example.com",
    fullName: "Mario Rossi",
    role: "analyst" as const,
    organizationId: VALID_UUID_2,
    createdAt: new Date().toISOString(),
  };

  it("parses a valid user", () => {
    const result = expectParseSuccess(userSchema, validUser);
    expect(result.email).toBe("user@example.com");
    expect(result.role).toBe("analyst");
  });

  it("rejects invalid email", () => {
    expectParseFailure(userSchema, { ...validUser, email: "not-email" });
  });

  it("rejects invalid role", () => {
    expectParseFailure(userSchema, { ...validUser, role: "superadmin" });
  });

  it("rejects empty fullName", () => {
    expectParseFailure(userSchema, { ...validUser, fullName: "" });
  });
});

describe("createUserSchema", () => {
  it("omits id and createdAt", () => {
    const result = expectParseSuccess(createUserSchema, {
      email: "test@test.com",
      fullName: "Test User",
      role: "viewer",
      organizationId: VALID_UUID,
    });
    expect(result.email).toBe("test@test.com");
  });
});

// ===========================================================================
// Energy Analysis (from index.ts)
// ===========================================================================

describe("energyAnalysisSchema", () => {
  const validAnalysis = {
    id: VALID_UUID,
    organizationId: VALID_UUID_2,
    name: "Analisi 2024",
    status: "draft" as const,
    naceCode: "C10",
    annualConsumptionKwh: 50000,
    co2EmissionsTons: 25.5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("parses valid energy analysis", () => {
    const result = expectParseSuccess(energyAnalysisSchema, validAnalysis);
    expect(result.name).toBe("Analisi 2024");
    expect(result.annualConsumptionKwh).toBe(50000);
  });

  it("rejects negative consumption", () => {
    expectParseFailure(energyAnalysisSchema, {
      ...validAnalysis,
      annualConsumptionKwh: -100,
    });
  });

  it("rejects invalid status", () => {
    expectParseFailure(energyAnalysisSchema, { ...validAnalysis, status: "archived" });
  });
});

describe("createEnergyAnalysisSchema", () => {
  it("omits id, createdAt, updatedAt, status, co2EmissionsTons", () => {
    const result = expectParseSuccess(createEnergyAnalysisSchema, {
      organizationId: VALID_UUID,
      name: "New Analysis",
      naceCode: "C10",
      annualConsumptionKwh: 1000,
    });
    expect(result.name).toBe("New Analysis");
  });

  it("rejects empty name", () => {
    expectParseFailure(createEnergyAnalysisSchema, {
      organizationId: VALID_UUID,
      name: "",
      naceCode: "C10",
      annualConsumptionKwh: 1000,
    });
  });
});

// ===========================================================================
// Optimization Result
// ===========================================================================

describe("optimizationResultSchema", () => {
  it("parses a valid result", () => {
    const result = expectParseSuccess(optimizationResultSchema, {
      id: VALID_UUID,
      analysisId: VALID_UUID_2,
      savingsPercentage: 35.5,
      paybackYears: 4.2,
      recommendedActions: ["Install solar panels", "Upgrade insulation"],
      createdAt: new Date().toISOString(),
    });
    expect(result.savingsPercentage).toBe(35.5);
    expect(result.recommendedActions).toHaveLength(2);
  });

  it("rejects savings > 100%", () => {
    expectParseFailure(optimizationResultSchema, {
      id: VALID_UUID,
      analysisId: VALID_UUID_2,
      savingsPercentage: 150,
      paybackYears: 4,
      recommendedActions: [],
      createdAt: new Date().toISOString(),
    });
  });

  it("rejects negative payback years", () => {
    expectParseFailure(optimizationResultSchema, {
      id: VALID_UUID,
      analysisId: VALID_UUID_2,
      savingsPercentage: 20,
      paybackYears: -1,
      recommendedActions: [],
      createdAt: new Date().toISOString(),
    });
  });
});

describe("createOptimizationResultSchema", () => {
  it("omits id and createdAt", () => {
    const result = expectParseSuccess(createOptimizationResultSchema, {
      analysisId: VALID_UUID,
      savingsPercentage: 20,
      paybackYears: 3,
      recommendedActions: ["LED lighting"],
    });
    expect(result.recommendedActions).toContain("LED lighting");
  });
});

// ===========================================================================
// Audit Log
// ===========================================================================

describe("auditLogSchema", () => {
  it("parses a valid audit log", () => {
    const result = expectParseSuccess(auditLogSchema, {
      id: VALID_UUID,
      userId: VALID_UUID_2,
      action: "create",
      resource: "analysis",
      resourceId: VALID_UUID,
      metadata: { ip: "127.0.0.1" },
      createdAt: new Date().toISOString(),
    });
    expect(result.action).toBe("create");
  });

  it("rejects empty action", () => {
    expectParseFailure(auditLogSchema, {
      id: VALID_UUID,
      userId: VALID_UUID_2,
      action: "",
      resource: "analysis",
      resourceId: VALID_UUID,
      metadata: {},
      createdAt: new Date().toISOString(),
    });
  });
});

// ===========================================================================
// Sites
// ===========================================================================

describe("createSiteSchema", () => {
  const validSite = {
    organization_id: VALID_UUID,
    name: "Stabilimento Nord",
  };

  it("parses a minimal valid site", () => {
    const result = expectParseSuccess(createSiteSchema, validSite);
    expect(result.name).toBe("Stabilimento Nord");
    expect(result.country).toBe("Italia"); // default
  });

  it("parses a fully populated site", () => {
    const result = expectParseSuccess(createSiteSchema, {
      ...validSite,
      address: "Via Roma 1",
      city: "Milano",
      province: "MI",
      country: "Italia",
      latitude: 45.4642,
      longitude: 9.19,
      nace_code: "C10.1",
      sector: "Manufacturing",
      employees: 50,
      area_sqm: 2000,
      roof_area_sqm: 1500,
      operating_hours: 4000,
      working_days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    });
    expect(result.latitude).toBe(45.4642);
    expect(result.working_days).toHaveLength(5);
  });

  it("rejects empty name", () => {
    expectParseFailure(createSiteSchema, { organization_id: VALID_UUID, name: "" });
  });

  it("rejects latitude out of range (-90, 90)", () => {
    expectParseFailure(createSiteSchema, { ...validSite, latitude: 91 });
    expectParseFailure(createSiteSchema, { ...validSite, latitude: -91 });
  });

  it("rejects longitude out of range (-180, 180)", () => {
    expectParseFailure(createSiteSchema, { ...validSite, longitude: 181 });
    expectParseFailure(createSiteSchema, { ...validSite, longitude: -181 });
  });

  it("rejects negative employees", () => {
    expectParseFailure(createSiteSchema, { ...validSite, employees: -5 });
  });

  it("rejects operating_hours > 8760", () => {
    expectParseFailure(createSiteSchema, { ...validSite, operating_hours: 9000 });
  });

  it("rejects negative area_sqm", () => {
    expectParseFailure(createSiteSchema, { ...validSite, area_sqm: -100 });
  });

  it("allows null optional fields", () => {
    const result = expectParseSuccess(createSiteSchema, {
      ...validSite,
      address: null,
      city: null,
      latitude: null,
    });
    expect(result.address).toBeNull();
  });

  it("coerces string numbers to numbers", () => {
    const result = expectParseSuccess(createSiteSchema, {
      ...validSite,
      latitude: "45.123",
      employees: "10",
    });
    expect(result.latitude).toBe(45.123);
    expect(result.employees).toBe(10);
  });
});

describe("updateSiteSchema", () => {
  it("allows partial update without organization_id", () => {
    const result = expectParseSuccess(updateSiteSchema, { name: "New Name" });
    expect(result.name).toBe("New Name");
  });

  it("allows empty object", () => {
    const result = expectParseSuccess(updateSiteSchema, {});
    expect(result).toEqual({});
  });
});

// ===========================================================================
// Analyses
// ===========================================================================

describe("createAnalysisSchema", () => {
  const validAnalysis = {
    site_id: VALID_UUID,
    organization_id: VALID_UUID_2,
    name: "Audit 2024",
    year: 2024,
  };

  it("parses a minimal valid analysis", () => {
    const result = expectParseSuccess(createAnalysisSchema, validAnalysis);
    expect(result.name).toBe("Audit 2024");
    expect(result.year).toBe(2024);
  });

  it("parses with optional fields", () => {
    const result = expectParseSuccess(createAnalysisSchema, {
      ...validAnalysis,
      description: "Annual energy audit",
      wacc: 0.07,
    });
    expect(result.wacc).toBe(0.07);
  });

  it("rejects year < 2020", () => {
    expectParseFailure(createAnalysisSchema, { ...validAnalysis, year: 2019 });
  });

  it("rejects year > 2050", () => {
    expectParseFailure(createAnalysisSchema, { ...validAnalysis, year: 2051 });
  });

  it("rejects wacc > 1", () => {
    expectParseFailure(createAnalysisSchema, { ...validAnalysis, wacc: 1.5 });
  });

  it("rejects wacc < 0", () => {
    expectParseFailure(createAnalysisSchema, { ...validAnalysis, wacc: -0.1 });
  });

  it("rejects empty name", () => {
    expectParseFailure(createAnalysisSchema, { ...validAnalysis, name: "" });
  });

  it("rejects non-uuid site_id", () => {
    expectParseFailure(createAnalysisSchema, { ...validAnalysis, site_id: "abc" });
  });

  it("coerces string year to number", () => {
    const result = expectParseSuccess(createAnalysisSchema, {
      ...validAnalysis,
      year: "2025",
    });
    expect(result.year).toBe(2025);
  });
});

describe("updateAnalysisSchema", () => {
  it("allows partial fields", () => {
    const result = expectParseSuccess(updateAnalysisSchema, { name: "Updated" });
    expect(result.name).toBe("Updated");
  });

  it("does not require site_id or organization_id", () => {
    const result = expectParseSuccess(updateAnalysisSchema, { year: 2025 });
    expect(result.year).toBe(2025);
  });
});

// ===========================================================================
// Demands
// ===========================================================================

describe("createDemandSchema", () => {
  const validDemand = {
    analysis_id: VALID_UUID,
    end_use: "ELECTRICITY" as const,
    annual_consumption_mwh: 120.5,
  };

  it("parses a valid demand", () => {
    const result = expectParseSuccess(createDemandSchema, validDemand);
    expect(result.end_use).toBe("ELECTRICITY");
    expect(result.profile_type).toBe("nace_default"); // default
  });

  it("accepts all end_use values", () => {
    const endUses = ["ELECTRICITY", "HEAT_HIGH_T", "HEAT_MED_T", "HEAT_LOW_T", "COLD"] as const;
    for (const endUse of endUses) {
      const result = expectParseSuccess(createDemandSchema, { ...validDemand, end_use: endUse });
      expect(result.end_use).toBe(endUse);
    }
  });

  it("accepts all profile_type values", () => {
    const types = ["nace_default", "custom", "upload"] as const;
    for (const pt of types) {
      const result = expectParseSuccess(createDemandSchema, { ...validDemand, profile_type: pt });
      expect(result.profile_type).toBe(pt);
    }
  });

  it("rejects invalid end_use", () => {
    expectParseFailure(createDemandSchema, { ...validDemand, end_use: "STEAM" });
  });

  it("rejects negative consumption", () => {
    expectParseFailure(createDemandSchema, { ...validDemand, annual_consumption_mwh: -10 });
  });

  it("accepts hourly_profile with 8760 values", () => {
    const profile = new Array(8760).fill(0.5);
    const result = expectParseSuccess(createDemandSchema, {
      ...validDemand,
      hourly_profile: profile,
    });
    expect(result.hourly_profile).toHaveLength(8760);
  });

  it("rejects hourly_profile with wrong length", () => {
    expectParseFailure(createDemandSchema, {
      ...validDemand,
      hourly_profile: [1, 2, 3], // wrong length
    });
  });

  it("allows zero consumption", () => {
    const result = expectParseSuccess(createDemandSchema, {
      ...validDemand,
      annual_consumption_mwh: 0,
    });
    expect(result.annual_consumption_mwh).toBe(0);
  });
});

// ===========================================================================
// Resources
// ===========================================================================

describe("createResourceSchema", () => {
  const validResource = {
    analysis_id: VALID_UUID,
    resource_type: "natural_gas" as const,
  };

  it("parses a minimal valid resource", () => {
    const result = expectParseSuccess(createResourceSchema, validResource);
    expect(result.resource_type).toBe("natural_gas");
  });

  it("parses with optional prices", () => {
    const result = expectParseSuccess(createResourceSchema, {
      ...validResource,
      buying_price: 0.12,
      selling_price: 0.08,
      co2_factor: 0.233,
      max_availability: 10000,
    });
    expect(result.buying_price).toBe(0.12);
  });

  it("accepts all resource types", () => {
    const types = [
      "electricity", "natural_gas", "biomass", "diesel",
      "lpg", "solar", "wind", "hydrogen",
    ] as const;
    for (const rt of types) {
      const result = expectParseSuccess(createResourceSchema, {
        ...validResource,
        resource_type: rt,
      });
      expect(result.resource_type).toBe(rt);
    }
  });

  it("rejects invalid resource_type", () => {
    expectParseFailure(createResourceSchema, {
      ...validResource,
      resource_type: "coal",
    });
  });

  it("rejects negative buying_price", () => {
    expectParseFailure(createResourceSchema, { ...validResource, buying_price: -1 });
  });
});

// ===========================================================================
// Technologies
// ===========================================================================

describe("addAnalysisTechSchema", () => {
  const validTech = {
    analysis_id: VALID_UUID,
    technology_id: VALID_UUID_2,
    installed_capacity_kw: 100,
  };

  it("parses valid tech with defaults", () => {
    const result = expectParseSuccess(addAnalysisTechSchema, validTech);
    expect(result.is_existing).toBe(false); // default
    expect(result.installed_capacity_kw).toBe(100);
  });

  it("allows is_existing = true", () => {
    const result = expectParseSuccess(addAnalysisTechSchema, {
      ...validTech,
      is_existing: true,
    });
    expect(result.is_existing).toBe(true);
  });

  it("rejects negative capacity", () => {
    expectParseFailure(addAnalysisTechSchema, {
      ...validTech,
      installed_capacity_kw: -50,
    });
  });

  it("rejects non-uuid technology_id", () => {
    expectParseFailure(addAnalysisTechSchema, {
      ...validTech,
      technology_id: "not-uuid",
    });
  });

  it("coerces string capacity to number", () => {
    const result = expectParseSuccess(addAnalysisTechSchema, {
      ...validTech,
      installed_capacity_kw: "200",
    });
    expect(result.installed_capacity_kw).toBe(200);
  });
});

describe("updateAnalysisTechSchema", () => {
  it("allows partial update", () => {
    const result = expectParseSuccess(updateAnalysisTechSchema, {
      installed_capacity_kw: 150,
    });
    expect(result.installed_capacity_kw).toBe(150);
  });
});

// ===========================================================================
// Storage
// ===========================================================================

describe("createStorageSchema", () => {
  const validStorage = {
    analysis_id: VALID_UUID,
    storage_type: "battery_lion" as const,
    capacity_kwh: 500,
  };

  it("parses a minimal valid storage", () => {
    const result = expectParseSuccess(createStorageSchema, validStorage);
    expect(result.storage_type).toBe("battery_lion");
    expect(result.capacity_kwh).toBe(500);
  });

  it("parses with full optional fields", () => {
    const result = expectParseSuccess(createStorageSchema, {
      ...validStorage,
      max_charge_kw: 100,
      max_discharge_kw: 100,
      charge_efficiency: 0.95,
      discharge_efficiency: 0.9,
      self_discharge_rate: 0.001,
      capex_per_kwh: 250,
      cycles_lifetime: 5000,
      min_soc: 0.1,
      max_soc: 0.9,
    });
    expect(result.charge_efficiency).toBe(0.95);
  });

  it("accepts all storage types", () => {
    const types = ["battery_lion", "thermal_hot", "thermal_cold"] as const;
    for (const st of types) {
      const result = expectParseSuccess(createStorageSchema, {
        ...validStorage,
        storage_type: st,
      });
      expect(result.storage_type).toBe(st);
    }
  });

  it("rejects zero capacity (must be positive)", () => {
    expectParseFailure(createStorageSchema, { ...validStorage, capacity_kwh: 0 });
  });

  it("rejects negative capacity", () => {
    expectParseFailure(createStorageSchema, { ...validStorage, capacity_kwh: -10 });
  });

  it("rejects charge_efficiency > 1", () => {
    expectParseFailure(createStorageSchema, {
      ...validStorage,
      charge_efficiency: 1.1,
    });
  });

  it("rejects min_soc > 1", () => {
    expectParseFailure(createStorageSchema, { ...validStorage, min_soc: 1.5 });
  });

  it("rejects invalid storage_type", () => {
    expectParseFailure(createStorageSchema, {
      ...validStorage,
      storage_type: "flywheel",
    });
  });
});

// ===========================================================================
// Lighting
// ===========================================================================

describe("createLightingZoneSchema", () => {
  const validZone = {
    analysis_id: VALID_UUID,
    zone_name: "Uffici Piano 1",
  };

  it("parses a minimal valid zone", () => {
    const result = expectParseSuccess(createLightingZoneSchema, validZone);
    expect(result.zone_name).toBe("Uffici Piano 1");
  });

  it("parses with all optional fields", () => {
    const result = expectParseSuccess(createLightingZoneSchema, {
      ...validZone,
      area_sqm: 200,
      current_fixture_type: "LED",
      current_wattage: 40,
      fixture_count: 50,
      operating_hours_year: 2500,
      lux_level: 500,
      relamping_fixture_type: "LED",
      relamping_wattage: 20,
      relamping_fixture_count: 50,
    });
    expect(result.fixture_count).toBe(50);
  });

  it("rejects empty zone_name", () => {
    expectParseFailure(createLightingZoneSchema, { ...validZone, zone_name: "" });
  });

  it("rejects operating_hours_year > 8760", () => {
    expectParseFailure(createLightingZoneSchema, {
      ...validZone,
      operating_hours_year: 9000,
    });
  });

  it("rejects negative wattage", () => {
    expectParseFailure(createLightingZoneSchema, {
      ...validZone,
      current_wattage: -10,
    });
  });
});

// ===========================================================================
// Files
// ===========================================================================

describe("registerFileSchema", () => {
  const validFile = {
    organization_id: VALID_UUID,
    file_name: "report.pdf",
    mime_type: "application/pdf",
    size_bytes: 1024000,
    storage_key: "orgs/abc/reports/report.pdf",
  };

  it("parses a valid file registration", () => {
    const result = expectParseSuccess(registerFileSchema, validFile);
    expect(result.file_name).toBe("report.pdf");
    expect(result.size_bytes).toBe(1024000);
  });

  it("accepts optional analysis_id", () => {
    const result = expectParseSuccess(registerFileSchema, {
      ...validFile,
      analysis_id: VALID_UUID_2,
    });
    expect(result.analysis_id).toBe(VALID_UUID_2);
  });

  it("accepts null analysis_id", () => {
    const result = expectParseSuccess(registerFileSchema, {
      ...validFile,
      analysis_id: null,
    });
    expect(result.analysis_id).toBeNull();
  });

  it("rejects empty file_name", () => {
    expectParseFailure(registerFileSchema, { ...validFile, file_name: "" });
  });

  it("rejects negative size_bytes", () => {
    expectParseFailure(registerFileSchema, { ...validFile, size_bytes: -1 });
  });

  it("rejects empty storage_key", () => {
    expectParseFailure(registerFileSchema, { ...validFile, storage_key: "" });
  });
});

// ===========================================================================
// Scenarios
// ===========================================================================

describe("createScenarioSchema", () => {
  const validScenario = {
    analysis_id: VALID_UUID,
    name: "Scenario Base",
  };

  it("parses a minimal valid scenario", () => {
    const result = expectParseSuccess(createScenarioSchema, validScenario);
    expect(result.name).toBe("Scenario Base");
    expect(result.objective).toBe("cost"); // default
  });

  it("parses with all optional fields", () => {
    const result = expectParseSuccess(createScenarioSchema, {
      ...validScenario,
      description: "Test scenario",
      objective: "decarbonization",
      co2_target: 0.5,
      budget_limit: 100000,
    });
    expect(result.objective).toBe("decarbonization");
    expect(result.co2_target).toBe(0.5);
  });

  it("rejects co2_target > 1", () => {
    expectParseFailure(createScenarioSchema, { ...validScenario, co2_target: 1.5 });
  });

  it("rejects co2_target < 0", () => {
    expectParseFailure(createScenarioSchema, { ...validScenario, co2_target: -0.1 });
  });

  it("rejects negative budget_limit", () => {
    expectParseFailure(createScenarioSchema, { ...validScenario, budget_limit: -1000 });
  });

  it("rejects invalid objective", () => {
    expectParseFailure(createScenarioSchema, { ...validScenario, objective: "speed" });
  });

  it("rejects empty name", () => {
    expectParseFailure(createScenarioSchema, { ...validScenario, name: "" });
  });

  it("rejects name > 255 chars", () => {
    expectParseFailure(createScenarioSchema, {
      ...validScenario,
      name: "a".repeat(256),
    });
  });
});

describe("createScenarioTechConfigSchema", () => {
  const validConfig = {
    scenario_id: VALID_UUID,
    technology_id: VALID_UUID_2,
  };

  it("parses with defaults", () => {
    const result = expectParseSuccess(createScenarioTechConfigSchema, validConfig);
    expect(result.force_include).toBe(false);
  });

  it("parses with all optional fields", () => {
    const result = expectParseSuccess(createScenarioTechConfigSchema, {
      ...validConfig,
      min_capacity_kw: 10,
      max_capacity_kw: 500,
      force_include: true,
    });
    expect(result.force_include).toBe(true);
    expect(result.max_capacity_kw).toBe(500);
  });

  it("rejects negative min_capacity_kw", () => {
    expectParseFailure(createScenarioTechConfigSchema, {
      ...validConfig,
      min_capacity_kw: -10,
    });
  });
});

describe("updateScenarioSchema", () => {
  it("allows partial update", () => {
    const result = expectParseSuccess(updateScenarioSchema, { name: "Updated" });
    expect(result.name).toBe("Updated");
  });
});

// ===========================================================================
// Wizard
// ===========================================================================

describe("wizardStep1Schema", () => {
  const valid = {
    name: "Analisi 2024",
    site_id: VALID_UUID,
    year: 2024,
  };

  it("parses valid step 1", () => {
    const result = expectParseSuccess(wizardStep1Schema, valid);
    expect(result.name).toBe("Analisi 2024");
  });

  it("accepts optional wacc and description", () => {
    const result = expectParseSuccess(wizardStep1Schema, {
      ...valid,
      wacc: 0.07,
      description: "Test description",
    });
    expect(result.wacc).toBe(0.07);
  });

  it("rejects year before 2020", () => {
    expectParseFailure(wizardStep1Schema, { ...valid, year: 2019 });
  });

  it("rejects empty name", () => {
    expectParseFailure(wizardStep1Schema, { ...valid, name: "" });
  });

  it("rejects non-uuid site_id", () => {
    expectParseFailure(wizardStep1Schema, { ...valid, site_id: "abc" });
  });
});

describe("wizardStep2Schema", () => {
  it("parses valid step 2 with one demand", () => {
    const result = expectParseSuccess(wizardStep2Schema, {
      demands: [{ end_use: "ELECTRICITY", annual_consumption_mwh: 100 }],
    });
    expect(result.demands).toHaveLength(1);
    expect(result.demands[0].profile_type).toBe("nace_default");
  });

  it("parses valid step 2 with multiple demands", () => {
    const result = expectParseSuccess(wizardStep2Schema, {
      demands: [
        { end_use: "ELECTRICITY", annual_consumption_mwh: 100 },
        { end_use: "HEAT_LOW_T", annual_consumption_mwh: 50 },
      ],
    });
    expect(result.demands).toHaveLength(2);
  });

  it("rejects empty demands array", () => {
    expectParseFailure(wizardStep2Schema, { demands: [] });
  });

  it("rejects missing demands", () => {
    expectParseFailure(wizardStep2Schema, {});
  });
});

describe("wizardStep3Schema", () => {
  it("parses with default empty array", () => {
    const result = expectParseSuccess(wizardStep3Schema, {});
    expect(result.lighting_zones).toEqual([]);
  });

  it("parses with lighting zones", () => {
    const result = expectParseSuccess(wizardStep3Schema, {
      lighting_zones: [
        { name: "Uffici", area_m2: 200, operating_hours: 2500 },
      ],
    });
    expect(result.lighting_zones).toHaveLength(1);
  });

  it("rejects zone with empty name", () => {
    expectParseFailure(wizardStep3Schema, {
      lighting_zones: [{ name: "" }],
    });
  });
});

describe("wizardStep4Schema", () => {
  it("parses valid step 4 with technologies", () => {
    const result = expectParseSuccess(wizardStep4Schema, {
      technologies: [
        { technology_id: VALID_UUID, installed_capacity_kw: 100 },
      ],
    });
    expect(result.technologies).toHaveLength(1);
    expect(result.technologies[0].is_existing).toBe(false); // default
  });

  it("rejects empty technologies array", () => {
    expectParseFailure(wizardStep4Schema, { technologies: [] });
  });
});

describe("wizardStep5Schema", () => {
  it("parses with defaults", () => {
    const result = expectParseSuccess(wizardStep5Schema, {});
    expect(result.objective).toBe("cost");
    expect(result.scenario_name).toBe("Scenario Base");
  });

  it("parses with custom values", () => {
    const result = expectParseSuccess(wizardStep5Schema, {
      objective: "decarbonization",
      scenario_name: "Net Zero",
      co2_target: 0.8,
      budget_limit: 500000,
    });
    expect(result.objective).toBe("decarbonization");
    expect(result.scenario_name).toBe("Net Zero");
  });

  it("rejects empty scenario_name", () => {
    expectParseFailure(wizardStep5Schema, { scenario_name: "" });
  });
});

describe("wizardDemandItemSchema", () => {
  it("parses valid demand item", () => {
    const result = expectParseSuccess(wizardDemandItemSchema, {
      end_use: "COLD",
      annual_consumption_mwh: 75,
    });
    expect(result.end_use).toBe("COLD");
  });

  it("rejects missing end_use", () => {
    expectParseFailure(wizardDemandItemSchema, {
      annual_consumption_mwh: 100,
    });
  });
});

describe("wizardLightingZoneSchema", () => {
  it("parses valid lighting zone", () => {
    const result = expectParseSuccess(wizardLightingZoneSchema, {
      name: "Magazzino",
      area_m2: 500,
    });
    expect(result.name).toBe("Magazzino");
  });

  it("rejects empty name", () => {
    expectParseFailure(wizardLightingZoneSchema, { name: "" });
  });

  it("rejects negative area", () => {
    expectParseFailure(wizardLightingZoneSchema, { name: "Test", area_m2: -10 });
  });

  it("rejects negative operating_hours", () => {
    expectParseFailure(wizardLightingZoneSchema, {
      name: "Test",
      operating_hours: -1,
    });
  });
});

describe("wizardTechItemSchema", () => {
  it("parses valid tech item with defaults", () => {
    const result = expectParseSuccess(wizardTechItemSchema, {
      technology_id: VALID_UUID,
    });
    expect(result.installed_capacity_kw).toBe(0); // default
    expect(result.is_existing).toBe(false); // default
  });

  it("rejects non-uuid technology_id", () => {
    expectParseFailure(wizardTechItemSchema, { technology_id: "abc" });
  });

  it("rejects negative capacity", () => {
    expectParseFailure(wizardTechItemSchema, {
      technology_id: VALID_UUID,
      installed_capacity_kw: -10,
    });
  });
});
