"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient, Header as BaseHeader, type NavItem } from "@repo/web-lib";

export default function Header() {
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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

  const navItems: NavItem[] = isLoggedIn
    ? [
        {
          href: "/",
          label: "Dashboard",
          isActive: pathname === "/",
        },
        {
          href: "/users",
          label: "User Management",
          isActive: pathname.includes("/users"),
        },
        {
          href: "/organizations",
          label: "Organization Management",
          isActive: pathname.includes("/organizations"),
        },
      ]
    : [];

  return (
    <BaseHeader
      appName="System Admin"
      navItems={navItems}
      userEmail={userEmail}
      isLoggedIn={isLoggedIn}
    />
  );
}
