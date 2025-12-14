import { describe, expect, it, vi } from "vitest";
import {
  type AuthorizationRepository,
  type AuthorizationRequest,
  AuthorizationUseCase,
} from "./authorization";

/**
 * Relationship between roles and permissions (from seed.ts)
 *
 * Organization roles:
 *   - org:owner  → org:manage, org:users, org:workspaces, org:settings
 *   - org:admin  → org:manage, org:users, org:workspaces, org:settings
 *   - org:member → No organization-level permissions (access only as Workspace member)
 *
 * Workspace roles:
 *   - workspace:admin  → workspace:admin, workspace:task:*, workspace:document:*, workspace:schedule:*
 *   - workspace:member → workspace:task:read/write, workspace:document:read/write, workspace:schedule:read/write
 *   - workspace:viewer → workspace:task:read, workspace:document:read, workspace:schedule:read
 */

// Test constants
const USER_ID = "user-123";
const ORG_ID = "org-456";
const WORKSPACE_ID = "workspace-789";

// Role-permission mapping (same as actual seed.ts)
const ROLE_PERMISSIONS: Record<string, string[]> = {
  "org:owner": ["org:manage", "org:users", "org:workspaces", "org:settings"],
  "org:admin": ["org:manage", "org:users", "org:workspaces", "org:settings"],
  "org:member": [], // No organization-level permissions (access only as Workspace member)
  "workspace:admin": [
    "workspace:admin",
    "workspace:task:read",
    "workspace:task:write",
    "workspace:task:delete",
    "workspace:task:assign",
    "workspace:document:read",
    "workspace:document:write",
    "workspace:document:delete",
    "workspace:schedule:read",
    "workspace:schedule:write",
    "workspace:schedule:delete",
  ],
  "workspace:member": [
    "workspace:task:read",
    "workspace:task:write",
    "workspace:document:read",
    "workspace:document:write",
    "workspace:schedule:read",
    "workspace:schedule:write",
  ],
  "workspace:viewer": [
    "workspace:task:read",
    "workspace:document:read",
    "workspace:schedule:read",
  ],
};

// Helper to create mock repository
function createMockRepository(config: {
  orgMemberRole?: string | null;
  workspaceMemberRole?: string | null;
  workspaceOrgId?: string | null;
}): AuthorizationRepository {
  const { orgMemberRole = null, workspaceMemberRole = null, workspaceOrgId = ORG_ID } = config;

  return {
    findOrganizationMember: vi.fn().mockImplementation((userId, orgId) => {
      if (userId === USER_ID && orgId === ORG_ID && orgMemberRole) {
        return Promise.resolve({ roleId: orgMemberRole });
      }
      return Promise.resolve(null);
    }),

    findWorkspaceMember: vi.fn().mockImplementation((userId, wsId) => {
      if (userId === USER_ID && wsId === WORKSPACE_ID && workspaceMemberRole) {
        return Promise.resolve({ roleId: workspaceMemberRole });
      }
      return Promise.resolve(null);
    }),

    hasRolePermission: vi.fn().mockImplementation((roleId, permissionId) => {
      const permissions = ROLE_PERMISSIONS[roleId] || [];
      return Promise.resolve(permissions.includes(permissionId));
    }),

    findWorkspace: vi.fn().mockImplementation((wsId) => {
      if (wsId === WORKSPACE_ID && workspaceOrgId) {
        return Promise.resolve({ organizationId: workspaceOrgId });
      }
      return Promise.resolve(null);
    }),
  };
}

