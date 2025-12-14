"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Users, Building2, LayoutDashboard, Settings } from "lucide-react";
import { authClient, DashboardLayout, type NavGroup, type BreadcrumbItem } from "@repo/web-lib";

interface AppShellProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

const navigation: NavGroup[] = [
  {
    label: "Menu",
    items: [
      { title: "Dashboard", href: "/", icon: LayoutDashboard },
      { title: "User Management", href: "/users", icon: Users },
      { title: "Organization Management", href: "/organizations", icon: Building2 },
    ],
  },
];

export function AppShell({ children, breadcrumbs }: AppShellProps) {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await authClient.getSession();
        if (session?.data?.user) {
          setUserEmail(session.data.user.email || null);
        } else {
          router.push("/login");
          return;
        }
      } catch (error) {
        console.error("Session check failed:", error);
        router.push("/login");
        return;
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, [router]);

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  if (isLoading || !userEmail) {
    return null;
  }

  return (
    <DashboardLayout
      appName="System Admin"
      navigation={navigation}
      userEmail={userEmail}
      onLogout={handleLogout}
      breadcrumbs={breadcrumbs}
    >
      {children}
    </DashboardLayout>
  );
}
