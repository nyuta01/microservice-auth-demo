import { serve } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { corsConfig, createErrorHandler, notFoundHandler } from "@repo/api-middleware";
import { cors } from "hono/cors";
import { verifyInternalSecret, verifyInternalWithJwt } from "./middleware/internal-auth.js";
import * as authorizeRoutes from "./routes/authorize.js";
import * as memberRoutes from "./routes/members.js";
import * as organizationRoutes from "./routes/organizations.js";
import * as workspaceRoutes from "./routes/workspaces.js";

const app = new OpenAPIHono();

// CORS configuration
app.use("*", cors(corsConfig));

// Internal API authentication middleware
// /internal/authorize also verifies JWT (Zero Trust: get role directly from JWT)
app.use("/internal/authorize", verifyInternalWithJwt);
// Other internal APIs only require Internal Secret
app.use("/internal/*", verifyInternalSecret);

// Mount routes
app.openapi(authorizeRoutes.authorizeRoute, authorizeRoutes.authorizeHandler);
app.openapi(workspaceRoutes.getUserWorkspacesRoute, workspaceRoutes.getUserWorkspacesHandler);
app.openapi(workspaceRoutes.getWorkspaceMembersRoute, workspaceRoutes.getWorkspaceMembersHandler);
app.openapi(
  organizationRoutes.getOrganizationMembersRoute,
  organizationRoutes.getOrganizationMembersHandler
);
app.openapi(
  organizationRoutes.getAllOrganizationsRoute,
  organizationRoutes.getAllOrganizationsHandler
);
app.openapi(workspaceRoutes.createWorkspaceRoute, workspaceRoutes.createWorkspaceHandler);
app.openapi(workspaceRoutes.updateWorkspaceRoute, workspaceRoutes.updateWorkspaceHandler);
app.openapi(workspaceRoutes.deleteWorkspaceRoute, workspaceRoutes.deleteWorkspaceHandler);

// Member management routes
app.openapi(memberRoutes.addOrganizationMemberRoute, memberRoutes.addOrganizationMemberHandler);
app.openapi(memberRoutes.removeOrganizationMemberRoute, memberRoutes.removeOrganizationMemberHandler);
app.openapi(memberRoutes.updateOrganizationMemberRoleRoute, memberRoutes.updateOrganizationMemberRoleHandler);
app.openapi(memberRoutes.addWorkspaceMemberRoute, memberRoutes.addWorkspaceMemberHandler);
app.openapi(memberRoutes.removeWorkspaceMemberRoute, memberRoutes.removeWorkspaceMemberHandler);
app.openapi(memberRoutes.updateWorkspaceMemberRoleRoute, memberRoutes.updateWorkspaceMemberRoleHandler);

// OpenAPI documentation
app.doc("/api/doc", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "AuthZ API",
    description: "Authorization Management API",
  },
  servers: [
    {
      url: "http://localhost:10001",
      description: "Development",
    },
  ],
});

// Error handling
app.onError(createErrorHandler("AuthZ API"));
app.notFound(notFoundHandler);

const port = 10001;
console.log(`AuthZ API running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
