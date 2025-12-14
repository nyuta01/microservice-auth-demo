/**
 * Member management routes
 * Add, remove, and update roles for Organization/Workspace members
 */
import { createRoute, type RouteHandler, z } from "@hono/zod-openapi";
import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { organizationMembers, workspaceMembers } from "../db/schema";
import type { JwtPayload } from "../middleware/internal-auth";
import { authorizationUseCase } from "./authorize";

// Valid role IDs
const VALID_ORG_ROLES = ["org:owner", "org:member"] as const;
const VALID_WORKSPACE_ROLES = ["workspace:owner", "workspace:member", "workspace:viewer"] as const;

function isValidOrgRole(roleId: string): boolean {
  return (VALID_ORG_ROLES as readonly string[]).includes(roleId);
}

function isValidWorkspaceRole(roleId: string): boolean {
  return (VALID_WORKSPACE_ROLES as readonly string[]).includes(roleId);
}

// Helper to get jwtPayload from context
type ContextWithJwt = { get(key: "jwtPayload"): JwtPayload | undefined };

// === Schema Definitions ===

const UpdateRoleRequestSchema = z
  .object({
    roleId: z.string().openapi({ example: "workspace:owner" }),
  })
  .openapi("UpdateRoleRequest");

const SuccessResponseSchema = z
  .object({
    success: z.boolean().openapi({ example: true }),
    message: z.string().optional().openapi({ example: "Member added successfully" }),
  })
  .openapi("SuccessResponse");

// === Organization Member Routes ===

export const addOrganizationMemberRoute = createRoute({
  method: "post",
  path: "/internal/organizations/{organizationId}/members",
  request: {
    params: z.object({
      organizationId: z.uuid().openapi({ param: { name: "organizationId", in: "path" } }),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            userId: z.string(),
            roleId: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: SuccessResponseSchema } },
      description: "Member added successfully",
    },
  },
  tags: ["Members"],
  summary: "Add organization member",
});

export const addOrganizationMemberHandler: RouteHandler<typeof addOrganizationMemberRoute> = async (c) => {
  const { organizationId } = c.req.valid("param");
  const { userId, roleId } = c.req.valid("json");
  const jwtPayload = (c as unknown as ContextWithJwt).get("jwtPayload");

  // Authorization check: caller must have org:users permission
  const authResult = await authorizationUseCase.execute({
    userId: jwtPayload?.sub ?? "",
    organizationId,
    permission: "org:users",
    userRole: jwtPayload?.role,
  });
  if (!authResult.allowed) {
    throw new Error("Forbidden: insufficient permissions");
  }

  // Role validation
  if (!isValidOrgRole(roleId)) {
    throw new Error(`Invalid role ID: ${roleId}. Valid roles: ${VALID_ORG_ROLES.join(", ")}`);
  }

  await db
    .insert(organizationMembers)
    .values({ userId, organizationId, roleId })
    .onConflictDoUpdate({
      target: [organizationMembers.userId, organizationMembers.organizationId],
      set: { roleId },
    });

  return c.json({ success: true, message: "Member added successfully" }, 201);
};

export const removeOrganizationMemberRoute = createRoute({
  method: "delete",
  path: "/internal/organizations/{organizationId}/members/{userId}",
  request: {
    params: z.object({
      organizationId: z.uuid().openapi({ param: { name: "organizationId", in: "path" } }),
      userId: z.string().openapi({ param: { name: "userId", in: "path" } }),
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: SuccessResponseSchema } },
      description: "Member removed successfully",
    },
  },
  tags: ["Members"],
  summary: "Remove organization member",
});

export const removeOrganizationMemberHandler: RouteHandler<typeof removeOrganizationMemberRoute> = async (c) => {
  const { organizationId, userId } = c.req.valid("param");
  const jwtPayload = (c as unknown as ContextWithJwt).get("jwtPayload");

  const authResult = await authorizationUseCase.execute({
    userId: jwtPayload?.sub ?? "",
    organizationId,
    permission: "org:users",
    userRole: jwtPayload?.role,
  });
  if (!authResult.allowed) {
    throw new Error("Forbidden: insufficient permissions");
  }

  await db
    .delete(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, userId)
      )
    );

  return c.json({ success: true, message: "Member removed successfully" });
};

export const updateOrganizationMemberRoleRoute = createRoute({
  method: "put",
  path: "/internal/organizations/{organizationId}/members/{userId}/role",
  request: {
    params: z.object({
      organizationId: z.uuid().openapi({ param: { name: "organizationId", in: "path" } }),
      userId: z.string().openapi({ param: { name: "userId", in: "path" } }),
    }),
    body: {
      content: { "application/json": { schema: UpdateRoleRequestSchema } },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: SuccessResponseSchema } },
      description: "Role updated successfully",
    },
  },
  tags: ["Members"],
  summary: "Update organization member role",
});

