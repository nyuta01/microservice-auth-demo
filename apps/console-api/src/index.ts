import { serve } from "@hono/node-server";
import { corsConfig, createErrorHandler, type JwtUser, notFoundHandler, verifyJwt } from "@repo/api-middleware";
import { Hono } from "hono";
import { cors } from "hono/cors";

// Import routes
import { dashboard } from "./routes/dashboard";
import { members } from "./routes/members";
import { organizations } from "./routes/organizations";
import { portal } from "./routes/portal";
import { userWorkspaces } from "./routes/user-workspaces";
import { workspaces } from "./routes/workspaces";

const app = new Hono<{
  Variables: {
    user: JwtUser;
    userId: string;
  };
}>();

// CORS
app.use("*", cors(corsConfig));

// Authentication middleware (JWT verification)
app.use("/api/*", verifyJwt("Console API"));

// Mount routes
app.route("/api/portal", portal);
app.route("/api/user-workspaces", userWorkspaces);
app.route("/api/organizations", organizations);
app.route("/api/workspaces", workspaces);
app.route("/api/members", members);
app.route("/api/dashboard", dashboard);

// Alias for backward compatibility
// Redirect old endpoint /api/console/* to /api/dashboard/*
app.get("/api/console/dashboard", async (c) => {
  return c.redirect("/api/dashboard", 301);
});
app.get("/api/console/search", async (c) => {
  return c.redirect("/api/dashboard/search", 301);
});
app.get("/api/console/stats", async (c) => {
  return c.redirect("/api/dashboard/stats", 301);
});
app.get("/api/console/workspaces", async (c) => {
  return c.redirect("/api/workspaces", 301);
});
app.get("/api/console/users", async (c) => {
  return c.redirect("/api/members", 301);
});

// Error handling
app.onError(createErrorHandler("Console API"));
app.notFound(notFoundHandler);

console.log("Console API running on port 10200");

serve({
  fetch: app.fetch,
  port: 10200,
});
