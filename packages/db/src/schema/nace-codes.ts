import {
  pgTable,
  varchar,
  text,
  boolean,
} from "drizzle-orm/pg-core";

// --- NACE Codes (EU activity classification) ---

export const naceCodes = pgTable("nace_codes", {
  code: varchar("code", { length: 10 }).primaryKey(),
  description: text("description").notNull(),
  section: varchar("section", { length: 1 }).notNull(), // A-U
  isEnergyRelevant: boolean("is_energy_relevant").default(false),
});
