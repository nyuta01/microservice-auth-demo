/**
 * authn-api seed script
 *
 * Create demo users and link to authz-api Organization/Workspace
 * Idempotency: Existing users are deleted and recreated
 *
 * Test scenarios:
 * - Permission testing for org:owner / org:member
 * - Permission testing for workspace:owner / workspace:member / workspace:viewer
 * - Multi-tenant (multiple Organizations) isolation testing
 * - Access control testing for multiple Workspaces
 */

import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { resolve } from "path";

// Load .env file from root directory
config({ path: resolve(__dirname, "../../../.env") });

import { auth } from "../src/auth.js";
import { closeDatabase, db } from "../src/db/index.js";
import { account, session, user } from "../src/db/schema.js";

// Organization IDs (matches authz-api/scripts/seed.ts, RFC 4122 compliant)
const ORG_1_ID = "00000000-0000-4000-a000-000000000001"; // Acme Corporation
const ORG_2_ID = "00000000-0000-4000-a000-000000000010"; // Global Tech Inc

// Workspace IDs (matches authz-api/scripts/seed.ts, RFC 4122 compliant)
const ORG_1_WORKSPACE_1_ID = "00000000-0000-4000-a000-000000000002"; // Engineering
const ORG_1_WORKSPACE_2_ID = "00000000-0000-4000-a000-000000000003"; // Marketing
const ORG_2_WORKSPACE_1_ID = "00000000-0000-4000-a000-000000000011"; // Product

type OrgRole = "org:owner" | "org:member";
type WorkspaceRole = "workspace:owner" | "workspace:member" | "workspace:viewer";

interface DemoUser {
  name: string;
  email: string;
  password: string;
  betterAuthRole: "admin" | "user"; // For better-auth admin plugin
  memberships: {
    organizationId: string;
    orgRole: OrgRole;
    workspaces: {
      workspaceId: string;
      role: WorkspaceRole;
    }[];
  }[];
}

const PASSWORD = "password";

const demoUsers: DemoUser[] = [
  // ========================================
  // System Administrator (Super Admin)
  // ========================================
  // super-admin: Service-wide administrator (not associated with any Organization/Workspace)
  {
    name: "Super Admin",
    email: "super-admin@example.com",
    password: PASSWORD,
    betterAuthRole: "admin",
    memberships: [], // System administrators do not belong to any specific Org/Workspace
  },
  // ========================================
  // Acme Corporation Users
  // ========================================
  // org-owner-1: Organization owner (admin permissions for all Workspaces)
  {
    name: "Alice Johnson",
    email: "org-owner-1@example.com",
    password: PASSWORD,
    betterAuthRole: "user",
    memberships: [
      {
        organizationId: ORG_1_ID,
        orgRole: "org:owner",
        workspaces: [
          { workspaceId: ORG_1_WORKSPACE_1_ID, role: "workspace:owner" },
          { workspaceId: ORG_1_WORKSPACE_2_ID, role: "workspace:owner" },
        ],
      },
    ],
  },
  // org-owner-2: Organization owner (manages Engineering only)
  {
    name: "Bob Smith",
    email: "org-owner-2@example.com",
    password: PASSWORD,
    betterAuthRole: "user",
    memberships: [
      {
        organizationId: ORG_1_ID,
        orgRole: "org:owner",
        workspaces: [
          { workspaceId: ORG_1_WORKSPACE_1_ID, role: "workspace:owner" },
        ],
      },
    ],
  },
  // ws-member-1: Regular member (can edit in both Workspaces)
  {
    name: "Carol White",
    email: "ws-member-1@example.com",
    password: PASSWORD,
    betterAuthRole: "user",
    memberships: [
      {
        organizationId: ORG_1_ID,
        orgRole: "org:member",
        workspaces: [
          { workspaceId: ORG_1_WORKSPACE_1_ID, role: "workspace:member" },
          { workspaceId: ORG_1_WORKSPACE_2_ID, role: "workspace:member" },
        ],
      },
    ],
  },
  // ws-viewer-1: Read-only user (view Engineering only)
  {
    name: "David Brown",
    email: "ws-viewer-1@example.com",
    password: PASSWORD,
    betterAuthRole: "user",
    memberships: [
      {
        organizationId: ORG_1_ID,
        orgRole: "org:member",
        workspaces: [
          { workspaceId: ORG_1_WORKSPACE_1_ID, role: "workspace:viewer" },
        ],
      },
    ],
  },
  // ========================================
  // Global Tech Inc Users (for multi-tenant testing)
  // ========================================
  // org-owner-3: Owner of another organization
  {
    name: "Eve Davis",
    email: "org-owner-3@example.com",
    password: PASSWORD,
    betterAuthRole: "user",
    memberships: [
      {
        organizationId: ORG_2_ID,
        orgRole: "org:owner",
        workspaces: [
          { workspaceId: ORG_2_WORKSPACE_1_ID, role: "workspace:owner" },
        ],
      },
    ],
  },
  // ========================================
  // Multi-Organization Users (for cross-org testing)
  // ========================================
  // multi-org-owner: Owner in both organizations
  {
    name: "Frank Miller",
    email: "multi-org-owner@example.com",
    password: PASSWORD,
    betterAuthRole: "user",
    memberships: [
      {
        organizationId: ORG_1_ID,
        orgRole: "org:owner",
        workspaces: [
          { workspaceId: ORG_1_WORKSPACE_1_ID, role: "workspace:owner" },
        ],
      },
      {
        organizationId: ORG_2_ID,
        orgRole: "org:owner",
        workspaces: [
          { workspaceId: ORG_2_WORKSPACE_1_ID, role: "workspace:owner" },
        ],
      },
    ],
  },
  // multi-org-member: Member in both organizations with different roles
  {
    name: "Grace Lee",
    email: "multi-org-member@example.com",
    password: PASSWORD,
    betterAuthRole: "user",
    memberships: [
      {
        organizationId: ORG_1_ID,
        orgRole: "org:member",
        workspaces: [
          { workspaceId: ORG_1_WORKSPACE_1_ID, role: "workspace:member" },
          { workspaceId: ORG_1_WORKSPACE_2_ID, role: "workspace:viewer" },
        ],
      },
      {
        organizationId: ORG_2_ID,
        orgRole: "org:member",
        workspaces: [
          { workspaceId: ORG_2_WORKSPACE_1_ID, role: "workspace:member" },
        ],
      },
    ],
  },
];

