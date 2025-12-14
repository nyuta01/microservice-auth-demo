"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  authClient,
  Header as BaseHeader,
  type NavItem,
  useWorkspace,
  WorkspaceSelector,
} from "@repo/web-lib";

export default function Header() {
  const pathname = usePathname();
  const { currentOrganizationId, currentWorkspaceId } = useWorkspace();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const pathMatch = pathname.match(/^\/org\/([^/]+)\/workspace\/([^/]+)/);
  const orgId = pathMatch?.[1] || currentOrganizationId;
  const workspaceId = pathMatch?.[2] || currentWorkspaceId;

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

  const basePath = `/org/${orgId}/workspace/${workspaceId}`;

  const navItems: NavItem[] =
    isLoggedIn && orgId && workspaceId
      ? [
          {
            href: basePath,
            label: "Documents",
            isActive: pathname === basePath,
          },
          {
            href: `${basePath}/documents/new`,
            label: "New Document",
            isActive: pathname.includes("/documents/new"),
          },
        ]
      : [];

  return (
    <BaseHeader
      appName="Document Manager"
      navItems={navItems}
      rightContent={<WorkspaceSelector />}
      userEmail={userEmail}
      isLoggedIn={isLoggedIn}
    />
  );
}
