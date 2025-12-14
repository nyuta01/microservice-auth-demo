// Organization and Workspace types
export interface WorkspaceInfo {
  workspaceId: string;
  workspaceName: string;
  roleId: string;
  roleName: string;
  joinedAt: string;
  organizationId?: string;
  organizationName?: string;
}

export interface OrganizationInfo {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  workspaces: WorkspaceInfo[];
}

export interface UserWorkspacesResponse {
  organizations: OrganizationInfo[];
}

// Aliases for backward compatibility
export type Organization = OrganizationInfo;
export type Workspace = WorkspaceInfo;
