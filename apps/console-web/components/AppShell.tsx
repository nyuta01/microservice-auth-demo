"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Building2, FolderKanban, Users, LayoutDashboard, ChevronsUpDown, Check } from "lucide-react";
import { authClient, DashboardLayout, type NavGroup, type BreadcrumbItem } from "@repo/web-lib";
import { useOrganization } from "@/lib/organization-context";
import { Button } from "@repo/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";

interface AppShellProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

export function AppShell({ children, breadcrumbs }: AppShellProps) {
  const router = useRouter();
  const params = useParams();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { organizations, currentOrganization, setCurrentOrganizationId } = useOrganization();

  const orgId = params?.orgId as string | undefined;

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

  const handleOrganizationChange = (newOrgId: string) => {
    setCurrentOrganizationId(newOrgId);
  };

  const navigation: NavGroup[] = orgId
    ? [
        {
          label: "Management",
          items: [
            { title: "Dashboard", href: `/org/${orgId}`, icon: LayoutDashboard },
            { title: "Workspaces", href: `/org/${orgId}/workspaces`, icon: FolderKanban },
            { title: "Members", href: `/org/${orgId}/members`, icon: Users },
          ],
        },
      ]
    : [
        {
          label: "Menu",
          items: [
            { title: "Home", href: "/", icon: LayoutDashboard },
          ],
        },
      ];

  if (isLoading || !userEmail) {
    return null;
  }

  return (
    <DashboardLayout
      appName="Console"
      navigation={navigation}
      userEmail={userEmail}
      onLogout={handleLogout}
      breadcrumbs={breadcrumbs}
      footer={
        organizations.length > 0 && (
          <div className="px-2 group-data-[collapsible=icon]:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <Building2 className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {currentOrganization?.organizationName || "Select Organization"}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start">
                {organizations.map((org) => (
                  <DropdownMenuItem
                    key={org.organizationId}
                    onClick={() => handleOrganizationChange(org.organizationId)}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        currentOrganization?.organizationId === org.organizationId
                          ? "opacity-100"
                          : "opacity-0"
                      }`}
                    />
                    {org.organizationName}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      }
    >
      {children}
    </DashboardLayout>
  );
}
