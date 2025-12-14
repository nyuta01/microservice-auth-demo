/**
 * Member management routes
 * Add, remove, and update roles for Organization/Workspace members
 */
import { type RouteHandler, createRoute, z } from "@hono/zod-openapi";
import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { organizationMembers, workspaceMembers } from "../db/schema";

// === Schema Definitions ===

const OrganizationMemberRequestSchema = z
  .object({
    userId: z.string().openapi({ example: "user123" }),
    organizationId: z.uuid().openapi({ example: "00000000-0000-0000-0000-000000000001" }),
    roleId: z.string().openapi({ example: "org:member" }),
  })
  .openapi("OrganizationMemberRequest");

const WorkspaceMemberRequestSchema = z
  .object({
    userId: z.string().openapi({ example: "user123" }),
    workspaceId: z.uuid().openapi({ example: "00000000-0000-0000-0000-000000000001" }),
    roleId: z.string().openapi({ example: "workspace:member" }),
  })
  .openapi("WorkspaceMemberRequest");

const UpdateRoleRequestSchema = z
  .object({
    roleId: z.string().openapi({ example: "workspace:admin" }),
  })
  .openapi("UpdateRoleRequest");

const SuccessResponseSchema = z
  .object({
    success: z.boolean().openapi({ example: true }),
    message: z.string().optional().openapi({ example: "Member added successfully" }),
  })
  .openapi("SuccessResponse");

// === Organization Member Routes ===

// Add organization member
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

  await db
    .insert(organizationMembers)
    .values({ userId, organizationId, roleId })
    .onConflictDoUpdate({
      target: [organizationMembers.userId, organizationMembers.organizationId],
      set: { roleId },
    });

  return c.json({ success: true, message: "Member added successfully" }, 201);
};

// Remove organization member
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

// Update organization member role
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

// Add workspace member
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

  await db
    .insert(workspaceMembers)
    .values({ userId, workspaceId, roleId })
    .onConflictDoUpdate({
      target: [workspaceMembers.userId, workspaceMembers.workspaceId],
      set: { roleId },
    });

  return c.json({ success: true, message: "Member added successfully" }, 201);
};

// Remove workspace member
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

// Update workspace member role
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
