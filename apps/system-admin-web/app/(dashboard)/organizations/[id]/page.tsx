"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, Crown, Shield, User, UserPlus } from "lucide-react";
import { callSystemAdminApi } from "@/lib/api-client";
import { authClient, EmptyState, LoadingPage, PageHeader } from "@repo/web-lib";
import { Alert, AlertDescription } from "@repo/ui/alert";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Label } from "@repo/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/table";

interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
}

interface OrganizationMember {
  userId: string;
  roleId: string;
  roleName: string;
  joinedAt: string;
}

interface MembersResponse {
  members: OrganizationMember[];
}

interface SystemUser {
  id: string;
  name: string;
  email: string;
}

interface UsersResponse {
  users: SystemUser[];
}

const getRoleBadge = (roleId: string, roleName: string) => {
  if (roleId.includes("owner")) {
    return (
      <Badge variant="warning" className="gap-1">
        <Crown className="h-3 w-3" />
        {roleName}
      </Badge>
    );
  }
  if (roleId.includes("admin")) {
    return (
      <Badge variant="info" className="gap-1">
        <Shield className="h-3 w-3" />
        {roleName}
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1">
      <User className="h-3 w-3" />
      {roleName}
    </Badge>
  );
};

export default function OrganizationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const organizationId = params.id as string;

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [allUsers, setAllUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("org:member");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const session = await authClient.getSession();
        if (!session?.data?.user) {
          router.push("/login");
          return;
        }

        const orgsData = await callSystemAdminApi<{ organizations: Organization[] }>(
          "/api/system-admin/organizations"
        );
        const org = orgsData.organizations.find((o) => o.id === organizationId);
        if (!org) {
          setError("Organization not found");
          setLoading(false);
          return;
        }
        setOrganization(org);

        const membersData = await callSystemAdminApi<MembersResponse>(
          `/api/system-admin/organizations/${organizationId}/members`
        );
        setMembers(membersData.members || []);

        const usersData = await callSystemAdminApi<UsersResponse>("/api/system-admin/users");
        setAllUsers(usersData.users || []);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        if (err instanceof Error && err.message.includes("Forbidden")) {
          setError("System administrator privileges required");
        } else {
          setError(err instanceof Error ? err.message : "Failed to fetch data");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [organizationId, router]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !selectedRoleId) {
      setError("Please select user and role");
      return;
    }

    setAdding(true);
    setError(null);

    try {
      await callSystemAdminApi(`/api/system-admin/organizations/${organizationId}/members`, {
        method: "POST",
        body: { userId: selectedUserId, roleId: selectedRoleId },
      });

      const membersData = await callSystemAdminApi<MembersResponse>(
        `/api/system-admin/organizations/${organizationId}/members`
      );
      setMembers(membersData.members || []);
      setShowAddMemberForm(false);
      setSelectedUserId("");
      setSelectedRoleId("org:member");
    } catch (err) {
      console.error("Failed to add member:", err);
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return <LoadingPage />;
  }

  if (error && !organization) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!organization) {
    return <EmptyState title="Organization not found" />;
  }

  const memberUserIds = new Set(members.map((m) => m.userId));
  const availableUsers = allUsers.filter((u) => !memberUserIds.has(u.id));

  return (
    <div>
      <PageHeader
        title={organization.name}
        description={`Slug: ${organization.slug}`}
        backLink={
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/organizations">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
        }
        action={
          <Button
            size="sm"
            variant={showAddMemberForm ? "outline" : "default"}
            onClick={() => setShowAddMemberForm(!showAddMemberForm)}
          >
            <UserPlus className="h-4 w-4 mr-1" />
            {showAddMemberForm ? "Cancel" : "Add Member"}
          </Button>
        }
      />

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {showAddMemberForm && (
        <Card className="mb-4">
          <CardContent className="pt-4">
            <form onSubmit={handleAddMember} className="flex gap-3 items-end flex-wrap">
              <div className="space-y-2 flex-1 min-w-[200px]">
                <Label htmlFor="user-select">User</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role-select">Role</Label>
                <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="org:member">Member</SelectItem>
                    <SelectItem value="org:admin">Admin</SelectItem>
                    <SelectItem value="org:owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" size="sm" disabled={adding}>
                {adding ? "Adding..." : "Add"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Member List</CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <EmptyState title="No members" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.userId}>
                    <TableCell className="font-medium">{member.userId}</TableCell>
                    <TableCell>{getRoleBadge(member.roleId, member.roleName)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(member.joinedAt).toLocaleDateString("en-US")}
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
