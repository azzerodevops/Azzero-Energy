import { describe, it, expect } from "vitest";
import {
  createSiteSchema,
  createAnalysisSchema,
  createScenarioSchema,
  createScenarioTechConfigSchema,
  createDemandSchema,
  createResourceSchema,
  createStorageSchema,
  createLightingZoneSchema,
  addAnalysisTechSchema,
  registerFileSchema,
  scenarioStatusValues,
} from "../validators";

// ===========================================================================
// Schema Alignment Tests
// ===========================================================================
// These tests verify that Zod validators cover the required fields that
// correspond to NOT NULL / required columns in the Drizzle ORM DB schema.
// This serves as a documentation and consistency check: if the DB schema
// changes, these tests should be updated accordingly.
//
// DB schema reference: packages/db/src/schema/
// ===========================================================================

/** Extract the top-level keys from a Zod object schema's shape */
function getSchemaKeys(schema: { shape: Record<string, unknown> }): string[] {
  return Object.keys(schema.shape).sort();
}

// ---------------------------------------------------------------------------
// Sites: createSiteSchema vs DB sites table
// ---------------------------------------------------------------------------

describe("createSiteSchema aligns with sites table", () => {
  const keys = getSchemaKeys(createSiteSchema);

  it("has organization_id (maps to sites.organization_id NOT NULL)", () => {
    expect(keys).toContain("organization_id");
  });

  it("has name (maps to sites.name NOT NULL)", () => {
    expect(keys).toContain("name");
  });

  it("has address, city, province, country (nullable in DB)", () => {
    expect(keys).toContain("address");
    expect(keys).toContain("city");
    expect(keys).toContain("province");
    expect(keys).toContain("country");
  });

  it("has latitude and longitude (numeric, nullable in DB)", () => {
    expect(keys).toContain("latitude");
    expect(keys).toContain("longitude");
  });

  it("has nace_code, sector (varchar, nullable in DB)", () => {
    expect(keys).toContain("nace_code");
    expect(keys).toContain("sector");
  });

  it("has employees, area_sqm, roof_area_sqm, operating_hours (nullable in DB)", () => {
    expect(keys).toContain("employees");
    expect(keys).toContain("area_sqm");
    expect(keys).toContain("roof_area_sqm");
    expect(keys).toContain("operating_hours");
  });

  it("has working_days (jsonb, nullable in DB)", () => {
    expect(keys).toContain("working_days");
  });

  it("does NOT include auto-generated DB fields (id, created_at, updated_at, satellite_image_url)", () => {
    expect(keys).not.toContain("id");
    expect(keys).not.toContain("created_at");
    expect(keys).not.toContain("updated_at");
    expect(keys).not.toContain("satellite_image_url");
  });
});

// ---------------------------------------------------------------------------
// Analyses: createAnalysisSchema vs DB analyses table
// ---------------------------------------------------------------------------

describe("createAnalysisSchema aligns with analyses table", () => {
  const keys = getSchemaKeys(createAnalysisSchema);

  it("has site_id (maps to analyses.site_id NOT NULL)", () => {
    expect(keys).toContain("site_id");
  });

  it("has organization_id (maps to analyses.organization_id NOT NULL)", () => {
    expect(keys).toContain("organization_id");
  });

  it("has name (maps to analyses.name NOT NULL)", () => {
    expect(keys).toContain("name");
  });

  it("has year (maps to analyses.year NOT NULL)", () => {
    expect(keys).toContain("year");
  });

  it("has optional description and wacc", () => {
    expect(keys).toContain("description");
    expect(keys).toContain("wacc");
  });

  it("does NOT include auto-generated fields (id, status, wizard_completed, created_by, created_at, updated_at)", () => {
    expect(keys).not.toContain("id");
    expect(keys).not.toContain("status");
    expect(keys).not.toContain("wizard_completed");
    expect(keys).not.toContain("created_by");
    expect(keys).not.toContain("created_at");
    expect(keys).not.toContain("updated_at");
  });
});

// ---------------------------------------------------------------------------
// Scenarios: createScenarioSchema vs DB scenarios table
// ---------------------------------------------------------------------------

describe("createScenarioSchema aligns with scenarios table", () => {
  const keys = getSchemaKeys(createScenarioSchema);

  it("has analysis_id (maps to scenarios.analysis_id NOT NULL)", () => {
    expect(keys).toContain("analysis_id");
  });

  it("has name (maps to scenarios.name NOT NULL)", () => {
    expect(keys).toContain("name");
  });

  it("has objective with default 'cost' (maps to scenarios.objective)", () => {
    expect(keys).toContain("objective");
  });

  it("has optional co2_target and budget_limit", () => {
    expect(keys).toContain("co2_target");
    expect(keys).toContain("budget_limit");
  });

  it("has optional description", () => {
    expect(keys).toContain("description");
  });

  it("does NOT include auto-generated fields (id, status, created_by, created_at, updated_at)", () => {
    expect(keys).not.toContain("id");
    expect(keys).not.toContain("status");
    expect(keys).not.toContain("created_by");
    expect(keys).not.toContain("created_at");
    expect(keys).not.toContain("updated_at");
  });
});

// ---------------------------------------------------------------------------
// Scenario status values match DB enum
// ---------------------------------------------------------------------------

describe("scenarioStatusValues matches DB enum", () => {
  it("contains all 6 statuses matching scenarioStatusEnum in DB", () => {
    // DB: pgEnum("scenario_status", ["draft","queued","running","completed","failed","outdated"])
    const dbStatuses = ["draft", "queued", "running", "completed", "failed", "outdated"];
    expect([...scenarioStatusValues].sort()).toEqual(dbStatuses.sort());
  });
});

