/**
 * API Middleware Package
 * Provides middleware for use in Hono-based API services
 */

export { corsConfig } from "./cors.js";
export { createErrorHandler, notFoundHandler } from "./error-handler.js";
export type { ExtendedJwtUser, JwtUser } from "./verify-jwt.js";
export { verifyJwt } from "./verify-jwt.js";
