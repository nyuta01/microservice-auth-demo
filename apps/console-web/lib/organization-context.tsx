"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { authClient } from "@repo/web-lib";
import type { OrganizationInfo } from "./types";

interface OrganizationContextType {
  currentOrganizationId: string | null;
  setCurrentOrganizationId: (id: string | null) => void;
  organizations: OrganizationInfo[];
  currentOrganization: OrganizationInfo | null;
  currentUserId: string | null;
  loading: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [currentOrganizationId, setCurrentOrganizationId] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationInfo[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Read organization from URL path
  useEffect(() => {
    const pathMatch = pathname.match(/^\/org\/([^/]+)/);
    if (pathMatch) {
      const [, pathOrgId] = pathMatch;
      setCurrentOrganizationId(pathOrgId ?? null);
    } else {
      setCurrentOrganizationId(null);
    }
  }, [pathname]);

  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        const session = await authClient.getSession();
        if (!session?.data?.user?.id) {
          setLoading(false);
          return;
        }

        setCurrentUserId(session.data.user.id);

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

        // Get organization info from Console API portal endpoint
        const consoleApiUrl = process.env.NEXT_PUBLIC_CONSOLE_API_URL || "http://localhost:10200";
        const portalRes = await fetch(`${consoleApiUrl}/api/portal`, {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
          credentials: "include",
          cache: "no-store",
        });

        if (portalRes.ok) {
          const data = (await portalRes.json()) as { organizations: OrganizationInfo[] };
          setOrganizations(data.organizations || []);

          // If URL doesn't contain organization, select the first one and redirect
          const pathMatch = pathname.match(/^\/org\/([^/]+)/);
          if (
            !pathMatch &&
            data.organizations &&
            data.organizations.length > 0 &&
            !pathname.startsWith("/login") &&
            !pathname.startsWith("/logout")
          ) {
            const firstOrg = data.organizations[0];
            if (firstOrg?.organizationId) {
              router.push(`/org/${firstOrg.organizationId}`);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load organizations:", error);
      } finally {
        setLoading(false);
      }
    };

    loadOrganizations();
  }, [pathname, router]);

  const handleSetOrganizationId = (newOrgId: string | null) => {
    if (newOrgId) {
      router.push(`/org/${newOrgId}`);
    }
  };

  const currentOrganization = organizations.find((o) => o.organizationId === currentOrganizationId) || null;

  return (
    <OrganizationContext.Provider
      value={{
        currentOrganizationId,
        setCurrentOrganizationId: handleSetOrganizationId,
        organizations,
        currentOrganization,
        currentUserId,
        loading,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error("useOrganization must be used within a OrganizationProvider");
  }
  return context;
}
