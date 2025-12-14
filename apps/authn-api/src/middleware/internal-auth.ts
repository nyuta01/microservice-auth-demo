import { createMiddleware } from "hono/factory";

const EXPECTED_SECRET = process.env.INTERNAL_API_SECRET;

if (!EXPECTED_SECRET) {
  throw new Error("INTERNAL_API_SECRET environment variable is required");
}

/**
 * Authentication middleware for internal API
 * Verifies the X-Internal-Secret header
 */
export const verifyInternalSecret = createMiddleware(async (c, next) => {
  const secret = c.req.header("X-Internal-Secret");
  if (secret !== EXPECTED_SECRET) {
    return c.json({ error: "Forbidden: Invalid internal secret" }, 403);
  }
  await next();
});
