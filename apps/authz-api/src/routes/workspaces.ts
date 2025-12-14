import { type RouteHandler, createRoute, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { organizations, roles, workspaceMembers, workspaces } from "../db/schema";
import type { JwtPayload } from "../middleware/internal-auth";
import { authorizationUseCase } from "./authorize";

type ContextWithJwt = { get(key: "jwtPayload"): JwtPayload | undefined };

// Schema definitions
const WorkspaceIdParamSchema = z.object({
  id: z.uuid().openapi({
    param: {
      name: "id",
      in: "path",
    },
    description: "Workspace ID",
    example: "00000000-0000-0000-0000-000000000001",
  }),
});

const WorkspaceIdPathParamSchema = z.object({
  workspaceId: z.uuid().openapi({
    param: {
      name: "workspaceId",
      in: "path",
    },
    description: "Workspace ID",
    example: "00000000-0000-0000-0000-000000000001",
  }),
});

const CreateWorkspaceRequestSchema = z
  .object({
    name: z.string().min(1).openapi({ example: "New Workspace" }),
    organizationId: z.uuid().openapi({ example: "00000000-0000-0000-0000-000000000001" }),
    createdBy: z.string().optional().openapi({ example: "user123" }),
  })
  .openapi("CreateWorkspaceRequest");

const UpdateWorkspaceRequestSchema = z
  .object({
    name: z.string().min(1).openapi({ example: "Updated Workspace Name" }),
  })
  .openapi("UpdateWorkspaceRequest");

const WorkspaceSchema = z
  .object({
    id: z.uuid().openapi({ example: "00000000-0000-0000-0000-000000000001" }),
    name: z.string().openapi({ example: "Workspace Name" }),
    organizationId: z.uuid().openapi({ example: "00000000-0000-0000-0000-000000000001" }),
    createdAt: z.string().datetime().openapi({ example: "2024-01-01T00:00:00Z" }),
  })
  .openapi("Workspace");

const WorkspaceResponseSchema = z
  .object({
    workspace: WorkspaceSchema,
  })
  .openapi("WorkspaceResponse");

const WorkspaceMemberSchema = z
  .object({
    userId: z.string().openapi({ example: "user123" }),
    roleId: z.string().openapi({ example: "workspace:admin" }),
    roleName: z.string().openapi({ example: "Workspace Admin" }),
    joinedAt: z.string().datetime().openapi({ example: "2024-01-01T00:00:00Z" }),
  })
  .openapi("WorkspaceMember");

const WorkspaceMembersResponseSchema = z
  .object({
    members: z.array(WorkspaceMemberSchema),
  })
  .openapi("WorkspaceMembersResponse");

const DeleteWorkspaceResponseSchema = z
  .object({
    message: z.string().openapi({ example: "Workspace deleted successfully" }),
  })
  .openapi("DeleteWorkspaceResponse");

// Get workspace members list
export const getWorkspaceMembersRoute = createRoute({
  method: "get",
  path: "/internal/workspaces/{workspaceId}/members",
  request: {
    params: WorkspaceIdPathParamSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: WorkspaceMembersResponseSchema,
        },
      },
      description: "Workspace members list",
    },
  },
  tags: ["Workspaces"],
  summary: "Get workspace members list",
  description: "Retrieves the list of members for the specified workspace",
});

export const getWorkspaceMembersHandler: RouteHandler<typeof getWorkspaceMembersRoute> = async (c) => {
  const { workspaceId } = c.req.valid("param");
  const jwtPayload = (c as unknown as ContextWithJwt).get("jwtPayload");

  // Authorization check: workspace:admin permission required
  const authResult = await authorizationUseCase.execute({
    userId: jwtPayload?.sub ?? "",
    workspaceId,
    permission: "workspace:admin",
    userRole: jwtPayload?.role,
  });
  if (!authResult.allowed) {
    throw new Error("Forbidden: insufficient permissions");
  }

  const members = await db
    .select({
      userId: workspaceMembers.userId,
      roleId: roles.id,
      roleName: roles.name,
      joinedAt: workspaceMembers.joinedAt,
    })
    .from(workspaceMembers)
    .innerJoin(roles, eq(workspaceMembers.roleId, roles.id))
    .where(eq(workspaceMembers.workspaceId, workspaceId));

  // Convert Date objects to ISO strings
  const transformedMembers = members.map((member) => ({
    ...member,
    joinedAt: member.joinedAt ? member.joinedAt.toISOString() : new Date().toISOString(),
  }));

  return c.json({ members: transformedMembers } satisfies z.infer<
    typeof WorkspaceMembersResponseSchema
  >);
};

