/**
 * Member management route
 */
import { checkPermission } from "@repo/api-clients";
import type { JwtUser } from "@repo/api-middleware";
import type { WorkspaceMembersResponse } from "@repo/types";
import { Hono } from "hono";
import { fetchUsers } from "../lib/authn-client";
import { callAuthZApi } from "../lib/authz-client";

type Env = {
  Variables: {
    user: JwtUser;
    userId: string;
  };
};

interface OrganizationMembersResponse {
  members: Array<{
    userId: string;
    roleId: string;
    roleName: string;
    joinedAt: string;
  }>;
}

interface MemberWithEmail {
  userId: string;
  email: string | null;
  name: string | null;
  roleId: string;
  roleName: string;
  joinedAt: string;
}

interface SuccessResponse {
  success: boolean;
  message?: string;
}

const members = new Hono<Env>();

// === Organization Members ===

/**
 * Get list of organization members
 */
members.get("/organization/:organizationId", async (c) => {
  const user = c.get("user");
  const organizationId = c.req.param("organizationId");
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  const isAllowed = await checkPermission({
    userId: user.sub,
    organizationId,
    permission: "org:users",
    token,
  });

  if (!isAllowed) {
    throw new Error("Forbidden");
  }

  const data = await callAuthZApi<OrganizationMembersResponse>(
    `/internal/organizations/${organizationId}/members`,
    { token }
  );

  // Get and merge user information
  const usersMap = await fetchUsers();
  const membersWithEmail: MemberWithEmail[] = (data.members || []).map((member) => {
    const userInfo = usersMap.get(member.userId);
    return {
      ...member,
      email: userInfo?.email || null,
      name: userInfo?.name || null,
    };
  });

  return c.json({ members: membersWithEmail });
});

/**
 * Add organization member
 */
members.post("/organization/:organizationId", async (c) => {
  const user = c.get("user");
  const organizationId = c.req.param("organizationId");
  const body = await c.req.json();
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  const isAllowed = await checkPermission({
    userId: user.sub,
    organizationId,
    permission: "org:users",
    token,
  });

  if (!isAllowed) {
    throw new Error("Forbidden");
  }

  const { userId, roleId } = body;
  if (!userId || !roleId) {
    throw new Error("userId and roleId are required");
  }

  await callAuthZApi<SuccessResponse>(
    `/internal/organizations/${organizationId}/members`,
    { method: "POST", body: { userId, roleId }, token }
  );

  return c.json({ success: true }, 201);
});

/**
 * Remove organization member
 */
members.delete("/organization/:organizationId/:userId", async (c) => {
  const user = c.get("user");
  const organizationId = c.req.param("organizationId");
  const targetUserId = c.req.param("userId");
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  const isAllowed = await checkPermission({
    userId: user.sub,
    organizationId,
    permission: "org:users",
    token,
  });

  if (!isAllowed) {
    throw new Error("Forbidden");
  }

  await callAuthZApi<SuccessResponse>(
    `/internal/organizations/${organizationId}/members/${targetUserId}`,
    { method: "DELETE", token }
  );

  return c.json({ success: true });
});

/**
 * Update organization member role
 */
members.put("/organization/:organizationId/:userId/role", async (c) => {
  const user = c.get("user");
  const organizationId = c.req.param("organizationId");
  const targetUserId = c.req.param("userId");
  const body = await c.req.json();
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  const isAllowed = await checkPermission({
    userId: user.sub,
    organizationId,
    permission: "org:users",
    token,
  });

  if (!isAllowed) {
    throw new Error("Forbidden");
  }

  const { roleId } = body;
  if (!roleId) {
    throw new Error("roleId is required");
  }

  await callAuthZApi<SuccessResponse>(
    `/internal/organizations/${organizationId}/members/${targetUserId}/role`,
    { method: "PUT", body: { roleId }, token }
  );

  return c.json({ success: true });
});

// === Workspace Members ===

/**
 * Get list of workspace members
 */
members.get("/workspace/:workspaceId", async (c) => {
  const user = c.get("user");
  const workspaceId = c.req.param("workspaceId");
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  const isAllowed = await checkPermission({
    userId: user.sub,
    workspaceId,
    permission: "workspace:owner",
    token,
  });

  if (!isAllowed) {
    throw new Error("Forbidden");
  }

  const data = await callAuthZApi<WorkspaceMembersResponse>(
    `/internal/workspaces/${workspaceId}/members`,
    { token }
  );

  // Get and merge user information
  const usersMap = await fetchUsers();
  const membersWithEmail: MemberWithEmail[] = (data.members || []).map((member) => {
    const userInfo = usersMap.get(member.userId);
    return {
      ...member,
      email: userInfo?.email || null,
      name: userInfo?.name || null,
    };
  });

  return c.json({ members: membersWithEmail });
});

/**
 * Add workspace member
 */
members.post("/workspace/:workspaceId", async (c) => {
  const user = c.get("user");
  const workspaceId = c.req.param("workspaceId");
  const body = await c.req.json();
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  const isAllowed = await checkPermission({
    userId: user.sub,
    workspaceId,
    permission: "workspace:owner",
    token,
  });

  if (!isAllowed) {
    throw new Error("Forbidden");
  }

  const { userId, roleId } = body;
  if (!userId || !roleId) {
    throw new Error("userId and roleId are required");
  }

  await callAuthZApi<SuccessResponse>(
    `/internal/workspaces/${workspaceId}/members`,
    { method: "POST", body: { userId, roleId }, token }
  );

  return c.json({ success: true }, 201);
});

/**
 * Remove workspace member
 */
members.delete("/workspace/:workspaceId/:userId", async (c) => {
  const user = c.get("user");
  const workspaceId = c.req.param("workspaceId");
  const targetUserId = c.req.param("userId");
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  const isAllowed = await checkPermission({
    userId: user.sub,
    workspaceId,
    permission: "workspace:owner",
    token,
  });

  if (!isAllowed) {
    throw new Error("Forbidden");
  }

  await callAuthZApi<SuccessResponse>(
    `/internal/workspaces/${workspaceId}/members/${targetUserId}`,
    { method: "DELETE", token }
  );

  return c.json({ success: true });
});

/**
 * Update workspace member role
 */
members.put("/workspace/:workspaceId/:userId/role", async (c) => {
  const user = c.get("user");
  const workspaceId = c.req.param("workspaceId");
  const targetUserId = c.req.param("userId");
  const body = await c.req.json();
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  const isAllowed = await checkPermission({
    userId: user.sub,
    workspaceId,
    permission: "workspace:owner",
    token,
  });

  if (!isAllowed) {
    throw new Error("Forbidden");
  }

  const { roleId } = body;
  if (!roleId) {
    throw new Error("roleId is required");
  }

  await callAuthZApi<SuccessResponse>(
    `/internal/workspaces/${workspaceId}/members/${targetUserId}/role`,
    { method: "PUT", body: { roleId }, token }
  );

  return c.json({ success: true });
});

export { members };
