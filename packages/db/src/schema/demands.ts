import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  numeric,
  integer,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { analyses } from "./analyses";

// --- Enums ---

export const endUseEnum = pgEnum("end_use", [
  "ELECTRICITY",
  "HEAT_HIGH_T",
  "HEAT_MED_T",
  "HEAT_LOW_T",
  "COLD",
]);

export const profileTypeEnum = pgEnum("profile_type", [
  "nace_default",
  "custom",
  "upload",
  "office",
  "industrial_1shift",
  "industrial_2shift",
  "industrial_3shift",
  "commercial",
  "residential",
  "flat",
]);

// --- Demands ---

export const demands = pgTable("demands", {
  id: uuid("id").primaryKey().defaultRandom(),
  analysisId: uuid("analysis_id")
    .references(() => analyses.id, { onDelete: "cascade" })
    .notNull(),
  endUse: endUseEnum("end_use").notNull(),
  annualConsumptionMwh: numeric("annual_consumption_mwh", {
    precision: 12,
    scale: 4,
  }),
  profileType: profileTypeEnum("profile_type").default("nace_default"),
  hourlyProfile: jsonb("hourly_profile").$type<number[]>(), // 8760 values
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// --- Lighting Zones ---

export const lightingZones = pgTable("lighting_zones", {
  id: uuid("id").primaryKey().defaultRandom(),
  analysisId: uuid("analysis_id")
    .references(() => analyses.id, { onDelete: "cascade" })
    .notNull(),
  zoneName: varchar("zone_name", { length: 255 }),
  areaSqm: numeric("area_sqm", { precision: 12, scale: 2 }),
  currentFixtureType: varchar("current_fixture_type", { length: 100 }),
  currentWattage: numeric("current_wattage", { precision: 10, scale: 2 }),
  fixtureCount: integer("fixture_count"),
  operatingHoursYear: integer("operating_hours_year"),
  luxLevel: numeric("lux_level", { precision: 10, scale: 2 }),
  relampingFixtureType: varchar("relamping_fixture_type", { length: 100 }),
  relampingWattage: numeric("relamping_wattage", { precision: 10, scale: 2 }),
  relampingFixtureCount: integer("relamping_fixture_count"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
