/**
 * Workspace management route
 */
import { checkPermission } from "@repo/api-clients";
import type { JwtUser } from "@repo/api-middleware";
import type { UserWorkspacesResponse, OrganizationWithWorkspaces } from "@repo/types";
import { Hono } from "hono";
import { callAuthZApi } from "../lib/authz-client";

type Env = {
  Variables: {
    user: JwtUser;
    userId: string;
  };
};

interface WorkspaceResponse {
  workspace: {
    id: string;
    name: string;
    organizationId: string;
    createdAt: string;
  };
}

const workspaces = new Hono<Env>();

/**
 * Get list of workspaces
 */
workspaces.get("/", async (c) => {
  const user = c.get("user");
  const organizationId = c.req.header("X-Organization-ID");
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  // Get list of user's workspaces from AuthZ API
  const data = await callAuthZApi<UserWorkspacesResponse>("/internal/user-workspaces", {
    method: "POST",
    body: { userId: user.sub },
    token,
  });

  // Filter by Organization ID (if specified)
  let orgs = data.organizations || [];
  if (organizationId) {
    orgs = orgs.filter((org: OrganizationWithWorkspaces) => org.organizationId === organizationId);
  }

  return c.json({ organizations: orgs });
});

/**
 * Create workspace
 */
workspaces.post("/", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const { name, organizationId } = body;
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  if (!name || !organizationId) {
    throw new Error("Name and organizationId are required");
  }

  // Permission check: org:workspaces (workspace creation permission)
  const isAllowed = await checkPermission({
    userId: user.sub,
    organizationId,
    permission: "org:workspaces",
    token,
  });

  if (!isAllowed) {
    throw new Error("Forbidden");
  }

  // Create workspace via AuthZ API
  const result = await callAuthZApi<WorkspaceResponse>("/internal/workspaces", {
    method: "POST",
    body: { name, organizationId, createdBy: user.sub },
    token,
  });

  return c.json(result, 201);
});

/**
 * Update workspace
 */
workspaces.put("/:id", async (c) => {
  const user = c.get("user");
  const workspaceId = c.req.param("id");
  const body = await c.req.json();
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  // Permission check: workspace:admin
  const isAllowed = await checkPermission({
    userId: user.sub,
    workspaceId,
    permission: "workspace:admin",
    token,
  });

  if (!isAllowed) {
    throw new Error("Forbidden");
  }

  // Update workspace via AuthZ API
  const result = await callAuthZApi<WorkspaceResponse>(`/internal/workspaces/${workspaceId}`, {
    method: "PUT",
    body,
    token,
  });
  return c.json(result);
});

/**
 * Delete workspace
 */
workspaces.delete("/:id", async (c) => {
  const user = c.get("user");
  const workspaceId = c.req.param("id");
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  // Permission check: workspace:admin
  const isAllowed = await checkPermission({
    userId: user.sub,
    workspaceId,
    permission: "workspace:admin",
    token,
  });

  if (!isAllowed) {
    throw new Error("Forbidden");
  }

  // Delete workspace via AuthZ API
  await callAuthZApi(`/internal/workspaces/${workspaceId}`, { method: "DELETE", token });
  return c.json({ message: "Workspace deleted successfully" });
});

export { workspaces };