describe("AuthorizationUseCase", () => {
  describe("Organization permission check (org:* permission)", () => {
    it("returns error when organizationId is missing", async () => {
      const repository = createMockRepository({});
      const useCase = new AuthorizationUseCase(repository);

      const result = await useCase.execute({
        userId: USER_ID,
        permission: "org:users",
      });

      expect(result).toEqual({
        allowed: false,
        reason: "Missing organizationId for org-level permission",
      });
    });

    it("returns insufficient permission when user is not an Organization member", async () => {
      const repository = createMockRepository({ orgMemberRole: null });
      const useCase = new AuthorizationUseCase(repository);

      const result = await useCase.execute({
        userId: USER_ID,
        organizationId: ORG_ID,
        permission: "org:users",
      });

      expect(result).toEqual({
        allowed: false,
        reason: "Insufficient organization permission",
      });
    });

    describe("org:owner role", () => {
      const repository = createMockRepository({ orgMemberRole: "org:owner" });
      const useCase = new AuthorizationUseCase(repository);

      it.each(["org:manage", "org:users", "org:workspaces", "org:settings"])(
        "has %s permission",
        async (permission) => {
          const result = await useCase.execute({
            userId: USER_ID,
            organizationId: ORG_ID,
            permission,
          });
          expect(result.allowed).toBe(true);
        }
      );
    });

    describe("org:admin role", () => {
      const repository = createMockRepository({ orgMemberRole: "org:admin" });
      const useCase = new AuthorizationUseCase(repository);

      it.each(["org:manage", "org:users", "org:workspaces", "org:settings"])(
        "has %s permission",
        async (permission) => {
          const result = await useCase.execute({
            userId: USER_ID,
            organizationId: ORG_ID,
            permission,
          });
          expect(result.allowed).toBe(true);
        }
      );
    });

    describe("org:member role", () => {
      const repository = createMockRepository({ orgMemberRole: "org:member" });
      const useCase = new AuthorizationUseCase(repository);

      it.each(["org:manage", "org:users", "org:workspaces", "org:settings"])(
        "does not have %s permission (cannot access console)",
        async (permission) => {
          const result = await useCase.execute({
            userId: USER_ID,
            organizationId: ORG_ID,
            permission,
          });
          expect(result.allowed).toBe(false);
        }
      );
    });
  });

  describe("Workspace permission check (workspace:* permission)", () => {
    it("returns error when workspaceId is missing", async () => {
      const repository = createMockRepository({});
      const useCase = new AuthorizationUseCase(repository);

      const result = await useCase.execute({
        userId: USER_ID,
        permission: "workspace:task:read",
      });

      expect(result).toEqual({
        allowed: false,
        reason: "Missing workspaceId for workspace-level permission",
      });
    });

    it("returns error when Workspace does not exist", async () => {
      const repository = createMockRepository({ workspaceOrgId: null });
      const useCase = new AuthorizationUseCase(repository);

      const result = await useCase.execute({
        userId: USER_ID,
        workspaceId: WORKSPACE_ID,
        permission: "workspace:task:read",
      });

      expect(result).toEqual({
        allowed: false,
        reason: "Workspace not found",
      });
    });

    describe("Organization administrator access to all Workspaces", () => {
      it("org:owner can access all Workspaces", async () => {
        const repository = createMockRepository({
          orgMemberRole: "org:owner",
          workspaceMemberRole: null, // Not a Workspace member
        });
        const useCase = new AuthorizationUseCase(repository);

        const result = await useCase.execute({
          userId: USER_ID,
          workspaceId: WORKSPACE_ID,
          permission: "workspace:task:read",
        });

        expect(result.allowed).toBe(true);
      });

      it("org:admin can access all Workspaces", async () => {
        const repository = createMockRepository({
          orgMemberRole: "org:admin",
          workspaceMemberRole: null,
        });
        const useCase = new AuthorizationUseCase(repository);

        const result = await useCase.execute({
          userId: USER_ID,
          workspaceId: WORKSPACE_ID,
          permission: "workspace:document:write",
        });

        expect(result.allowed).toBe(true);
      });

      it("org:member cannot access Workspace unless they are a Workspace member", async () => {
        const repository = createMockRepository({
          orgMemberRole: "org:member",
          workspaceMemberRole: null,
        });
        const useCase = new AuthorizationUseCase(repository);

        const result = await useCase.execute({
          userId: USER_ID,
          workspaceId: WORKSPACE_ID,
          permission: "workspace:task:read",
        });

        expect(result.allowed).toBe(false);
      });
    });

    describe("workspace:admin role", () => {
      const repository = createMockRepository({ workspaceMemberRole: "workspace:admin" });
      const useCase = new AuthorizationUseCase(repository);

      it.each([
        "workspace:task:read",
        "workspace:task:write",
        "workspace:task:delete",
        "workspace:task:assign",
        "workspace:document:read",
        "workspace:document:write",
        "workspace:document:delete",
        "workspace:schedule:read",
        "workspace:schedule:write",
        "workspace:schedule:delete",
      ])("has %s permission", async (permission) => {
        const result = await useCase.execute({
          userId: USER_ID,
          workspaceId: WORKSPACE_ID,
          permission,
        });
        expect(result.allowed).toBe(true);
      });
    });

    describe("workspace:member role", () => {
      const repository = createMockRepository({ workspaceMemberRole: "workspace:member" });
      const useCase = new AuthorizationUseCase(repository);

      it.each([
        "workspace:task:read",
        "workspace:task:write",
        "workspace:document:read",
        "workspace:document:write",
        "workspace:schedule:read",
        "workspace:schedule:write",
      ])("has %s permission", async (permission) => {
        const result = await useCase.execute({
          userId: USER_ID,
          workspaceId: WORKSPACE_ID,
          permission,
        });
        expect(result.allowed).toBe(true);
      });

      it.each([
        "workspace:task:delete",
        "workspace:task:assign",
        "workspace:document:delete",
        "workspace:schedule:delete",
      ])("does not have %s permission", async (permission) => {
        const result = await useCase.execute({
          userId: USER_ID,
          workspaceId: WORKSPACE_ID,
          permission,
        });
        expect(result.allowed).toBe(false);
      });
    });

    describe("workspace:viewer role", () => {
      const repository = createMockRepository({ workspaceMemberRole: "workspace:viewer" });
      const useCase = new AuthorizationUseCase(repository);

      it.each(["workspace:task:read", "workspace:document:read", "workspace:schedule:read"])(
        "has %s permission (read-only)",
        async (permission) => {
          const result = await useCase.execute({
            userId: USER_ID,
            workspaceId: WORKSPACE_ID,
            permission,
          });
          expect(result.allowed).toBe(true);
        }
      );

      it.each([
        "workspace:task:write",
        "workspace:task:delete",
        "workspace:document:write",
        "workspace:document:delete",
        "workspace:schedule:write",
        "workspace:schedule:delete",
      ])("does not have %s permission (no write access)", async (permission) => {
        const result = await useCase.execute({
          userId: USER_ID,
          workspaceId: WORKSPACE_ID,
          permission,
        });
        expect(result.allowed).toBe(false);
      });
    });
  });
});
