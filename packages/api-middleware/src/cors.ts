/**
 * Common CORS configuration
 * Allows access from all web applications
 */
export const corsConfig = {
  origin: [
    "http://localhost:20100", // Task Web
    "http://localhost:20101", // Document Web
    "http://localhost:20102", // Schedule Web
    "http://localhost:20200", // Console Web
    "http://localhost:20201", // System Admin Web
  ],
  allowHeaders: [
    "Authorization",
    "Content-Type",
    "X-Workspace-ID",
    "X-Organization-ID",
    "X-Internal-Secret",
  ],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
  credentials: true,
};