export const updateOrganizationMemberRoleHandler: RouteHandler<typeof updateOrganizationMemberRoleRoute> = async (c) => {
  const { organizationId, userId } = c.req.valid("param");
  const { roleId } = c.req.valid("json");
  const jwtPayload = (c as unknown as ContextWithJwt).get("jwtPayload");

  const authResult = await authorizationUseCase.execute({
    userId: jwtPayload?.sub ?? "",
    organizationId,
    permission: "org:users",
    userRole: jwtPayload?.role,
  });
  if (!authResult.allowed) {
    throw new Error("Forbidden: insufficient permissions");
  }

  if (!isValidOrgRole(roleId)) {
    throw new Error(`Invalid role ID: ${roleId}. Valid roles: ${VALID_ORG_ROLES.join(", ")}`);
  }

  await db
    .update(organizationMembers)
    .set({ roleId })
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, userId)
      )
    );

  return c.json({ success: true, message: "Role updated successfully" });
};

// === Workspace Member Routes ===

export const addWorkspaceMemberRoute = createRoute({
  method: "post",
  path: "/internal/workspaces/{workspaceId}/members",
  request: {
    params: z.object({
      workspaceId: z.uuid().openapi({ param: { name: "workspaceId", in: "path" } }),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            userId: z.string(),
            roleId: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: SuccessResponseSchema } },
      description: "Member added successfully",
    },
  },
  tags: ["Members"],
  summary: "Add workspace member",
});

export const addWorkspaceMemberHandler: RouteHandler<typeof addWorkspaceMemberRoute> = async (c) => {
  const { workspaceId } = c.req.valid("param");
  const { userId, roleId } = c.req.valid("json");
  const jwtPayload = (c as unknown as ContextWithJwt).get("jwtPayload");

  // Authorization check: caller must have workspace:owner permission
  const authResult = await authorizationUseCase.execute({
    userId: jwtPayload?.sub ?? "",
    workspaceId,
    permission: "workspace:owner",
    userRole: jwtPayload?.role,
  });
  if (!authResult.allowed) {
    throw new Error("Forbidden: insufficient permissions");
  }

  if (!isValidWorkspaceRole(roleId)) {
    throw new Error(`Invalid role ID: ${roleId}. Valid roles: ${VALID_WORKSPACE_ROLES.join(", ")}`);
  }

  await db
    .insert(workspaceMembers)
    .values({ userId, workspaceId, roleId })
    .onConflictDoUpdate({
      target: [workspaceMembers.userId, workspaceMembers.workspaceId],
      set: { roleId },
    });

  return c.json({ success: true, message: "Member added successfully" }, 201);
};

export const removeWorkspaceMemberRoute = createRoute({
  method: "delete",
  path: "/internal/workspaces/{workspaceId}/members/{userId}",
  request: {
    params: z.object({
      workspaceId: z.uuid().openapi({ param: { name: "workspaceId", in: "path" } }),
      userId: z.string().openapi({ param: { name: "userId", in: "path" } }),
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: SuccessResponseSchema } },
      description: "Member removed successfully",
    },
  },
  tags: ["Members"],
  summary: "Remove workspace member",
});

export const removeWorkspaceMemberHandler: RouteHandler<typeof removeWorkspaceMemberRoute> = async (c) => {
  const { workspaceId, userId } = c.req.valid("param");
  const jwtPayload = (c as unknown as ContextWithJwt).get("jwtPayload");

  const authResult = await authorizationUseCase.execute({
    userId: jwtPayload?.sub ?? "",
    workspaceId,
    permission: "workspace:owner",
    userRole: jwtPayload?.role,
  });
  if (!authResult.allowed) {
    throw new Error("Forbidden: insufficient permissions");
  }

  await db
    .delete(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId)
      )
    );

  return c.json({ success: true, message: "Member removed successfully" });
};

export const updateWorkspaceMemberRoleRoute = createRoute({
  method: "put",
  path: "/internal/workspaces/{workspaceId}/members/{userId}/role",
  request: {
    params: z.object({
      workspaceId: z.uuid().openapi({ param: { name: "workspaceId", in: "path" } }),
      userId: z.string().openapi({ param: { name: "userId", in: "path" } }),
    }),
    body: {
      content: { "application/json": { schema: UpdateRoleRequestSchema } },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: SuccessResponseSchema } },
      description: "Role updated successfully",
    },
  },
  tags: ["Members"],
  summary: "Update workspace member role",
});

export const updateWorkspaceMemberRoleHandler: RouteHandler<typeof updateWorkspaceMemberRoleRoute> = async (c) => {
  const { workspaceId, userId } = c.req.valid("param");
  const { roleId } = c.req.valid("json");
  const jwtPayload = (c as unknown as ContextWithJwt).get("jwtPayload");

  const authResult = await authorizationUseCase.execute({
    userId: jwtPayload?.sub ?? "",
    workspaceId,
    permission: "workspace:owner",
    userRole: jwtPayload?.role,
  });
  if (!authResult.allowed) {
    throw new Error("Forbidden: insufficient permissions");
  }

  if (!isValidWorkspaceRole(roleId)) {
    throw new Error(`Invalid role ID: ${roleId}. Valid roles: ${VALID_WORKSPACE_ROLES.join(", ")}`);
  }

  await db
    .update(workspaceMembers)
    .set({ roleId })
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId)
      )
    );

  return c.json({ success: true, message: "Role updated successfully" });
};
