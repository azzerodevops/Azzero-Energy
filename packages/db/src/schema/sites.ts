import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  numeric,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

// --- Sites / Locations ---

export const sites = pgTable("sites", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .references(() => organizations.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  address: varchar("address", { length: 500 }),
  city: varchar("city", { length: 255 }),
  province: varchar("province", { length: 100 }),
  country: varchar("country", { length: 100 }).default("Italia"),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  naceCode: varchar("nace_code", { length: 10 }),
  sector: varchar("sector", { length: 255 }),
  employees: integer("employees"),
  areaSqm: numeric("area_sqm", { precision: 12, scale: 2 }),
  roofAreaSqm: numeric("roof_area_sqm", { precision: 12, scale: 2 }),
  operatingHours: integer("operating_hours"),
  workingDays: jsonb("working_days").$type<string[]>(),
  satelliteImageUrl: text("satellite_image_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
