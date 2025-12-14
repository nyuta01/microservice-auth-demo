/**
 * Portal route
 * Provides entry point information for each business service
 */
import { checkPermission } from "@repo/api-clients";
import type { JwtUser } from "@repo/api-middleware";
import type { OrganizationWithWorkspaces, UserWorkspacesResponse } from "@repo/types";
import { Hono } from "hono";
import { callAuthZApi } from "../lib/authz-client";

type Env = {
  Variables: {
    user: JwtUser;
    userId: string;
  };
};

// Service information
const SERVICES = {
  task: {
    name: "Task",
    description: "Task management",
    apiUrl: process.env.SERVICE_URL_TASK_API || "http://localhost:10100",
    webUrl: process.env.SERVICE_URL_TASK_WEB || "http://localhost:20100",
  },
  document: {
    name: "Document",
    description: "Document management",
    apiUrl: process.env.SERVICE_URL_DOCUMENT_API || "http://localhost:10101",
    webUrl: process.env.SERVICE_URL_DOCUMENT_WEB || "http://localhost:20101",
  },
};

const portal = new Hono<Env>();

/**
 * Get portal information
 * List of services, organizations, and workspaces accessible to the user
 * Only return organizations with org:manage permission (organizations with console access)
 * For super-admin (role: 'admin'), return all organizations
 */
portal.get("/", async (c) => {
  const user = c.get("user");
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  // For super-admin, get all organizations
  if (user.role === "admin") {
    const allOrgs = await callAuthZApi<UserWorkspacesResponse>("/internal/organizations", "GET");
    return c.json({
      user: {
        id: user.sub,
        email: user.email,
        name: user.name,
      },
      services: SERVICES,
      organizations: allOrgs.organizations,
    });
  }

  // Get list of organizations and workspaces that the user belongs to
  const data = await callAuthZApi<UserWorkspacesResponse>("/internal/user-workspaces", "POST", {
    userId: user.sub,
  });

  // Filter only organizations with org:manage permission
  const orgsWithPermission = await Promise.all(
    data.organizations.map(async (org) => {
      const isAllowed = await checkPermission({
        userId: user.sub,
        organizationId: org.organizationId,
        permission: "org:manage",
        token,
      });
      return isAllowed ? org : null;
    })
  );

  // Exclude null values
  const filteredOrganizations = orgsWithPermission.filter(
    (org): org is OrganizationWithWorkspaces => org !== null
  );

  return c.json({
    user: {
      id: user.sub,
      email: user.email,
      name: user.name,
    },
    services: SERVICES,
    organizations: filteredOrganizations,
  });
});

/**
 * Get list of services
 */
portal.get("/services", async (c) => {
  return c.json({ services: SERVICES });
});

export { portal };
