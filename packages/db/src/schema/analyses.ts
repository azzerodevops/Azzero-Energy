import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  numeric,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { organizations, users } from "./organizations";
import { sites } from "./sites";

// --- Enums ---

export const analysisStatusEnum = pgEnum("analysis_status", [
  "draft",
  "ready",
  "calculated",
]);

// --- Analyses ---

export const analyses = pgTable("analyses", {
  id: uuid("id").primaryKey().defaultRandom(),
  siteId: uuid("site_id")
    .references(() => sites.id, { onDelete: "cascade" })
    .notNull(),
  organizationId: uuid("organization_id")
    .references(() => organizations.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  year: integer("year").notNull(),
  wacc: numeric("wacc", { precision: 5, scale: 4 }),
  status: analysisStatusEnum("status").default("draft").notNull(),
  wizardCompleted: boolean("wizard_completed").default(false),
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
