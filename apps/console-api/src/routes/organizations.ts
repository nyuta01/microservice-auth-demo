/**
 * Organization management route
 */
import { checkPermission } from "@repo/api-clients";
import type { JwtUser } from "@repo/api-middleware";
import type { UserWorkspacesResponse } from "@repo/types";
import { Hono } from "hono";
import { callAuthZApi } from "../lib/authz-client";

type Env = {
  Variables: {
    user: JwtUser;
    userId: string;
  };
};

const organizations = new Hono<Env>();

/**
 * Get list of user's organizations
 * Only return organizations with org:manage permission (organizations with console access)
 */
organizations.get("/", async (c) => {
  const user = c.get("user");
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  // Get list of user's organizations from AuthZ API
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

  // Exclude null values and return only organization information
  const orgs = orgsWithPermission
    .filter((org): org is NonNullable<typeof org> => org !== null)
    .map((org) => ({
      id: org.organizationId,
      name: org.organizationName,
      slug: org.organizationSlug,
      workspaceCount: org.workspaces.length,
    }));

  return c.json({ organizations: orgs });
});

/**
 * Get organization details
 */
organizations.get("/:organizationId", async (c) => {
  const user = c.get("user");
  const organizationId = c.req.param("organizationId");
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  // Permission check: org:manage
  const isAllowed = await checkPermission({
    userId: user.sub,
    organizationId,
    permission: "org:manage",
    token,
  });

  if (!isAllowed) {
    throw new Error("Forbidden");
  }

  // Get user's organization information from AuthZ API
  const data = await callAuthZApi<UserWorkspacesResponse>("/internal/user-workspaces", "POST", {
    userId: user.sub,
  });

  const org = data.organizations.find((o) => o.organizationId === organizationId);
  if (!org) {
    throw new Error("Organization not found");
  }

  return c.json({
    organization: {
      id: org.organizationId,
      name: org.organizationName,
      slug: org.organizationSlug,
      workspaces: org.workspaces,
    },
  });
});

export { organizations };
