import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { organizations, users } from "./organizations";
import { analyses } from "./analyses";
import { scenarios } from "./scenarios";

// --- Enums ---

export const reportFormatEnum = pgEnum("report_format", [
  "pdf",
  "docx",
  "xlsx",
  "pptx",
]);

// --- Reports ---

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  analysisId: uuid("analysis_id")
    .references(() => analyses.id, { onDelete: "cascade" })
    .notNull(),
  scenarioId: uuid("scenario_id").references(() => scenarios.id, {
    onDelete: "set null",
  }),
  name: varchar("name", { length: 255 }).notNull(),
  format: reportFormatEnum("format").notNull(),
  fileUrl: text("file_url"),
  generatedBy: uuid("generated_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// --- Files (Supabase Storage references) ---

export const files = pgTable("files", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .references(() => organizations.id, { onDelete: "cascade" })
    .notNull(),
  analysisId: uuid("analysis_id").references(() => analyses.id, {
    onDelete: "set null",
  }),
  name: varchar("name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }),
  sizeBytes: integer("size_bytes"),
  storageKey: text("storage_key").notNull(), // Supabase Storage key
  uploadedBy: uuid("uploaded_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
