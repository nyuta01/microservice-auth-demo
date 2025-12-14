"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Users, Building2, FolderKanban, Shield, AlertCircle } from "lucide-react";
import { callSystemAdminApi } from "@/lib/api-client";
import { authClient, LoadingPage } from "@repo/web-lib";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { Alert, AlertDescription } from "@repo/ui/alert";

interface SystemStats {
  users: {
    total: number;
    admins: number;
    regular: number;
    banned: number;
  };
  organizations: {
    total: number;
  };
  workspaces: {
    total: number;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const session = await authClient.getSession();
        if (!session?.data?.user) {
          router.push("/login");
          return;
        }

        const data = await callSystemAdminApi<{ stats: SystemStats }>("/api/system-admin/stats");
        setStats(data.stats);
      } catch (err) {
        console.error("Failed to fetch dashboard:", err);
        if (err instanceof Error && err.message.includes("Forbidden")) {
          setError("System administrator privileges required");
        } else {
          setError(err instanceof Error ? err.message : "Failed to fetch dashboard data");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [router]);

  if (loading) {
    return <LoadingPage />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">View system-wide overview</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.users.admins} Admins / {stats.users.regular} Regular
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.users.admins}</div>
            <p className="text-xs text-muted-foreground">
              Users with system admin privileges
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.organizations.total}</div>
            <p className="text-xs text-muted-foreground">
              Registered organizations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workspaces</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.workspaces.total}</div>
            <p className="text-xs text-muted-foreground">
              Created workspaces
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Statistics</CardTitle>
            <CardDescription>Breakdown by user type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-sm">Regular Users</span>
                </div>
                <span className="font-medium">{stats.users.regular}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-sm">Administrators</span>
                </div>
                <span className="font-medium">{stats.users.admins}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-destructive" />
                  <span className="text-sm">Banned</span>
                </div>
                <span className="font-medium">{stats.users.banned}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used operations</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <a
              href="/users"
              className="flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors hover:bg-muted"
            >
              <Users className="h-4 w-4" />
              View User List
            </a>
            <a
              href="/organizations"
              className="flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors hover:bg-muted"
            >
              <Building2 className="h-4 w-4" />
              View Organization List
            </a>
            <a
              href="/users/create"
              className="flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors hover:bg-muted"
            >
              <Users className="h-4 w-4" />
              Create New User
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
