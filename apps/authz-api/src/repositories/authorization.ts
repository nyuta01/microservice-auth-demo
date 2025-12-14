/**
 * Authorization repository (database access layer)
 */
import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { organizationMembers, rolePermissions, workspaceMembers, workspaces } from "../db/schema";
import type { AuthorizationRepository } from "../usecases/authorization";

/**
 * Authorization repository implementation using Drizzle ORM
 */
export class DrizzleAuthorizationRepository implements AuthorizationRepository {
  async findOrganizationMember(
    userId: string,
    organizationId: string
  ): Promise<{ roleId: string } | null> {
    const results = await db
      .select({ roleId: organizationMembers.roleId })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.organizationId, organizationId)
        )
      )
      .limit(1);

    return results[0] ?? null;
  }

  async findWorkspaceMember(
    userId: string,
    workspaceId: string
  ): Promise<{ roleId: string } | null> {
    const results = await db
      .select({ roleId: workspaceMembers.roleId })
      .from(workspaceMembers)
      .where(
        and(eq(workspaceMembers.userId, userId), eq(workspaceMembers.workspaceId, workspaceId))
      )
      .limit(1);

    return results[0] ?? null;
  }

  async hasRolePermission(roleId: string, permissionId: string): Promise<boolean> {
    const results = await db
      .select()
      .from(rolePermissions)
      .where(and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.permissionId, permissionId)))
      .limit(1);

    return results.length > 0;
  }

  async findWorkspace(workspaceId: string): Promise<{ organizationId: string } | null> {
    const results = await db
      .select({ organizationId: workspaces.organizationId })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    return results[0] ?? null;
  }
}

// Singleton instance
export const authorizationRepository = new DrizzleAuthorizationRepository();