// Create workspace
export const createWorkspaceRoute = createRoute({
  method: "post",
  path: "/internal/workspaces",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateWorkspaceRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: WorkspaceResponseSchema,
        },
      },
      description: "Workspace created successfully",
    },
  },
  tags: ["Workspaces"],
  summary: "Create workspace",
  description: "Creates a new workspace",
});

export const createWorkspaceHandler: RouteHandler<typeof createWorkspaceRoute> = async (c) => {
  const { name, organizationId, createdBy } = c.req.valid("json");
  const jwtPayload = (c as unknown as ContextWithJwt).get("jwtPayload");

  // Authorization check: org:workspaces permission required
  const authResult = await authorizationUseCase.execute({
    userId: jwtPayload?.sub ?? "",
    organizationId,
    permission: "org:workspaces",
    userRole: jwtPayload?.role,
  });
  if (!authResult.allowed) {
    throw new Error("Forbidden: insufficient permissions");
  }

  const result = await db
    .insert(workspaces)
    .values({
      name,
      organizationId,
    })
    .returning();

  const workspace = result[0];
  if (!workspace) {
    throw new Error("Failed to create workspace");
  }

  // Add creator as workspace:admin
  if (createdBy) {
    await db.insert(workspaceMembers).values({
      userId: createdBy,
      workspaceId: workspace.id,
      roleId: "workspace:admin",
    });
  }

  // Convert Date objects to ISO strings
  const transformedWorkspace = {
    id: workspace.id,
    name: workspace.name,
    organizationId: workspace.organizationId,
    createdAt: workspace.createdAt ? workspace.createdAt.toISOString() : new Date().toISOString(),
  };

  return c.json({ workspace: transformedWorkspace }, 201);
};

// Update workspace
export const updateWorkspaceRoute = createRoute({
  method: "put",
  path: "/internal/workspaces/{id}",
  request: {
    params: WorkspaceIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateWorkspaceRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: WorkspaceResponseSchema,
        },
      },
      description: "Workspace updated successfully",
    },
  },
  tags: ["Workspaces"],
  summary: "Update workspace",
  description: "Updates the specified workspace",
});

export const updateWorkspaceHandler: RouteHandler<typeof updateWorkspaceRoute> = async (c) => {
  const { id: workspaceId } = c.req.valid("param");
  const { name } = c.req.valid("json");
  const jwtPayload = (c as unknown as ContextWithJwt).get("jwtPayload");

  // Authorization check: workspace:admin permission required
  const authResult = await authorizationUseCase.execute({
    userId: jwtPayload?.sub ?? "",
    workspaceId,
    permission: "workspace:admin",
    userRole: jwtPayload?.role,
  });
  if (!authResult.allowed) {
    throw new Error("Forbidden: insufficient permissions");
  }

  const [workspace] = await db
    .update(workspaces)
    .set({ name })
    .where(eq(workspaces.id, workspaceId))
    .returning();

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  // Convert Date objects to ISO strings
  const transformedWorkspace = {
    id: workspace.id,
    name: workspace.name,
    organizationId: workspace.organizationId,
    createdAt: workspace.createdAt ? workspace.createdAt.toISOString() : new Date().toISOString(),
  };

  return c.json({ workspace: transformedWorkspace } satisfies z.infer<
    typeof WorkspaceResponseSchema
  >);
};

// Delete workspace
export const deleteWorkspaceRoute = createRoute({
  method: "delete",
  path: "/internal/workspaces/{id}",
  request: {
    params: WorkspaceIdParamSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: DeleteWorkspaceResponseSchema,
        },
      },
      description: "Workspace deleted successfully",
    },
  },
  tags: ["Workspaces"],
  summary: "Delete workspace",
  description: "Deletes the specified workspace",
});