// ---------------------------------------------------------------------------
// ScenarioTechConfigs: createScenarioTechConfigSchema
// ---------------------------------------------------------------------------

describe("createScenarioTechConfigSchema aligns with scenario_tech_configs table", () => {
  const keys = getSchemaKeys(createScenarioTechConfigSchema);

  it("has scenario_id and technology_id (both NOT NULL in DB)", () => {
    expect(keys).toContain("scenario_id");
    expect(keys).toContain("technology_id");
  });

  it("has optional min_capacity_kw and max_capacity_kw", () => {
    expect(keys).toContain("min_capacity_kw");
    expect(keys).toContain("max_capacity_kw");
  });

  it("has force_include with default false", () => {
    expect(keys).toContain("force_include");
  });
});

// ---------------------------------------------------------------------------
// Demands: createDemandSchema vs DB demands table
// ---------------------------------------------------------------------------

describe("createDemandSchema aligns with demands table", () => {
  const keys = getSchemaKeys(createDemandSchema);

  it("has analysis_id (maps to demands.analysis_id NOT NULL)", () => {
    expect(keys).toContain("analysis_id");
  });

  it("has end_use (maps to demands.end_use NOT NULL)", () => {
    expect(keys).toContain("end_use");
  });

  it("has annual_consumption_mwh", () => {
    expect(keys).toContain("annual_consumption_mwh");
  });

  it("has profile_type with default nace_default", () => {
    expect(keys).toContain("profile_type");
  });

  it("has optional hourly_profile (jsonb in DB)", () => {
    expect(keys).toContain("hourly_profile");
  });

  it("does NOT include auto-generated DB fields", () => {
    expect(keys).not.toContain("id");
    expect(keys).not.toContain("created_at");
    expect(keys).not.toContain("updated_at");
  });
});

// ---------------------------------------------------------------------------
// Resources: createResourceSchema
// ---------------------------------------------------------------------------

describe("createResourceSchema aligns with resources table", () => {
  const keys = getSchemaKeys(createResourceSchema);

  it("has analysis_id", () => {
    expect(keys).toContain("analysis_id");
  });

  it("has resource_type", () => {
    expect(keys).toContain("resource_type");
  });

  it("has optional price and factor fields", () => {
    expect(keys).toContain("buying_price");
    expect(keys).toContain("selling_price");
    expect(keys).toContain("co2_factor");
    expect(keys).toContain("max_availability");
  });
});

// ---------------------------------------------------------------------------
// Storage: createStorageSchema
// ---------------------------------------------------------------------------

describe("createStorageSchema aligns with storage table", () => {
  const keys = getSchemaKeys(createStorageSchema);

  it("has analysis_id and storage_type", () => {
    expect(keys).toContain("analysis_id");
    expect(keys).toContain("storage_type");
  });

  it("has capacity_kwh (required)", () => {
    expect(keys).toContain("capacity_kwh");
  });

  it("has optional efficiency and cost fields", () => {
    expect(keys).toContain("charge_efficiency");
    expect(keys).toContain("discharge_efficiency");
    expect(keys).toContain("self_discharge_rate");
    expect(keys).toContain("capex_per_kwh");
    expect(keys).toContain("cycles_lifetime");
    expect(keys).toContain("min_soc");
    expect(keys).toContain("max_soc");
  });
});

// ---------------------------------------------------------------------------
// Lighting: createLightingZoneSchema
// ---------------------------------------------------------------------------

describe("createLightingZoneSchema aligns with lighting_zones table", () => {
  const keys = getSchemaKeys(createLightingZoneSchema);

  it("has analysis_id", () => {
    expect(keys).toContain("analysis_id");
  });

  it("has zone_name", () => {
    expect(keys).toContain("zone_name");
  });

  it("has area_sqm and fixture fields", () => {
    expect(keys).toContain("area_sqm");
    expect(keys).toContain("current_fixture_type");
    expect(keys).toContain("fixture_count");
    expect(keys).toContain("current_wattage");
    expect(keys).toContain("operating_hours_year");
  });

  it("has relamping fields", () => {
    expect(keys).toContain("lux_level");
    expect(keys).toContain("relamping_fixture_type");
    expect(keys).toContain("relamping_wattage");
    expect(keys).toContain("relamping_fixture_count");
  });
});

// ---------------------------------------------------------------------------
// Technologies: addAnalysisTechSchema
// ---------------------------------------------------------------------------

describe("addAnalysisTechSchema aligns with analysis_technologies table", () => {
  const keys = getSchemaKeys(addAnalysisTechSchema);

  it("has analysis_id and technology_id", () => {
    expect(keys).toContain("analysis_id");
    expect(keys).toContain("technology_id");
  });

  it("has installed_capacity_kw", () => {
    expect(keys).toContain("installed_capacity_kw");
  });

  it("has is_existing with default false", () => {
    expect(keys).toContain("is_existing");
  });
});

// ---------------------------------------------------------------------------
// Files: registerFileSchema
// ---------------------------------------------------------------------------

describe("registerFileSchema aligns with files table", () => {
  const keys = getSchemaKeys(registerFileSchema);

  it("has organization_id", () => {
    expect(keys).toContain("organization_id");
  });

  it("has file_name, mime_type, size_bytes, storage_key", () => {
    expect(keys).toContain("file_name");
    expect(keys).toContain("mime_type");
    expect(keys).toContain("size_bytes");
    expect(keys).toContain("storage_key");
  });

  it("has optional analysis_id", () => {
    expect(keys).toContain("analysis_id");
  });
});
