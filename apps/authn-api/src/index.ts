import { config } from "dotenv";
import { resolve } from "path";

// Load .env file from root directory
config({ path: resolve(__dirname, "../../../.env") });

import { serve } from "@hono/node-server";
import { corsConfig, createErrorHandler, notFoundHandler } from "@repo/api-middleware";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./auth";
import { admin } from "./routes/admin";

const app = new Hono();

// CORS configuration
app.use("/api/*", cors(corsConfig));

// Better Auth handler
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

// Mount routes
app.route("/api/admin", admin);

// Error handling
app.onError(createErrorHandler("AuthN API"));
app.notFound(notFoundHandler);

const PORT = 10000;
console.log(`AuthN API running on port ${PORT}`);

serve({
  fetch: app.fetch,
  port: PORT,
});
