/**
 * Authorization use case
 * Abstracts database access for testable design
 */

// Repository interface (for dependency injection)
export interface AuthorizationRepository {
  findOrganizationMember(
    userId: string,
    organizationId: string
  ): Promise<{ roleId: string } | null>;

  findWorkspaceMember(
    userId: string,
    workspaceId: string
  ): Promise<{ roleId: string } | null>;

  hasRolePermission(roleId: string, permissionId: string): Promise<boolean>;

  findWorkspace(workspaceId: string): Promise<{ organizationId: string } | null>;
}

// Authorization check result
export interface AuthorizationResult {
  allowed: boolean;
  reason?: string;
}

// Authorization request
export interface AuthorizationRequest {
  userId: string;
  organizationId?: string;
  workspaceId?: string;
  permission: string;
  userRole?: string; // 'admin' = super-admin, can perform all operations
}

// Constant for super-admin determination
const SUPER_ADMIN_ROLE = "admin";

/**
 * Authorization use case
 *
 * Permission check rules:
 * 1. If permission starts with "org:" → Check Organization-level permission
 * 2. If permission starts with "workspace:" → Check Workspace-level permission
 * 3. Organization administrators (with org:workspaces permission) can access all Workspaces
 */
export class AuthorizationUseCase {
  constructor(private readonly repository: AuthorizationRepository) {}

  /**
   * Main entry point for permission checks
   */
  async execute(request: AuthorizationRequest): Promise<AuthorizationResult> {
    const { permission, userRole } = request;

    // Super-admin (role: 'admin') can perform all operations
    if (userRole === SUPER_ADMIN_ROLE) {
      return { allowed: true, reason: "Super-admin has full access" };
    }

    if (permission.startsWith("org:")) {
      return this.checkOrganizationPermission(request);
    }

    return this.checkWorkspacePermission(request);
  }

  /**
   * Organization-level permission check
   */
  private async checkOrganizationPermission(
    request: AuthorizationRequest
  ): Promise<AuthorizationResult> {
    const { userId, organizationId, permission } = request;

    if (!organizationId) {
      return { allowed: false, reason: "Missing organizationId for org-level permission" };
    }

    const allowed = await this.hasOrganizationPermission(userId, organizationId, permission);
    if (allowed) {
      return { allowed: true };
    }

    return { allowed: false, reason: "Insufficient organization permission" };
  }

  /**
   * Workspace-level permission check
   *
   * AuthZ API only checks if user has the permission.
   * Ownership verification (for :own permissions) should be done by business services.
   */
  private async checkWorkspacePermission(
    request: AuthorizationRequest
  ): Promise<AuthorizationResult> {
    const { userId, workspaceId, permission } = request;

    if (!workspaceId) {
      return { allowed: false, reason: "Missing workspaceId for workspace-level permission" };
    }

    // Get Organization ID from Workspace
    const workspace = await this.repository.findWorkspace(workspaceId);
    if (!workspace) {
      return { allowed: false, reason: "Workspace not found" };
    }

    // Organization administrators can access all Workspaces (if they have org:workspaces permission)
    const isOrgAdmin = await this.hasOrganizationPermission(
      userId,
      workspace.organizationId,
      "org:workspaces"
    );
    if (isOrgAdmin) {
      return { allowed: true };
    }

    // Check Workspace-level permission
    const member = await this.repository.findWorkspaceMember(userId, workspaceId);
    if (!member) {
      return { allowed: false, reason: "Insufficient permission" };
    }

    // Check if user has the permission (direct check)
    // For :own permissions, AuthZ only checks if user has the permission.
    // Business service is responsible for verifying ownership.
    const hasPermission = await this.repository.hasRolePermission(member.roleId, permission);
    if (hasPermission) {
      return { allowed: true };
    }

    // For :own permissions, also check if user has :all permission (which implies :own)
    if (permission.endsWith(":own")) {
      const allPermission = permission.replace(/:own$/, ":all");
      const hasAllPermission = await this.repository.hasRolePermission(member.roleId, allPermission);
      if (hasAllPermission) {
        return { allowed: true };
      }
    }

    return { allowed: false, reason: "Insufficient permission" };
  }

  /**
   * Check if user has Organization permission
   */
  private async hasOrganizationPermission(
    userId: string,
    organizationId: string,
    permission: string
  ): Promise<boolean> {
    const member = await this.repository.findOrganizationMember(userId, organizationId);
    if (!member) {
      return false;
    }

    return this.repository.hasRolePermission(member.roleId, permission);
  }
}
