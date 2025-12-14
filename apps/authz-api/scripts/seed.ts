/**
 * authz-api seed script
 *
 * Seeds initial data for Roles, Permissions, Organizations, and Workspaces
 * Idempotent: existing data is skipped
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  organizations,
  permissions,
  rolePermissions,
  roles,
  workspaces,
} from "../src/db/schema.js";

// Demo data constants (RFC 4122 compliant UUID)
// Organization 1: Acme Corporation (primary test organization)
const ORG_1_ID = "00000000-0000-4000-a000-000000000001";
const ORG_1_WORKSPACE_1_ID = "00000000-0000-4000-a000-000000000002"; // Engineering
const ORG_1_WORKSPACE_2_ID = "00000000-0000-4000-a000-000000000003"; // Marketing

// Organization 2: Global Tech Inc (multi-tenant test organization)
const ORG_2_ID = "00000000-0000-4000-a000-000000000010";
const ORG_2_WORKSPACE_1_ID = "00000000-0000-4000-a000-000000000011"; // Product

async function seed() {
  const connectionString = process.env.DATABASE_URL_AUTHZ;
  if (!connectionString) {
    throw new Error("DATABASE_URL_AUTHZ environment variable is not set");
  }

  const client = postgres(connectionString, { prepare: false });
  const db = drizzle(client);

  console.log("=== authz-api seed starting ===");

  // 1. Roles
  const rolesData = [
    { id: "org:owner", name: "Organization Owner" },
    { id: "org:member", name: "Organization Member" },
    { id: "workspace:owner", name: "Workspace Owner" },
    { id: "workspace:member", name: "Workspace Member" },
    { id: "workspace:viewer", name: "Workspace Viewer" },
  ];

  await db.insert(roles).values(rolesData).onConflictDoNothing();
  console.log(`[OK] Roles: ${rolesData.length} records`);

  // 2. Permissions
  // Permission naming: workspace:{resource}:{action}
  // Actions: read, create, update:own, update:all, delete:own, delete:all
  // :own = only own resources, :all = all resources
  const permissionsData = [
    // Task management
    { id: "workspace:task:read", description: "Read all tasks" },
    { id: "workspace:task:create", description: "Create tasks" },
    { id: "workspace:task:update:own", description: "Update own tasks" },
    { id: "workspace:task:update:all", description: "Update all tasks" },
    { id: "workspace:task:delete:own", description: "Delete own tasks" },
    { id: "workspace:task:delete:all", description: "Delete all tasks" },
    // Document management
    { id: "workspace:document:read", description: "Read all documents" },
    { id: "workspace:document:create", description: "Create documents" },
    { id: "workspace:document:update:own", description: "Update own documents" },
    { id: "workspace:document:update:all", description: "Update all documents" },
    { id: "workspace:document:delete:own", description: "Delete own documents" },
    { id: "workspace:document:delete:all", description: "Delete all documents" },
    // Schedule management
    { id: "workspace:schedule:read", description: "Read all schedules" },
    { id: "workspace:schedule:create", description: "Create schedules" },
    { id: "workspace:schedule:update:own", description: "Update own schedules" },
    { id: "workspace:schedule:update:all", description: "Update all schedules" },
    { id: "workspace:schedule:delete:own", description: "Delete own schedules" },
    { id: "workspace:schedule:delete:all", description: "Delete all schedules" },
    // Workspace management
    { id: "workspace:owner", description: "Workspace owner permission" },
    // Organization management
    { id: "org:manage", description: "Manage organization" },
    { id: "org:users", description: "Manage users" },
    { id: "org:workspaces", description: "Manage workspaces" },
    { id: "org:settings", description: "Manage organization settings" },
  ];

  await db.insert(permissions).values(permissionsData).onConflictDoNothing();
  console.log(`[OK] Permissions: ${permissionsData.length} records`);

  // 3. Role-Permission mappings
  // Permission matrix:
  // - admin: read, create, update:all, delete:all (full access)
  // - member: read, create, update:own, delete:own (own resources only)
  // - viewer: read only
  const rolePermissionsData = [
    // org:owner - full organization management permissions
    { roleId: "org:owner", permissionId: "org:manage" },
    { roleId: "org:owner", permissionId: "org:users" },
    { roleId: "org:owner", permissionId: "org:workspaces" },
    { roleId: "org:owner", permissionId: "org:settings" },
    // org:member - no organization-level permissions (access only as workspace member)

    // workspace:owner - full access to all resources
    { roleId: "workspace:owner", permissionId: "workspace:owner" },
    // Task permissions (owner)
    { roleId: "workspace:owner", permissionId: "workspace:task:read" },
    { roleId: "workspace:owner", permissionId: "workspace:task:create" },
    { roleId: "workspace:owner", permissionId: "workspace:task:update:own" },
    { roleId: "workspace:owner", permissionId: "workspace:task:update:all" },
    { roleId: "workspace:owner", permissionId: "workspace:task:delete:own" },
    { roleId: "workspace:owner", permissionId: "workspace:task:delete:all" },
    // Document permissions (owner)
    { roleId: "workspace:owner", permissionId: "workspace:document:read" },
    { roleId: "workspace:owner", permissionId: "workspace:document:create" },
    { roleId: "workspace:owner", permissionId: "workspace:document:update:own" },
    { roleId: "workspace:owner", permissionId: "workspace:document:update:all" },
    { roleId: "workspace:owner", permissionId: "workspace:document:delete:own" },
    { roleId: "workspace:owner", permissionId: "workspace:document:delete:all" },
    // Schedule permissions (owner)
    { roleId: "workspace:owner", permissionId: "workspace:schedule:read" },
    { roleId: "workspace:owner", permissionId: "workspace:schedule:create" },
    { roleId: "workspace:owner", permissionId: "workspace:schedule:update:own" },
    { roleId: "workspace:owner", permissionId: "workspace:schedule:update:all" },
    { roleId: "workspace:owner", permissionId: "workspace:schedule:delete:own" },
    { roleId: "workspace:owner", permissionId: "workspace:schedule:delete:all" },

    // workspace:member - can create/read all, update/delete own resources only
    // Task permissions (member)
    { roleId: "workspace:member", permissionId: "workspace:task:read" },
    { roleId: "workspace:member", permissionId: "workspace:task:create" },
    { roleId: "workspace:member", permissionId: "workspace:task:update:own" },
    { roleId: "workspace:member", permissionId: "workspace:task:delete:own" },
    // Document permissions (member)
    { roleId: "workspace:member", permissionId: "workspace:document:read" },
    { roleId: "workspace:member", permissionId: "workspace:document:create" },
    { roleId: "workspace:member", permissionId: "workspace:document:update:own" },
    { roleId: "workspace:member", permissionId: "workspace:document:delete:own" },
    // Schedule permissions (member)
    { roleId: "workspace:member", permissionId: "workspace:schedule:read" },
    { roleId: "workspace:member", permissionId: "workspace:schedule:create" },
    { roleId: "workspace:member", permissionId: "workspace:schedule:update:own" },
    { roleId: "workspace:member", permissionId: "workspace:schedule:delete:own" },

    // workspace:viewer - read only
    { roleId: "workspace:viewer", permissionId: "workspace:task:read" },
    { roleId: "workspace:viewer", permissionId: "workspace:document:read" },
    { roleId: "workspace:viewer", permissionId: "workspace:schedule:read" },
  ];

  await db
    .insert(rolePermissions)
    .values(rolePermissionsData)
    .onConflictDoNothing();
  console.log(`[OK] Role-Permissions: ${rolePermissionsData.length} mappings`);

  // 4. Organizations
  const organizationsData = [
    { id: ORG_1_ID, name: "Acme Corporation", slug: "acme" },
    { id: ORG_2_ID, name: "Global Tech Inc", slug: "globaltech" },
  ];

  for (const org of organizationsData) {
    await db.insert(organizations).values(org).onConflictDoNothing();
  }
  console.log(`[OK] Organizations: ${organizationsData.length} records`);

  // 5. Workspaces
  const workspacesData = [
    // Acme Corporation workspaces
    {
      id: ORG_1_WORKSPACE_1_ID,
      organizationId: ORG_1_ID,
      name: "Engineering",
    },
    {
      id: ORG_1_WORKSPACE_2_ID,
      organizationId: ORG_1_ID,
      name: "Marketing",
    },
    // Global Tech Inc workspaces
    {
      id: ORG_2_WORKSPACE_1_ID,
      organizationId: ORG_2_ID,
      name: "Product",
    },
  ];

  for (const ws of workspacesData) {
    await db.insert(workspaces).values(ws).onConflictDoNothing();
  }
  console.log(`[OK] Workspaces: ${workspacesData.length} records`);

  console.log("=== authz-api seed completed ===");
  console.log("");
  console.log("--- Demo Data ---");
  console.log("Organizations:");
  console.log(`  Acme Corporation (${ORG_1_ID})`);
  console.log(`    - Engineering (${ORG_1_WORKSPACE_1_ID})`);
  console.log(`    - Marketing (${ORG_1_WORKSPACE_2_ID})`);
  console.log(`  Global Tech Inc (${ORG_2_ID})`);
  console.log(`    - Product (${ORG_2_WORKSPACE_1_ID})`);

  await client.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
