import { pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workspaces = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .references(() => organizations.id)
    .notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const roles = pgTable("roles", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

export const organizationMembers = pgTable(
  "organization_members",
  {
    userId: text("user_id").notNull(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id)
      .notNull(),
    roleId: text("role_id")
      .references(() => roles.id)
      .notNull(),
    joinedAt: timestamp("joined_at").defaultNow(),
  },
  (t) => ({
    pk: primaryKey(t.userId, t.organizationId),
  })
);
