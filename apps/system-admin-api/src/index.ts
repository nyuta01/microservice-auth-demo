import { serve } from "@hono/node-server";
import { corsConfig, createErrorHandler, type JwtUser, notFoundHandler, verifyJwt } from "@repo/api-middleware";
import type { SystemStats } from "@repo/types";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createMiddleware } from "hono/factory";
import { authnDb } from "./db/authn";
import { user } from "./db/authn-schema";
import { authzDb } from "./db/authz";
import { organizationMembers, organizations, roles, workspaces } from "./db/authz-schema";

const app = new Hono<{
  Variables: {
    user: JwtUser;
    userId: string;
  };
}>();

// CORS
app.use("*", cors(corsConfig));

// Authentication middleware (JWT verification)
app.use("/api/*", verifyJwt("System Admin API"));

// System administrator permission check middleware
const checkSystemAdmin = createMiddleware(async (c, next) => {
  const currentUser = c.get("user");
  if (!currentUser?.sub) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Check role from user table
  const [dbUser] = await authnDb
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, currentUser.sub))
    .limit(1);

  if (!dbUser || dbUser.role !== "admin") {
    console.log(
      `[System Admin API] Access denied for user ${currentUser.sub}: role=${dbUser?.role || "null"}`
    );
    return c.json({ error: "Forbidden: System admin access required" }, 403);
  }

  await next();
});

// Apply system administrator permission check
app.use("/api/system-admin/*", checkSystemAdmin);

// Get user list
app.get("/api/system-admin/users", async (c) => {
  const users = await authnDb.select().from(user).orderBy(user.createdAt);
  return c.json({ users });
});

// Get user details
app.get("/api/system-admin/users/:id", async (c) => {
  const userId = c.req.param("id");

  const [dbUser] = await authnDb.select().from(user).where(eq(user.id, userId)).limit(1);

  if (!dbUser) {
    throw new Error("User not found");
  }

  return c.json({ user: dbUser });
});

// Update user
app.put("/api/system-admin/users/:id", async (c) => {
  const userId = c.req.param("id");
  const body = await c.req.json();
  const { name, email, role, banned, banReason, banExpires } = body;

  const updateData: {
    name?: string;
    email?: string;
    role?: string | null;
    banned?: boolean | null;
    banReason?: string | null;
    banExpires?: Date | null;
    updatedAt: Date;
  } = {
    updatedAt: new Date(),
  };

  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (role !== undefined) updateData.role = role || null;
  if (banned !== undefined) updateData.banned = banned || null;
  if (banReason !== undefined) updateData.banReason = banReason || null;
  if (banExpires !== undefined) {
    updateData.banExpires = banExpires ? new Date(banExpires) : null;
  }

  const [updatedUser] = await authnDb
    .update(user)
    .set(updateData)
    .where(eq(user.id, userId))
    .returning();

  if (!updatedUser) {
    throw new Error("User not found");
  }

  return c.json({ user: updatedUser });
});

// Get organization list
app.get("/api/system-admin/organizations", async (c) => {
  const orgs = await authzDb.select().from(organizations).orderBy(organizations.createdAt);
  return c.json({ organizations: orgs });
});

// Create organization
app.post("/api/system-admin/organizations", async (c) => {
  const body = await c.req.json();
  const { name, slug } = body;

  if (!name || !slug) {
    throw new Error("Name and slug are required");
  }

  const [org] = await authzDb.insert(organizations).values({ name, slug }).returning();

  return c.json({ organization: org }, 201);
});

// Update organization
app.put("/api/system-admin/organizations/:id", async (c) => {
  const orgId = c.req.param("id");
  const body = await c.req.json();
  const { name, slug } = body;

  const updateData: { name?: string; slug?: string } = {};
  if (name !== undefined) updateData.name = name;
  if (slug !== undefined) updateData.slug = slug;

  const [updatedOrg] = await authzDb
    .update(organizations)
    .set(updateData)
    .where(eq(organizations.id, orgId))
    .returning();

  if (!updatedOrg) {
    throw new Error("Organization not found");
  }

  return c.json({ organization: updatedOrg });
});

// Delete organization
app.delete("/api/system-admin/organizations/:id", async (c) => {
  const orgId = c.req.param("id");

  const [deleted] = await authzDb
    .delete(organizations)
    .where(eq(organizations.id, orgId))
    .returning();

  if (!deleted) {
    throw new Error("Organization not found");
  }

  return c.json({ message: "Organization deleted successfully" });
});

