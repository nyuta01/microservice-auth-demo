import { serve } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { corsConfig, createErrorHandler, type JwtUser, notFoundHandler, verifyJwt } from "@repo/api-middleware";
import { cors } from "hono/cors";
import tasks from "./routes/tasks.js";

const app = new OpenAPIHono<{
  Variables: {
    user: JwtUser;
    userId: string;
  };
}>();

// CORS
app.use("*", cors(corsConfig));

// Authentication middleware (JWT verification)
app.use("/api/tasks/*", verifyJwt("Task API"));

// Mount routes
app.route("/api/tasks", tasks);

// OpenAPI documentation
app.doc("/api/doc", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "Task API",
    description: "Task management API",
  },
  servers: [
    {
      url: "http://localhost:10100",
      description: "Development environment",
    },
  ],
});

// Error handling
app.onError(createErrorHandler("Task API"));
app.notFound(notFoundHandler);

const port = 10100;
console.log(`Task API running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
