/**
 * Workspace API Client
 * Fetches a user's list of workspaces
 */

const AUTHZ_URL = process.env.SERVICE_URL_AUTHZ || "http://localhost:4002";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || "internal_shared_secret_key";

export interface WorkspaceInfo {
  workspaceId: string;
  workspaceName: string;
  roleId: string;
  roleName: string;
  joinedAt: Date | string;
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

export const getUserWorkspaces = async (userId: string): Promise<UserWorkspacesResponse> => {
  try {
    const res = await fetch(`${AUTHZ_URL}/internal/user-workspaces`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": INTERNAL_SECRET,
      },
      body: JSON.stringify({ userId }),
    });

    if (!res.ok) {
      console.error(`Failed to fetch user workspaces: ${res.status}`);
      throw new Error(`Failed to fetch user workspaces: ${res.status}`);
    }

    const data: UserWorkspacesResponse = await res.json();
    return data;
  } catch (error) {
    console.error("AuthZ Service unreachable:", error);
    throw error;
  }
};
