import { serve } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { corsConfig, createErrorHandler, type JwtUser, notFoundHandler, verifyJwt } from "@repo/api-middleware";
import { cors } from "hono/cors";
import documents from "./routes/documents.js";

const app = new OpenAPIHono<{
  Variables: {
    user: JwtUser;
    userId: string;
  };
}>();

// CORS
app.use("*", cors(corsConfig));

// Authentication middleware (JWT verification)
app.use("/api/documents/*", verifyJwt("Document API"));

// Mount routes
app.route("/api/documents", documents);

// OpenAPI documentation
app.doc("/api/doc", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "Document API",
    description: "Document management API",
  },
  servers: [
    {
      url: "http://localhost:10101",
      description: "Development environment",
    },
  ],
});

// Error handling
app.onError(createErrorHandler("Document API"));
app.notFound(notFoundHandler);

const port = 10101;
console.log(`Document API running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
