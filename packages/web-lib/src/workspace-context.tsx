"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { authClient } from "./auth-client";
import type { OrganizationInfo, WorkspaceInfo } from "./types";

interface WorkspaceContextType {
  currentOrganizationId: string | null;
  currentWorkspaceId: string | null;
  setCurrentOrganizationId: (id: string | null) => void;
  setCurrentWorkspaceId: (id: string | null) => void;
  workspaces: WorkspaceInfo[];
  organizations: OrganizationInfo[];
  loading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [currentOrganizationId, setCurrentOrganizationId] = useState<string | null>(null);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceInfo[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Read organization/workspace from URL path
  useEffect(() => {
    const pathMatch = pathname.match(/^\/org\/([^/]+)\/workspace\/([^/]+)/);
    if (pathMatch) {
      const [, pathOrgId, pathWorkspaceId] = pathMatch;
      setCurrentOrganizationId(pathOrgId ?? null);
      setCurrentWorkspaceId(pathWorkspaceId ?? null);
    } else {
      // Clear if path doesn't contain org/workspace
      setCurrentOrganizationId(null);
      setCurrentWorkspaceId(null);
    }
  }, [pathname]);

  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        const session = await authClient.getSession();
        if (!session?.data?.user?.id) {
          setLoading(false);
          return;
        }

        const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:10000";

        const tokenRes = await fetch(`${authUrl}/api/auth/token`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!tokenRes.ok) {
          setLoading(false);
          return;
        }

        const tokenData = await tokenRes.json();
        const sessionToken = tokenData.token;

        if (!sessionToken) {
          setLoading(false);
          return;
        }

        // Fetch organization and workspace information from Console API user workspaces endpoint
        // (No filtering by org:manage permission)
        const consoleApiUrl = process.env.NEXT_PUBLIC_CONSOLE_API_URL || "http://localhost:10200";
        const workspacesRes = await fetch(`${consoleApiUrl}/api/user-workspaces`, {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
          credentials: "include",
          cache: "no-store",
        });

        if (workspacesRes.ok) {
          const data = (await workspacesRes.json()) as { organizations: OrganizationInfo[] };
          setOrganizations(data.organizations || []);

          const allWorkspaces: WorkspaceInfo[] = [];
          data.organizations?.forEach((org: OrganizationInfo) => {
            org.workspaces?.forEach((ws: WorkspaceInfo) => {
              allWorkspaces.push({
                ...ws,
                organizationId: org.organizationId,
                organizationName: org.organizationName,
              });
            });
          });
          setWorkspaces(allWorkspaces);

          // If URL doesn't contain organization/workspace, select the first one and redirect
          // However, do not redirect on login or logout pages
          const pathMatch = pathname.match(/^\/org\/([^/]+)\/workspace\/([^/]+)/);
          if (
            !pathMatch &&
            allWorkspaces.length > 0 &&
            !pathname.startsWith("/login") &&
            !pathname.startsWith("/logout")
          ) {
            const firstWorkspace = allWorkspaces[0];
            if (firstWorkspace?.organizationId && firstWorkspace?.workspaceId) {
              router.push(
                `/org/${firstWorkspace.organizationId}/workspace/${firstWorkspace.workspaceId}`
              );
            }
          }
        }
      } catch (error) {
        console.error("Failed to load workspaces:", error);
      } finally {
        setLoading(false);
      }
    };

    loadWorkspaces();
  }, [pathname, router]);

  const handleSetOrganizationId = (newOrgId: string | null) => {
    // When organization changes, redirect to the first workspace of that organization
    if (newOrgId) {
      const org = organizations.find((o) => o.organizationId === newOrgId);
      if (org?.workspaces && org.workspaces.length > 0) {
        const firstWorkspace = org.workspaces[0];
        if (firstWorkspace?.workspaceId) {
          router.push(`/org/${newOrgId}/workspace/${firstWorkspace.workspaceId}`);
        }
      }
    }
  };

  const handleSetWorkspaceId = (newWorkspaceId: string | null) => {
    if (!newWorkspaceId || !currentOrganizationId) return;
    // Update path-based URL (automatically triggers re-render with router.push)
    router.push(`/org/${currentOrganizationId}/workspace/${newWorkspaceId}`);
  };

  return (
    <WorkspaceContext.Provider
      value={{
        currentOrganizationId,
        currentWorkspaceId,
        setCurrentOrganizationId: handleSetOrganizationId,
        setCurrentWorkspaceId: handleSetWorkspaceId,
        workspaces,
        organizations,
        loading,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
