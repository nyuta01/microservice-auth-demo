import { createMiddleware } from "hono/factory";
import { createRemoteJWKSet, jwtVerify } from "jose";

const SECRET = process.env.INTERNAL_API_SECRET;

if (!SECRET) {
  throw new Error("INTERNAL_API_SECRET environment variable is required");
}

// JWKS configuration for JWT verification
const authUrl = process.env.BETTER_AUTH_URL || "http://localhost:10000";
const jwksUrl = new URL("/api/auth/jwks", authUrl);
const JWKS = createRemoteJWKSet(jwksUrl);

/**
 * JWT payload type definition
 */
export interface JwtPayload {
  sub: string;
  role?: string;
  email?: string;
  [key: string]: unknown;
}

/**
 * Authentication middleware for internal API (Internal Secret only)
 * For endpoints that do not require JWT verification
 */
export const verifyInternalSecret = createMiddleware(async (c, next) => {
  const secret = c.req.header("X-Internal-Secret");
  if (secret !== SECRET) {
    throw new Error("Forbidden: Invalid internal secret");
  }
  await next();
});

/**
 * Zero Trust authentication middleware (Internal Secret + JWT)
 * Used when role needs to be extracted from JWT, such as in Authorize endpoint
 */
export const verifyInternalWithJwt = createMiddleware<{
  Variables: {
    jwtPayload: JwtPayload;
  };
}>(async (c, next) => {
  // 1. Verify Internal Secret
  const secret = c.req.header("X-Internal-Secret");
  if (secret !== SECRET) {
    throw new Error("Forbidden: Invalid internal secret");
  }

  // 2. Verify JWT (if Authorization header is present)
  const authHeader = c.req.header("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWKS, {
          algorithms: ["EdDSA"],
        });

        const userId =
          (typeof payload.sub === "string" ? payload.sub : null) ||
          (typeof payload.id === "string" ? payload.id : null);

        if (userId) {
          c.set("jwtPayload", {
            ...payload,
            sub: userId,
          } as JwtPayload);
        }
      } catch (e) {
        console.error("[AuthZ API] JWT verification failed:", e);
        // Continue if Internal Secret is valid even if JWT is invalid (backward compatibility)
        // However, jwtPayload will not be set
      }
    }
  }

  await next();
});
