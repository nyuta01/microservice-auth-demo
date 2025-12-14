import { pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

// ------------------------------------------------
// Organizations (Tenant)
// ------------------------------------------------
export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ------------------------------------------------
// Workspaces (Sub-division)
// ------------------------------------------------
export const workspaces = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .references(() => organizations.id)
    .notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ------------------------------------------------
// Roles
// ------------------------------------------------
export const roles = pgTable("roles", {
  id: text("id").primaryKey(), // 'workspace:admin', 'workspace:member', 'org:admin', etc.
  name: text("name").notNull(),
});

// ------------------------------------------------
// Permissions
// ------------------------------------------------
export const permissions = pgTable("permissions", {
  id: text("id").primaryKey(), // 'order:read', 'order:write'
  description: text("description"),
});

// ------------------------------------------------
// Role <-> Permissions (Many to Many)
// ------------------------------------------------
export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: text("role_id")
      .references(() => roles.id)
      .notNull(),
    permissionId: text("permission_id")
      .references(() => permissions.id)
      .notNull(),
  },
  (t) => ({
    pk: primaryKey(t.roleId, t.permissionId),
  })
);

// ------------------------------------------------
// Organization Members (User assignment to Organization)
// ------------------------------------------------
export const organizationMembers = pgTable(
  "organization_members",
  {
    userId: text("user_id").notNull(), // from Auth Service
    organizationId: uuid("organization_id")
      .references(() => organizations.id)
      .notNull(),
    roleId: text("role_id")
      .references(() => roles.id)
      .notNull(), // 'org:owner', 'org:admin', 'org:member'
    joinedAt: timestamp("joined_at").defaultNow(),
  },
  (t) => ({
    pk: primaryKey(t.userId, t.organizationId),
  })
);

// ------------------------------------------------
// Workspace Members (User assignment to Workspace)
// ------------------------------------------------
export const workspaceMembers = pgTable(
  "workspace_members",
  {
    userId: text("user_id").notNull(), // from Auth Service
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id)
      .notNull(),
    roleId: text("role_id")
      .references(() => roles.id)
      .notNull(),
    joinedAt: timestamp("joined_at").defaultNow(),
  },
  (t) => ({
    pk: primaryKey(t.userId, t.workspaceId),
  })
);