async function createUser(userData: DemoUser): Promise<string> {
  // 1. Delete existing user and account
  const existingUser = await db.query.user.findFirst({
    where: eq(user.email, userData.email),
  });

  if (existingUser) {
    console.log(`  [RECREATE] ${userData.email}`);
    await db.delete(session).where(eq(session.userId, existingUser.id));
    await db.delete(account).where(eq(account.userId, existingUser.id));
    await db.delete(user).where(eq(user.id, existingUser.id));
  }

  // 2. Create user using better-auth internal API
  const url = new URL("/api/auth/sign-up/email", "http://localhost:10000");
  const request = new Request(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:10000",
    },
    body: JSON.stringify({
      email: userData.email,
      password: userData.password,
      name: userData.name,
    }),
  });

  const response = await auth.handler(request);

  if (!response.ok) {
    const responseText = await response.text();
    let errorData: { message: string } | undefined;
    try {
      errorData = JSON.parse(responseText);
    } catch {
      errorData = { message: responseText };
    }
    throw new Error(`Failed to create user: ${JSON.stringify(errorData)}`);
  }

  // 3. Retrieve created user ID
  const createdUser = await db.query.user.findFirst({
    where: eq(user.email, userData.email),
  });

  if (!createdUser) {
    throw new Error("User was created but could not be found in database");
  }

  // 4. Set better-auth admin plugin role
  await db
    .update(user)
    .set({ role: userData.betterAuthRole })
    .where(eq(user.id, createdUser.id));

  console.log(`  [OK] Created: ${userData.email}`);
  return createdUser.id;
}

async function linkUserToOrganization(
  userId: string,
  organizationId: string,
  orgRole: OrgRole
) {
  const authzDbUrl = process.env.DATABASE_URL_AUTHZ;
  if (!authzDbUrl) {
    console.warn("  [WARN] DATABASE_URL_AUTHZ not set.");
    return;
  }

  const postgres = (await import("postgres")).default;
  const client = postgres(authzDbUrl, { prepare: false });

  try {
    await client`
      INSERT INTO organization_members (user_id, organization_id, role_id)
      VALUES (${userId}, ${organizationId}, ${orgRole})
      ON CONFLICT (user_id, organization_id) DO UPDATE SET role_id = ${orgRole}
    `;
  } finally {
    await client.end();
  }
}

async function linkUserToWorkspace(
  userId: string,
  workspaceId: string,
  role: WorkspaceRole
) {
  const authzDbUrl = process.env.DATABASE_URL_AUTHZ;
  if (!authzDbUrl) {
    console.warn("  [WARN] DATABASE_URL_AUTHZ not set.");
    return;
  }

  const postgres = (await import("postgres")).default;
  const client = postgres(authzDbUrl, { prepare: false });

  try {
    await client`
      INSERT INTO workspace_members (user_id, workspace_id, role_id)
      VALUES (${userId}, ${workspaceId}, ${role})
      ON CONFLICT (user_id, workspace_id) DO UPDATE SET role_id = ${role}
    `;
  } finally {
    await client.end();
  }
}

async function seed() {
  console.log("=== authn-api seed starting ===");

  for (const demoUser of demoUsers) {
    console.log(`Creating: ${demoUser.email}`);
    const userId = await createUser(demoUser);

    // Link memberships
    for (const membership of demoUser.memberships) {
      await linkUserToOrganization(
        userId,
        membership.organizationId,
        membership.orgRole
      );

      for (const ws of membership.workspaces) {
        await linkUserToWorkspace(userId, ws.workspaceId, ws.role);
      }
    }
  }

  console.log("=== authn-api seed completed ===");
  console.log("");
  console.log("--- Demo Credentials (all passwords: password) ---");
  console.log("");
  console.log("System Admin (service-wide administrator):");
  console.log("  super-admin@example.com   role:admin   Can manage all Organizations/Workspaces");
  console.log("");
  console.log("Acme Corporation:");
  console.log("  org-owner-1@example.com   org:owner    Engineering(owner), Marketing(owner)");
  console.log("  org-owner-2@example.com   org:owner    Engineering(owner)");
  console.log("  ws-member-1@example.com   org:member   Engineering(member), Marketing(member)");
  console.log("  ws-viewer-1@example.com   org:member   Engineering(viewer)");
  console.log("");
  console.log("Global Tech Inc:");
  console.log("  org-owner-3@example.com   org:owner    Product(owner)");
  console.log("");
  console.log("Multi-Organization Users:");
  console.log("  multi-org-owner@example.com   Acme(org:owner, Engineering/owner), GlobalTech(org:owner, Product/owner)");
  console.log("  multi-org-member@example.com  Acme(org:member, Eng/member, Mkt/viewer), GlobalTech(org:member, Product/member)");

  await closeDatabase();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
