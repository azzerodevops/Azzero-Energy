import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  numeric,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { analyses } from "./analyses";

// --- Enums ---

export const storageTypeEnum = pgEnum("storage_type", [
  "battery_lion",
  "thermal_hot",
  "thermal_cold",
]);

// --- Storage Systems ---

export const storageSystems = pgTable("storage_systems", {
  id: uuid("id").primaryKey().defaultRandom(),
  analysisId: uuid("analysis_id")
    .references(() => analyses.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 255 }),
  storageType: storageTypeEnum("storage_type").notNull(),
  capacityKwh: numeric("capacity_kwh", { precision: 12, scale: 2 }),
  maxChargeKw: numeric("max_charge_kw", { precision: 10, scale: 2 }),
  maxDischargeKw: numeric("max_discharge_kw", { precision: 10, scale: 2 }),
  chargeEfficiency: numeric("charge_efficiency", { precision: 5, scale: 4 }),
  dischargeEfficiency: numeric("discharge_efficiency", {
    precision: 5,
    scale: 4,
  }),
  selfDischargeRate: numeric("self_discharge_rate", {
    precision: 5,
    scale: 4,
  }),
  capexPerKwh: numeric("capex_per_kwh", { precision: 10, scale: 2 }),
  cyclesLifetime: integer("cycles_lifetime"),
  minSoc: numeric("min_soc", { precision: 5, scale: 4 }),
  maxSoc: numeric("max_soc", { precision: 5, scale: 4 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
