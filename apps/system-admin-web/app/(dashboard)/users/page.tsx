"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { callSystemAdminApi } from "@/lib/api-client";
import { authClient, EmptyState, LoadingPage, PageHeader } from "@repo/web-lib";
import { Alert, AlertDescription } from "@repo/ui/alert";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/table";

interface SystemUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface UsersResponse {
  users: SystemUser[];
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const session = await authClient.getSession();
        if (!session?.data?.user) {
          router.push("/login");
          return;
        }

        const data = await callSystemAdminApi<UsersResponse>("/api/system-admin/users");
        setUsers(data.users || []);
      } catch (err) {
        console.error("Failed to fetch users:", err);
        if (err instanceof Error && err.message.includes("Forbidden")) {
          setError("System administrator privileges required");
        } else {
          setError(err instanceof Error ? err.message : "Failed to fetch user list");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [router]);

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Manage all users in the system"
        action={
          <Button size="sm" asChild>
            <Link href="/users/create">New</Link>
          </Button>
        }
      />

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">User List</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <EmptyState
              title="No users"
              description="Create a new user to get started"
              action={
                <Button size="sm" asChild>
                  <Link href="/users/create">New</Link>
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      {user.role === "admin" ? (
                        <Badge variant="info">Admin</Badge>
                      ) : (
                        <Badge variant="secondary">User</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.banned ? (
                        <Badge variant="destructive">Banned</Badge>
                      ) : (
                        <Badge variant="success">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString("en-US")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
