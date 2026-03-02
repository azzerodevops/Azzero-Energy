import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  pgEnum,
} from "drizzle-orm/pg-core";
import { analyses } from "./analyses";

// --- Enums ---

export const resourceTypeEnum = pgEnum("resource_type", [
  "electricity",
  "natural_gas",
  "biomass",
  "diesel",
  "lpg",
  "solar",
  "wind",
  "hydrogen",
]);

// --- Analysis Resources ---

export const analysisResources = pgTable("analysis_resources", {
  id: uuid("id").primaryKey().defaultRandom(),
  analysisId: uuid("analysis_id")
    .references(() => analyses.id, { onDelete: "cascade" })
    .notNull(),
  resourceType: resourceTypeEnum("resource_type").notNull(),
  buyingPrice: numeric("buying_price", { precision: 10, scale: 4 }), // EUR/MWh
  sellingPrice: numeric("selling_price", { precision: 10, scale: 4 }),
  co2Factor: numeric("co2_factor", { precision: 8, scale: 6 }), // tCO2/MWh
  maxAvailability: numeric("max_availability", {
    precision: 12,
    scale: 4,
  }), // MWh/year
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