export const deleteWorkspaceHandler: RouteHandler<typeof deleteWorkspaceRoute> = async (c) => {
  const { id: workspaceId } = c.req.valid("param");
  const jwtPayload = (c as unknown as ContextWithJwt).get("jwtPayload");

  // Authorization check: workspace:admin permission required
  const authResult = await authorizationUseCase.execute({
    userId: jwtPayload?.sub ?? "",
    workspaceId,
    permission: "workspace:admin",
    userRole: jwtPayload?.role,
  });
  if (!authResult.allowed) {
    throw new Error("Forbidden: insufficient permissions");
  }

  // First delete members (due to foreign key constraints)
  await db.delete(workspaceMembers).where(eq(workspaceMembers.workspaceId, workspaceId));

  // Then delete the workspace
  const [deleted] = await db.delete(workspaces).where(eq(workspaces.id, workspaceId)).returning();

  if (!deleted) {
    throw new Error("Workspace not found");
  }

  return c.json({ message: "Workspace deleted successfully" } satisfies z.infer<
    typeof DeleteWorkspaceResponseSchema
  >);
};

// ------------------------------------------------
// User's workspace list
// ------------------------------------------------

const UserWorkspacesRequestSchema = z
  .object({
    userId: z.string().openapi({ example: "user123" }),
  })
  .openapi("UserWorkspacesRequest");

const WorkspaceInfoSchema = z
  .object({
    workspaceId: z.uuid().openapi({ example: "00000000-0000-0000-0000-000000000001" }),
    workspaceName: z.string().openapi({ example: "Workspace Name" }),
    roleId: z.string().openapi({ example: "workspace:admin" }),
    roleName: z.string().openapi({ example: "Workspace Admin" }),
    joinedAt: z.string().datetime().openapi({ example: "2024-01-01T00:00:00Z" }),
  })
  .openapi("WorkspaceInfo");

const OrganizationInfoSchema = z
  .object({
    organizationId: z.uuid().openapi({ example: "00000000-0000-0000-0000-000000000001" }),
    organizationName: z.string().openapi({ example: "Organization Name" }),
    organizationSlug: z.string().openapi({ example: "org-slug" }),
    workspaces: z.array(WorkspaceInfoSchema),
  })
  .openapi("OrganizationInfo");

const UserWorkspacesResponseSchema = z
  .object({
    organizations: z.array(OrganizationInfoSchema),
  })
  .openapi("UserWorkspacesResponse");

// Endpoint to get user's workspace list
export const getUserWorkspacesRoute = createRoute({
  method: "post",
  path: "/internal/user-workspaces",
  request: {
    body: {
      content: {
        "application/json": {
          schema: UserWorkspacesRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UserWorkspacesResponseSchema,
        },
      },
      description: "User's workspace list",
    },
  },
  tags: ["Workspaces"],
  summary: "Get user's workspace list",
  description: "Retrieves the list of workspaces and organizations that the specified user belongs to",
});

export const getUserWorkspacesHandler: RouteHandler<typeof getUserWorkspacesRoute> = async (c) => {
  const { userId } = c.req.valid("json");

  // Get workspaces, organizations, and roles that the user belongs to
  const userWorkspaces = await db
    .select({
      workspaceId: workspaces.id,
      workspaceName: workspaces.name,
      workspaceCreatedAt: workspaces.createdAt,
      organizationId: organizations.id,
      organizationName: organizations.name,
      organizationSlug: organizations.slug,
      roleId: roles.id,
      roleName: roles.name,
      joinedAt: workspaceMembers.joinedAt,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .innerJoin(organizations, eq(workspaces.organizationId, organizations.id))
    .innerJoin(roles, eq(workspaceMembers.roleId, roles.id))
    .where(eq(workspaceMembers.userId, userId));

  // Group by organization
  const grouped = userWorkspaces.reduce(
    (acc, item) => {
      const orgId = item.organizationId;
      if (!acc[orgId]) {
        acc[orgId] = {
          organizationId: item.organizationId,
          organizationName: item.organizationName,
          organizationSlug: item.organizationSlug,
          workspaces: [],
        };
      }
      acc[orgId].workspaces.push({
        workspaceId: item.workspaceId,
        workspaceName: item.workspaceName,
        roleId: item.roleId,
        roleName: item.roleName,
        joinedAt: item.joinedAt ? item.joinedAt.toISOString() : new Date().toISOString(),
      });
      return acc;
    },
    {} as Record<string, z.infer<typeof OrganizationInfoSchema>>
  );

  return c.json({
    organizations: Object.values(grouped),
  } satisfies z.infer<typeof UserWorkspacesResponseSchema>);
};
