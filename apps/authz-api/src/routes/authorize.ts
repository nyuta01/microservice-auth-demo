import { type RouteHandler, createRoute, z } from "@hono/zod-openapi";
import type { JwtPayload } from "../middleware/internal-auth.js";
import { authorizationRepository } from "../repositories/authorization";
import { AuthorizationUseCase } from "../usecases/authorization";

// Use case instance (inject repository)
const authorizationUseCase = new AuthorizationUseCase(authorizationRepository);

// Schema definitions
// Note: userRole is kept for backward compatibility, but role from JWT takes priority
const AuthorizeRequestSchema = z
  .object({
    userId: z.string().openapi({ example: "user123" }),
    organizationId: z.uuid().optional().openapi({ example: "00000000-0000-0000-0000-000000000001" }),
    workspaceId: z.uuid().optional().openapi({ example: "00000000-0000-0000-0000-000000000001" }),
    permission: z.string().openapi({ example: "workspace:task:read" }),
    userRole: z.string().optional().openapi({
      example: "admin",
      description: "Deprecated: role from JWT takes priority. Kept for backward compatibility",
      deprecated: true,
    }),
  })
  .openapi("AuthorizeRequest");

const AuthorizeResponseSchema = z
  .object({
    allowed: z.boolean().openapi({ example: true }),
    reason: z.string().optional().openapi({ example: "Insufficient permission" }),
  })
  .openapi("AuthorizeResponse");

// Permission check endpoint
export const authorizeRoute = createRoute({
  method: "post",
  path: "/internal/authorize",
  request: {
    body: {
      content: {
        "application/json": {
          schema: AuthorizeRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: AuthorizeResponseSchema,
        },
      },
      description: "Permission check result",
    },
  },
  tags: ["Authorization"],
  summary: "Check permission",
  description:
    "Checks if a user has the specified permission. Scope is determined by the permission prefix (org:/workspace:).",
});

export const authorizeHandler: RouteHandler<typeof authorizeRoute> = async (c) => {
  const request = c.req.valid("json");

  // Zero Trust: prioritize role from JWT (already validated by middleware)
  // Note: set by verifyInternalWithJwt middleware
  const jwtPayload = (c as unknown as { get(key: "jwtPayload"): JwtPayload | undefined }).get(
    "jwtPayload"
  );
  const userRole = jwtPayload?.role ?? request.userRole;

  const result = await authorizationUseCase.execute({
    ...request,
    userRole,
  });
  return c.json(result);
};

// Export use case (can be used from other routes)
export { authorizationUseCase };
