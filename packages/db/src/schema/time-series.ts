import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { analyses } from "./analyses";

// --- Time Series ---

export const timeSeries = pgTable("time_series", {
  id: uuid("id").primaryKey().defaultRandom(),
  analysisId: uuid("analysis_id")
    .references(() => analyses.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 255 }),
  seriesType: varchar("series_type", { length: 50 }), // e.g. "load", "generation", "price"
  data: jsonb("data").$type<number[]>(), // 8760 values
  unit: varchar("unit", { length: 20 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
