"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { FileText, LayoutDashboard, Plus, ChevronsUpDown, Check, Building2 } from "lucide-react";
import { authClient, DashboardLayout, type NavGroup, type BreadcrumbItem, useWorkspace } from "@repo/web-lib";
import { Button } from "@repo/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
  const { organizations, workspaces, currentWorkspaceId } = useWorkspace();

  const orgId = params?.orgId as string | undefined;
  const workspaceId = params?.workspaceId as string | undefined;

  const currentWorkspace = useMemo(() => {
    return workspaces.find((w) => w.workspaceId === currentWorkspaceId);
  }, [workspaces, currentWorkspaceId]);

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

  const handleWorkspaceChange = (newOrgId: string, newWorkspaceId: string) => {
    router.push(`/org/${newOrgId}/workspace/${newWorkspaceId}`);
  };

  const navigation: NavGroup[] = orgId && workspaceId
    ? [
        {
          label: "Document Management",
          items: [
            { title: "Dashboard", href: `/org/${orgId}/workspace/${workspaceId}`, icon: LayoutDashboard },
            { title: "New Document", href: `/org/${orgId}/workspace/${workspaceId}/documents/new`, icon: Plus },
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
      appName="Document Manager"
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
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {currentWorkspace?.workspaceName || "Select Workspace"}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start">
                {organizations.map((org) => (
                  <div key={org.organizationId}>
                    <DropdownMenuLabel className="flex items-center gap-2">
                      <Building2 className="h-3 w-3" />
                      {org.organizationName}
                    </DropdownMenuLabel>
                    {org.workspaces.map((ws) => (
                      <DropdownMenuItem
                        key={ws.workspaceId}
                        onClick={() => handleWorkspaceChange(org.organizationId, ws.workspaceId)}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            currentWorkspaceId === ws.workspaceId
                              ? "opacity-100"
                              : "opacity-0"
                          }`}
                        />
                        {ws.workspaceName}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </div>
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
