import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  primaryKey,
  pgEnum,
} from "drizzle-orm/pg-core";

// --- Enums ---

export const organizationPlanEnum = pgEnum("organization_plan", [
  "free",
  "pro",
  "enterprise",
]);

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "editor",
  "viewer",
]);

// --- Organizations ---

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  logoUrl: text("logo_url"),
  plan: organizationPlanEnum("plan").default("free").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// --- Users ---

export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // matches Supabase Auth user ID - no defaultRandom
  email: varchar("email", { length: 255 }).notNull().unique(),
  fullName: varchar("full_name", { length: 255 }),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// --- User <-> Organization (many-to-many) ---

export const userOrganizations = pgTable(
  "user_organizations",
  {
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    role: userRoleEnum("role").default("viewer").notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.organizationId] }),
  ]
);
