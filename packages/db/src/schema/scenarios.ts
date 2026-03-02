import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  numeric,
  boolean,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { users } from "./organizations";
import { analyses } from "./analyses";
import { technologyCatalog } from "./technologies";

// --- Enums ---

export const scenarioStatusEnum = pgEnum("scenario_status", [
  "draft",
  "queued",
  "running",
  "completed",
  "failed",
  "outdated",
]);

export const objectiveEnum = pgEnum("objective", [
  "cost",
  "decarbonization",
]);

// --- Scenarios ---

export const scenarios = pgTable("scenarios", {
  id: uuid("id").primaryKey().defaultRandom(),
  analysisId: uuid("analysis_id")
    .references(() => analyses.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  objective: objectiveEnum("objective").default("cost"),
  status: scenarioStatusEnum("status").default("draft").notNull(),
  errorMessage: text("error_message"),
  co2Target: numeric("co2_target", { precision: 5, scale: 4 }), // fraction 0-1
  budgetLimit: numeric("budget_limit", { precision: 14, scale: 2 }),
  createdBy: uuid("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// --- Scenario Technology Configs ---

export const scenarioTechConfigs = pgTable(
  "scenario_tech_configs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    scenarioId: uuid("scenario_id")
      .references(() => scenarios.id, { onDelete: "cascade" })
      .notNull(),
    technologyId: uuid("technology_id")
      .references(() => technologyCatalog.id, { onDelete: "cascade" })
      .notNull(),
    minCapacityKw: numeric("min_capacity_kw", { precision: 10, scale: 2 }),
    maxCapacityKw: numeric("max_capacity_kw", { precision: 10, scale: 2 }),
    forceInclude: boolean("force_include").default(false),
  },
  (table) => [unique().on(table.scenarioId, table.technologyId)]
);

// --- Scenario Results (one per scenario) ---

export const scenarioResults = pgTable(
  "scenario_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    scenarioId: uuid("scenario_id")
      .references(() => scenarios.id, { onDelete: "cascade" })
      .notNull(),
    totalCapex: numeric("total_capex", { precision: 14, scale: 2 }),
    totalOpexAnnual: numeric("total_opex_annual", {
      precision: 14,
      scale: 2,
    }),
    totalSavingsAnnual: numeric("total_savings_annual", {
      precision: 14,
      scale: 2,
    }),
    paybackYears: numeric("payback_years", { precision: 6, scale: 2 }),
    irr: numeric("irr", { precision: 6, scale: 4 }),
    npv: numeric("npv", { precision: 14, scale: 2 }),
    co2ReductionPercent: numeric("co2_reduction_percent", {
      precision: 6,
      scale: 4,
    }),
    calculatedAt: timestamp("calculated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [unique().on(table.scenarioId)]
);

// --- Technology Results (per scenario result) ---

export const techResults = pgTable("tech_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  scenarioResultId: uuid("scenario_result_id")
    .references(() => scenarioResults.id, { onDelete: "cascade" })
    .notNull(),
  technologyId: uuid("technology_id")
    .references(() => technologyCatalog.id, { onDelete: "cascade" })
    .notNull(),
  optimalCapacityKw: numeric("optimal_capacity_kw", {
    precision: 10,
    scale: 2,
  }),
  annualProductionMwh: numeric("annual_production_mwh", {
    precision: 12,
    scale: 4,
  }),
  capex: numeric("capex", { precision: 14, scale: 2 }),
  annualSavings: numeric("annual_savings", { precision: 14, scale: 2 }),
});
