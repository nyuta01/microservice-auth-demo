/**
 * User workspaces route
 * For task-web/document-web: Get workspace information without org:manage permission
 */
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

const userWorkspaces = new Hono<Env>();

/**
 * List of workspaces accessible to the user
 * Do not filter by org:manage permission (for task-web/document-web)
 * For super-admin (role: 'admin'), return all organizations
 */
userWorkspaces.get("/", async (c) => {
  const user = c.get("user");
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  // For super-admin, get all organizations
  if (user.role === "admin") {
    const allOrgs = await callAuthZApi<UserWorkspacesResponse>("/internal/organizations", { token });
    return c.json({
      user: {
        id: user.sub,
        email: user.email,
        name: user.name,
      },
      organizations: allOrgs.organizations,
    });
  }

  // Get list of organizations and workspaces that the user belongs to
  const data = await callAuthZApi<UserWorkspacesResponse>("/internal/user-workspaces", {
    method: "POST",
    body: { userId: user.sub },
    token,
  });

  return c.json({
    user: {
      id: user.sub,
      email: user.email,
      name: user.name,
    },
    organizations: data.organizations,
  });
});

export { userWorkspaces };
