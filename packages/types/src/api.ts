/**
 * Common API type definitions
 * Types for Organization, Workspace, and User
 */

// Organization type definition (for AuthZ API response)
export interface OrganizationWithWorkspaces {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  workspaces: WorkspaceWithRole[];
}

// Workspace type definition (with role information)
export interface WorkspaceWithRole {
  workspaceId: string;
  workspaceName: string;
  roleId: string;
  roleName: string;
  joinedAt: string;
}

// Organization base type
export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
}

// Workspace base type
export interface Workspace {
  id: string;
  organizationId: string;
  name: string;
  createdAt: Date;
}

// Workspace member type
export interface WorkspaceMember {
  userId: string;
  roleId: string;
  roleName: string;
  joinedAt: string;
}

// User Workspaces Response type definition
export interface UserWorkspacesResponse {
  organizations: OrganizationWithWorkspaces[];
}

// Workspace Members Response type definition
export interface WorkspaceMembersResponse {
  members: WorkspaceMember[];
}

// System user type (for admin interface)
export interface SystemUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// System statistics type
export interface SystemStats {
  users: {
    total: number;
    admins: number;
    regular: number;
    banned: number;
  };
  organizations: {
    total: number;
  };
  workspaces: {
    total: number;
  };
}