// Get workspace list
app.get("/api/system-admin/workspaces", async (c) => {
  const ws = await authzDb
    .select({
      id: workspaces.id,
      organizationId: workspaces.organizationId,
      name: workspaces.name,
      createdAt: workspaces.createdAt,
      organizationName: organizations.name,
    })
    .from(workspaces)
    .innerJoin(organizations, eq(workspaces.organizationId, organizations.id))
    .orderBy(workspaces.createdAt);

  return c.json({ workspaces: ws });
});

// Get system statistics
app.get("/api/system-admin/stats", async (c) => {
  const allUsers = await authnDb.select().from(user);
  const allOrgs = await authzDb.select().from(organizations);
  const allWorkspaces = await authzDb.select().from(workspaces);

  const stats: SystemStats = {
    users: {
      total: allUsers.length,
      admins: allUsers.filter((u) => u.role === "admin").length,
      regular: allUsers.filter((u) => u.role === "user" || !u.role).length,
      banned: allUsers.filter((u) => u.banned === true).length,
    },
    organizations: {
      total: allOrgs.length,
    },
    workspaces: {
      total: allWorkspaces.length,
    },
  };

  return c.json({ stats });
});

// Add user to organization
app.post("/api/system-admin/organizations/:id/members", async (c) => {
  const organizationId = c.req.param("id");
  const body = await c.req.json();
  const { userId, roleId } = body;

  if (!userId || !roleId) {
    throw new Error("userId and roleId are required");
  }

  // Verify that roleId is valid (org:owner, org:member)
  const validRoles = ["org:owner", "org:member"];
  if (!validRoles.includes(roleId)) {
    throw new Error(`Invalid roleId. Must be one of: ${validRoles.join(", ")}`);
  }

  // Check for existing membership
  const [existing] = await authzDb
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.organizationId, organizationId)
      )
    )
    .limit(1);

  if (existing) {
    // Update if already exists
    await authzDb
      .update(organizationMembers)
      .set({ roleId })
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.organizationId, organizationId)
        )
      );
    return c.json({ message: "Organization member updated successfully" });
  }

  // Add new member
  await authzDb.insert(organizationMembers).values({
    userId,
    organizationId,
    roleId,
  });

  return c.json({ message: "User added to organization successfully" }, 201);
});

// Create user using better-auth admin
app.post("/api/system-admin/users", async (c) => {
  const body = await c.req.json();
  const { name, email, password, role } = body;

  if (!name || !email || !password) {
    throw new Error("name, email, and password are required");
  }

  // Verify that role is valid (user, admin, null)
  if (role && role !== "user" && role !== "admin") {
    throw new Error("Invalid role. Must be 'user', 'admin', or null");
  }

  // Call better-auth sign-up endpoint
  const authnUrl = process.env.SERVICE_URL_AUTH || "http://localhost:10000";
  const signUpRes = await fetch(`${authnUrl}/api/auth/sign-up/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: authnUrl,
    },
    body: JSON.stringify({
      email,
      password,
      name,
    }),
  });

  if (!signUpRes.ok) {
    const errorData = await signUpRes.json().catch(() => ({ message: "Unknown error" }));
    throw new Error(errorData.message || "Failed to create user");
  }

  // Get created user ID
  const [createdUser] = await authnDb.select().from(user).where(eq(user.email, email)).limit(1);

  if (!createdUser) {
    throw new Error("User was created but could not be found");
  }

  // Set role (if specified)
  if (role) {
    await authnDb.update(user).set({ role }).where(eq(user.id, createdUser.id));
  }

  // Return without sensitive information like password
  const safeUser = {
    id: createdUser.id,
    name: createdUser.name,
    email: createdUser.email,
    emailVerified: createdUser.emailVerified,
    image: createdUser.image,
    role: role || createdUser.role,
    createdAt: createdUser.createdAt,
    updatedAt: createdUser.updatedAt,
  };

  return c.json({ user: safeUser }, 201);
});

// Get organization member list
app.get("/api/system-admin/organizations/:id/members", async (c) => {
  const organizationId = c.req.param("id");

  const members = await authzDb
    .select({
      userId: organizationMembers.userId,
      roleId: roles.id,
      roleName: roles.name,
      joinedAt: organizationMembers.joinedAt,
    })
    .from(organizationMembers)
    .innerJoin(roles, eq(organizationMembers.roleId, roles.id))
    .where(eq(organizationMembers.organizationId, organizationId));

  return c.json({ members });
});

// Error handling
app.onError(createErrorHandler("System Admin API"));
app.notFound(notFoundHandler);

const port = 10201;
console.log(`System Admin API running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
