"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  authClient,
  Header as BaseHeader,
  type NavItem,
  OrganizationSelector,
} from "@repo/web-lib";
import { useOrganization } from "@/lib/organization-context";

export default function Header() {
  const pathname = usePathname();
  const {
    currentOrganizationId,
    setCurrentOrganizationId,
    organizations,
    loading,
  } = useOrganization();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Extract orgId from URL
  const pathMatch = pathname.match(/^\/org\/([^/]+)/);
  const orgId = pathMatch?.[1] || currentOrganizationId;

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await authClient.getSession();
        if (session?.data?.user) {
          setIsLoggedIn(true);
          setUserEmail(session.data.user.email || null);
        }
      } catch (_error) {
        setIsLoggedIn(false);
      }
    };
    checkSession();
  }, []);

  const navItems: NavItem[] =
    isLoggedIn && orgId
      ? [
          {
            href: `/org/${orgId}`,
            label: "Portal",
            isActive: pathname === `/org/${orgId}`,
          },
          {
            href: `/org/${orgId}/workspaces`,
            label: "Workspaces",
            isActive: pathname.includes("/workspaces"),
          },
          {
            href: `/org/${orgId}/members`,
            label: "Members",
            isActive: pathname.includes("/members"),
          },
        ]
      : [];

  return (
    <BaseHeader
      appName="Console"
      navItems={navItems}
      rightContent={
        <OrganizationSelector
          organizations={organizations}
          currentOrganizationId={currentOrganizationId}
          onOrganizationChange={setCurrentOrganizationId}
          loading={loading}
        />
      }
      userEmail={userEmail}
      isLoggedIn={isLoggedIn}
    />
  );
}
