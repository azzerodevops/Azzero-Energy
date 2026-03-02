import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  numeric,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { analyses } from "./analyses";
import { endUseEnum } from "./demands";
import { resourceTypeEnum } from "./resources";

// --- Technology Catalog ---

export const technologyCatalog = pgTable("technology_catalog", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description"),
  capexPerKw: numeric("capex_per_kw", { precision: 10, scale: 2 }),
  maintenanceAnnualPerKw: numeric("maintenance_annual_per_kw", {
    precision: 10,
    scale: 2,
  }),
  lifetime: integer("lifetime"), // years
  capacityFactor: numeric("capacity_factor", { precision: 5, scale: 4 }),
  minSizeKw: numeric("min_size_kw", { precision: 10, scale: 2 }),
  maxSizeKw: numeric("max_size_kw", { precision: 10, scale: 2 }),
  isGlobal: boolean("is_global").default(true),
  organizationId: uuid("organization_id").references(() => organizations.id, {
    onDelete: "cascade",
  }), // null = global
  capacityUnit: varchar("capacity_unit", { length: 20 }), // e.g. "kW", "kWp", "kWth"
  icon: varchar("icon", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// --- Technology Inputs ---

export const techInputs = pgTable("tech_inputs", {
  id: uuid("id").primaryKey().defaultRandom(),
  technologyId: uuid("technology_id")
    .references(() => technologyCatalog.id, { onDelete: "cascade" })
    .notNull(),
  resourceType: resourceTypeEnum("resource_type").notNull(),
  conversionFactor: numeric("conversion_factor", { precision: 8, scale: 4 }),
});

// --- Technology Outputs ---

export const techOutputs = pgTable("tech_outputs", {
  id: uuid("id").primaryKey().defaultRandom(),
  technologyId: uuid("technology_id")
    .references(() => technologyCatalog.id, { onDelete: "cascade" })
    .notNull(),
  endUse: endUseEnum("end_use").notNull(),
  conversionFactor: numeric("conversion_factor", { precision: 8, scale: 4 }),
});

// --- Analysis Technologies (installed/candidate in an analysis) ---

export const analysisTechnologies = pgTable("analysis_technologies", {
  id: uuid("id").primaryKey().defaultRandom(),
  analysisId: uuid("analysis_id")
    .references(() => analyses.id, { onDelete: "cascade" })
    .notNull(),
  technologyId: uuid("technology_id")
    .references(() => technologyCatalog.id, { onDelete: "cascade" })
    .notNull(),
  installedCapacityKw: numeric("installed_capacity_kw", {
    precision: 10,
    scale: 2,
  }),
  isExisting: boolean("is_existing").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
