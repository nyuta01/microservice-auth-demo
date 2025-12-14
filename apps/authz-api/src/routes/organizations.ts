import { type RouteHandler, createRoute, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { organizationMembers, organizations, roles, workspaces } from "../db/schema";
import type { JwtPayload } from "../middleware/internal-auth";
import { authorizationUseCase } from "./authorize";

type ContextWithJwt = { get(key: "jwtPayload"): JwtPayload | undefined };

// Schema definitions
const OrganizationIdParamSchema = z.object({
  organizationId: z.uuid().openapi({
    param: {
      name: "organizationId",
      in: "path",
    },
    description: "Organization ID",
    example: "00000000-0000-0000-0000-000000000001",
  }),
});

const OrganizationMemberSchema = z
  .object({
    userId: z.string().openapi({ example: "user123" }),
    roleId: z.string().openapi({ example: "org:owner" }),
    roleName: z.string().openapi({ example: "Organization Owner" }),
    joinedAt: z.string().datetime().openapi({ example: "2024-01-01T00:00:00Z" }),
  })
  .openapi("OrganizationMember");

const OrganizationMembersResponseSchema = z
  .object({
    members: z.array(OrganizationMemberSchema),
  })
  .openapi("OrganizationMembersResponse");

// Get organization members list
export const getOrganizationMembersRoute = createRoute({
  method: "get",
  path: "/internal/organizations/{organizationId}/members",
  request: {
    params: OrganizationIdParamSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: OrganizationMembersResponseSchema,
        },
      },
      description: "Organization members list",
    },
  },
  tags: ["Organizations"],
  summary: "Get organization members list",
  description: "Retrieve the list of members for the specified organization",
});

export const getOrganizationMembersHandler: RouteHandler<typeof getOrganizationMembersRoute> = async (c) => {
  const { organizationId } = c.req.valid("param");
  const jwtPayload = (c as unknown as ContextWithJwt).get("jwtPayload");

  // Authorization check: org:users permission required
  const authResult = await authorizationUseCase.execute({
    userId: jwtPayload?.sub ?? "",
    organizationId,
    permission: "org:users",
    userRole: jwtPayload?.role,
  });
  if (!authResult.allowed) {
    throw new Error("Forbidden: insufficient permissions");
  }

  const members = await db
    .select({
      userId: organizationMembers.userId,
      roleId: roles.id,
      roleName: roles.name,
      joinedAt: organizationMembers.joinedAt,
    })
    .from(organizationMembers)
    .innerJoin(roles, eq(organizationMembers.roleId, roles.id))
    .where(eq(organizationMembers.organizationId, organizationId));

  // Convert Date objects to ISO strings
  const transformedMembers = members.map((member) => ({
    ...member,
    joinedAt: member.joinedAt ? member.joinedAt.toISOString() : new Date().toISOString(),
  }));

  return c.json({ members: transformedMembers } satisfies z.infer<
    typeof OrganizationMembersResponseSchema
  >);
};

// ------------------------------------------------
// Get all organizations list (for super-admin)
// ------------------------------------------------

const WorkspaceInfoSchema = z
  .object({
    workspaceId: z.uuid().openapi({ example: "00000000-0000-0000-0000-000000000001" }),
    workspaceName: z.string().openapi({ example: "Workspace Name" }),
    roleId: z.string().openapi({ example: "workspace:owner" }),
    roleName: z.string().openapi({ example: "Workspace Owner" }),
    joinedAt: z.string().datetime().openapi({ example: "2024-01-01T00:00:00Z" }),
  })
  .openapi("WorkspaceInfoForOrg");

const OrganizationWithWorkspacesSchema = z
  .object({
    organizationId: z.uuid().openapi({ example: "00000000-0000-0000-0000-000000000001" }),
    organizationName: z.string().openapi({ example: "Organization Name" }),
    organizationSlug: z.string().openapi({ example: "org-slug" }),
    workspaces: z.array(WorkspaceInfoSchema),
  })
  .openapi("OrganizationWithWorkspaces");

const AllOrganizationsResponseSchema = z
  .object({
    organizations: z.array(OrganizationWithWorkspacesSchema),
  })
  .openapi("AllOrganizationsResponse");

export const getAllOrganizationsRoute = createRoute({
  method: "get",
  path: "/internal/organizations",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: AllOrganizationsResponseSchema,
        },
      },
      description: "All organizations list (for super-admin)",
    },
  },
  tags: ["Organizations"],
  summary: "Get all organizations list",
  description: "Retrieve all organizations and their workspace list (for super-admin)",
});

export const getAllOrganizationsHandler: RouteHandler<typeof getAllOrganizationsRoute> = async (c) => {
  const jwtPayload = (c as unknown as ContextWithJwt).get("jwtPayload");

  // Super-admin only
  if (jwtPayload?.role !== "admin") {
    throw new Error("Forbidden: super-admin only");
  }

  // Retrieve all organizations
  const allOrgs = await db.select().from(organizations);

  // Retrieve workspaces for each organization
  const result = await Promise.all(
    allOrgs.map(async (org) => {
      const orgWorkspaces = await db
        .select({
          workspaceId: workspaces.id,
          workspaceName: workspaces.name,
          createdAt: workspaces.createdAt,
        })
        .from(workspaces)
        .where(eq(workspaces.organizationId, org.id));

      return {
        organizationId: org.id,
        organizationName: org.name,
        organizationSlug: org.slug,
        workspaces: orgWorkspaces.map((ws) => ({
          workspaceId: ws.workspaceId,
          workspaceName: ws.workspaceName,
          roleId: "admin",
          roleName: "System Admin",
          joinedAt: ws.createdAt ? ws.createdAt.toISOString() : new Date().toISOString(),
        })),
      };
    })
  );

  return c.json({ organizations: result } satisfies z.infer<typeof AllOrganizationsResponseSchema>);
};
