import type { Context, ErrorHandler } from "hono";

/**
 * Generate common error handler
 *
 * @param serviceName - Service name for log output (optional)
 * @returns Hono ErrorHandler
 */
export const createErrorHandler = (serviceName?: string): ErrorHandler => {
  const logPrefix = serviceName ? `[${serviceName}]` : "[API]";

  return (err: Error, c: Context) => {
    console.error(`${logPrefix} Error:`, err);

    if (err instanceof Error) {
      const message = err.message;

      // Unauthorized / Forbidden
      if (message.includes("Unauthorized") || message.includes("Forbidden")) {
        const status = message.includes("Unauthorized") ? 401 : 403;
        return c.json({ error: message }, status);
      }

      // Validation errors
      if (message.includes("validation") || message.includes("Invalid") || message.includes("required")) {
        return c.json({ error: message }, 400);
      }

      // Not found errors
      if (message.toLowerCase().includes("not found")) {
        return c.json({ error: message }, 404);
      }
    }

    return c.json({ error: "Internal server error" }, 500);
  };
};

/**
 * Common 404 handler
 */
export const notFoundHandler = (c: Context) => {
  return c.json({ error: "Not found" }, 404);
};
