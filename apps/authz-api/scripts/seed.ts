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
    { id: "org:admin", name: "Organization Administrator" },
    { id: "org:member", name: "Organization Member" },
    { id: "workspace:admin", name: "Workspace Administrator" },
    { id: "workspace:member", name: "Workspace Member" },
    { id: "workspace:viewer", name: "Workspace Viewer" },
  ];

  await db.insert(roles).values(rolesData).onConflictDoNothing();
  console.log(`[OK] Roles: ${rolesData.length} records`);

  // 2. Permissions
  const permissionsData = [
    { id: "workspace:task:read", description: "Read tasks" },
    { id: "workspace:task:write", description: "Create and update tasks" },
    { id: "workspace:task:delete", description: "Delete tasks" },
    { id: "workspace:task:assign", description: "Assign tasks" },
    { id: "workspace:document:read", description: "Read documents" },
    {
      id: "workspace:document:write",
      description: "Create and update documents",
    },
    { id: "workspace:document:delete", description: "Delete documents" },
    { id: "workspace:schedule:read", description: "Read schedules" },
    {
      id: "workspace:schedule:write",
      description: "Create and update schedules",
    },
    { id: "workspace:schedule:delete", description: "Delete schedules" },
    { id: "workspace:admin", description: "Workspace administration" },
    { id: "org:manage", description: "Manage organization" },
    { id: "org:users", description: "Manage users" },
    { id: "org:workspaces", description: "Manage workspaces" },
    { id: "org:settings", description: "Manage organization settings" },
  ];

  await db.insert(permissions).values(permissionsData).onConflictDoNothing();
  console.log(`[OK] Permissions: ${permissionsData.length} records`);

  // 3. Role-Permission mappings
  const rolePermissionsData = [
    // org:owner
    { roleId: "org:owner", permissionId: "org:manage" },
    { roleId: "org:owner", permissionId: "org:users" },
    { roleId: "org:owner", permissionId: "org:workspaces" },
    { roleId: "org:owner", permissionId: "org:settings" },
    // org:admin
    { roleId: "org:admin", permissionId: "org:manage" },
    { roleId: "org:admin", permissionId: "org:users" },
    { roleId: "org:admin", permissionId: "org:workspaces" },
    { roleId: "org:admin", permissionId: "org:settings" },
    // org:member - no organization-level permissions (access only as workspace member)
    // workspace:admin
    { roleId: "workspace:admin", permissionId: "workspace:admin" },
    { roleId: "workspace:admin", permissionId: "workspace:task:read" },
    { roleId: "workspace:admin", permissionId: "workspace:task:write" },
    { roleId: "workspace:admin", permissionId: "workspace:task:delete" },
    { roleId: "workspace:admin", permissionId: "workspace:task:assign" },
    { roleId: "workspace:admin", permissionId: "workspace:document:read" },
    { roleId: "workspace:admin", permissionId: "workspace:document:write" },
    { roleId: "workspace:admin", permissionId: "workspace:document:delete" },
    { roleId: "workspace:admin", permissionId: "workspace:schedule:read" },
    { roleId: "workspace:admin", permissionId: "workspace:schedule:write" },
    { roleId: "workspace:admin", permissionId: "workspace:schedule:delete" },
    // workspace:member
    { roleId: "workspace:member", permissionId: "workspace:task:read" },
    { roleId: "workspace:member", permissionId: "workspace:task:write" },
    { roleId: "workspace:member", permissionId: "workspace:document:read" },
    { roleId: "workspace:member", permissionId: "workspace:document:write" },
    { roleId: "workspace:member", permissionId: "workspace:schedule:read" },
    { roleId: "workspace:member", permissionId: "workspace:schedule:write" },
    // workspace:viewer
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
