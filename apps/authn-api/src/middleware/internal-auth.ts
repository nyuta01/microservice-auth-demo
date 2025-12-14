import { createMiddleware } from "hono/factory";

const EXPECTED_SECRET = process.env.INTERNAL_API_SECRET || "internal_shared_secret_key";

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
