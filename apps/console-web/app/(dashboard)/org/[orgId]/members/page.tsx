"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Users, UserPlus, ChevronDown, ChevronUp, Shield, Crown, User, Eye, Pencil, Trash2, X } from "lucide-react";
import { callConsoleApi } from "@/lib/api-client";
import { useOrganization } from "@/lib/organization-context";
import { LoadingPage, PageHeader } from "@repo/web-lib";
import { Alert, AlertDescription } from "@repo/ui/alert";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";

interface Member {
  userId: string;
  email: string | null;
  name: string | null;
  roleId: string;
  roleName: string;
  joinedAt: string;
}

interface MembersResponse {
  members: Member[];
}

const ORG_ROLES = [
  { id: "org:owner", name: "Owner" },
  { id: "org:member", name: "Member" },
];

const WORKSPACE_ROLES = [
  { id: "workspace:owner", name: "Owner" },
  { id: "workspace:member", name: "Member" },
  { id: "workspace:viewer", name: "Viewer" },
];

const getRoleBadge = (roleName: string, roleId: string) => {
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
  if (roleId.includes("viewer")) {
    return (
      <Badge variant="secondary" className="gap-1">
        <Eye className="h-3 w-3" />
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

export default function MembersPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const { currentOrganization, currentUserId, loading: orgLoading } = useOrganization();

  const [orgMembers, setOrgMembers] = useState<Member[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<Record<string, Member[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);

  // State for add member forms
  const [showOrgAddForm, setShowOrgAddForm] = useState(false);
  const [newOrgMember, setNewOrgMember] = useState({ userId: "", roleId: "org:member" });
  const [showWsAddForm, setShowWsAddForm] = useState<string | null>(null);
  const [newWsMember, setNewWsMember] = useState({ userId: "", roleId: "workspace:member" });

  // State for role editing
  const [editingOrgRole, setEditingOrgRole] = useState<string | null>(null);
  const [editingWsRole, setEditingWsRole] = useState<{ wsId: string; userId: string } | null>(null);

  const workspaces = currentOrganization?.workspaces || [];

  // Check if the user is self
  const isSelf = (userId: string) => userId === currentUserId;

  useEffect(() => {
    const fetchOrgMembers = async () => {
      if (!orgId) return;

      try {
        const data = await callConsoleApi<MembersResponse>(
          `/api/members/organization/${orgId}`,
          { orgId }
        );
        setOrgMembers(data.members || []);
      } catch (err) {
        console.error("Failed to fetch organization members:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch organization members");
      } finally {
        setLoading(false);
      }
    };

    if (!orgLoading) {
      fetchOrgMembers();
    }
  }, [orgId, orgLoading]);

  const fetchWorkspaceMembers = async (workspaceId: string) => {
    if (workspaceMembers[workspaceId]) {
      setSelectedWorkspaceId(selectedWorkspaceId === workspaceId ? null : workspaceId);
      return;
    }

    try {
      const data = await callConsoleApi<MembersResponse>(
        `/api/members/workspace/${workspaceId}`,
        { workspaceId }
      );
      setWorkspaceMembers((prev) => ({ ...prev, [workspaceId]: data.members || [] }));
      setSelectedWorkspaceId(workspaceId);
    } catch (err) {
      console.error("Failed to fetch workspace members:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch workspace members");
    }
  };

  // Add organization member
  const handleAddOrgMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgMember.userId.trim()) return;

    try {
      await callConsoleApi(`/api/members/organization/${orgId}`, {
        orgId,
        method: "POST",
        body: { userId: newOrgMember.userId.trim(), roleId: newOrgMember.roleId },
      });
      const data = await callConsoleApi<MembersResponse>(`/api/members/organization/${orgId}`, { orgId });
      setOrgMembers(data.members || []);
      setShowOrgAddForm(false);
      setNewOrgMember({ userId: "", roleId: "org:member" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    }
  };

  // Remove organization member
  const handleRemoveOrgMember = async (userId: string) => {
    if (!confirm(`Are you sure you want to remove user ${userId} from the organization?`)) return;

    try {
      await callConsoleApi(`/api/members/organization/${orgId}/${userId}`, {
        orgId,
        method: "DELETE",
      });
      setOrgMembers((prev) => prev.filter((m) => m.userId !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  // Update organization member role
  const handleUpdateOrgRole = async (userId: string, roleId: string) => {
    try {
      await callConsoleApi(`/api/members/organization/${orgId}/${userId}/role`, {
        orgId,
        method: "PUT",
        body: { roleId },
      });
      setOrgMembers((prev) =>
        prev.map((m) =>
          m.userId === userId
            ? { ...m, roleId, roleName: ORG_ROLES.find((r) => r.id === roleId)?.name || roleId }
            : m
        )
      );
      setEditingOrgRole(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    }
  };

  // Add workspace member
  const handleAddWsMember = async (e: React.FormEvent, workspaceId: string) => {
    e.preventDefault();
    if (!newWsMember.userId.trim()) return;

    try {
      await callConsoleApi(`/api/members/workspace/${workspaceId}`, {
        workspaceId,
        method: "POST",
        body: { userId: newWsMember.userId.trim(), roleId: newWsMember.roleId },
      });
      const data = await callConsoleApi<MembersResponse>(`/api/members/workspace/${workspaceId}`, { workspaceId });
      setWorkspaceMembers((prev) => ({ ...prev, [workspaceId]: data.members || [] }));
      setShowWsAddForm(null);
      setNewWsMember({ userId: "", roleId: "workspace:member" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    }
  };

  // Remove workspace member
  const handleRemoveWsMember = async (workspaceId: string, userId: string) => {
    if (!confirm(`Are you sure you want to remove user ${userId} from the workspace?`)) return;

    try {
      await callConsoleApi(`/api/members/workspace/${workspaceId}/${userId}`, {
        workspaceId,
        method: "DELETE",
      });
      setWorkspaceMembers((prev) => ({
        ...prev,
        [workspaceId]: (prev[workspaceId] || []).filter((m) => m.userId !== userId),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  // Update workspace member role
  const handleUpdateWsRole = async (workspaceId: string, userId: string, roleId: string) => {
    try {
      await callConsoleApi(`/api/members/workspace/${workspaceId}/${userId}/role`, {
        workspaceId,
        method: "PUT",
        body: { roleId },
      });
      setWorkspaceMembers((prev) => ({
        ...prev,
        [workspaceId]: (prev[workspaceId] || []).map((m) =>
          m.userId === userId
            ? { ...m, roleId, roleName: WORKSPACE_ROLES.find((r) => r.id === roleId)?.name || roleId }
            : m
        ),
      }));
      setEditingWsRole(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    }
  };

  // Generate member display name
  const getMemberDisplayName = (member: Member) => {
    if (member.name) return member.name;
    if (member.email) return member.email;
    return member.userId;
  };

  if (orgLoading || loading) {
    return <LoadingPage />;
  }

  if (!currentOrganization) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Organization management permission required</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Member Management"
        description={currentOrganization.organizationName}
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Organization members */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Organization Members ({orgMembers.length})
          </CardTitle>
          <Button
            variant={showOrgAddForm ? "outline" : "default"}
            size="sm"
            onClick={() => setShowOrgAddForm(!showOrgAddForm)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {showOrgAddForm ? "Cancel" : "Add Member"}
          </Button>
        </CardHeader>
        <CardContent>
          {showOrgAddForm && (
            <form onSubmit={handleAddOrgMember} className="mb-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex gap-3 items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="org-user-id">User ID</Label>
                  <Input
                    id="org-user-id"
                    type="text"
                    value={newOrgMember.userId}
                    onChange={(e) => setNewOrgMember({ ...newOrgMember, userId: e.target.value })}
                    placeholder="user123"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-role">Role</Label>
                  <Select
                    value={newOrgMember.roleId}
                    onValueChange={(value) => setNewOrgMember({ ...newOrgMember, roleId: value })}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORG_ROLES.map((role) => (
                        <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit">Add</Button>
              </div>
            </form>
          )}

          {orgMembers.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No members</div>
          ) : (
            <div className="divide-y">
              {orgMembers.map((member) => (
                <div key={member.userId} className="py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      {getMemberDisplayName(member)}
                      {isSelf(member.userId) && (
                        <Badge variant="info" className="text-xs">You</Badge>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {member.email && <span>{member.email} · </span>}
                      Joined {new Date(member.joinedAt).toLocaleDateString("en-US")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingOrgRole === member.userId ? (
                      <>
                        <Select
                          value={member.roleId}
                          onValueChange={(value) => handleUpdateOrgRole(member.userId, value)}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ORG_ROLES.map((role) => (
                              <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingOrgRole(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        {getRoleBadge(member.roleName, member.roleId)}
                        {!isSelf(member.userId) && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingOrgRole(member.userId)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveOrgMember(member.userId)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workspace members */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Workspace Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          {workspaces.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No workspaces
            </div>
          ) : (
            <div className="space-y-3">
              {workspaces.map((ws) => (
                <Card key={ws.workspaceId} className="border">
                  <button
                    type="button"
                    onClick={() => fetchWorkspaceMembers(ws.workspaceId)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-muted/50 rounded-t-lg transition-colors"
                  >
                    <span className="font-medium">{ws.workspaceName}</span>
                    {selectedWorkspaceId === ws.workspaceId ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>

                  {selectedWorkspaceId === ws.workspaceId && (
                    <CardContent className="border-t pt-4">
                      <div className="flex justify-end mb-4">
                        <Button
                          variant={showWsAddForm === ws.workspaceId ? "outline" : "default"}
                          size="sm"
                          onClick={() => setShowWsAddForm(showWsAddForm === ws.workspaceId ? null : ws.workspaceId)}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          {showWsAddForm === ws.workspaceId ? "Cancel" : "Add Member"}
                        </Button>
                      </div>

                      {showWsAddForm === ws.workspaceId && (
                        <form
                          onSubmit={(e) => handleAddWsMember(e, ws.workspaceId)}
                          className="mb-4 p-4 bg-muted/50 rounded-lg"
                        >
                          <div className="flex gap-3 items-end">
                            <div className="flex-1 space-y-2">
                              <Label htmlFor={`ws-user-id-${ws.workspaceId}`}>User ID</Label>
                              <Input
                                id={`ws-user-id-${ws.workspaceId}`}
                                type="text"
                                value={newWsMember.userId}
                                onChange={(e) => setNewWsMember({ ...newWsMember, userId: e.target.value })}
                                placeholder="user123"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`ws-role-${ws.workspaceId}`}>Role</Label>
                              <Select
                                value={newWsMember.roleId}
                                onValueChange={(value) => setNewWsMember({ ...newWsMember, roleId: value })}
                              >
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {WORKSPACE_ROLES.map((role) => (
                                    <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button type="submit">Add</Button>
                          </div>
                        </form>
                      )}

                      {(workspaceMembers[ws.workspaceId] ?? []).length === 0 ? (
                        <p className="text-muted-foreground text-sm py-4 text-center">No members</p>
                      ) : (
                        <div className="divide-y">
                          {(workspaceMembers[ws.workspaceId] ?? []).map((member) => (
                            <div key={member.userId} className="py-3 flex items-center justify-between">
                              <div>
                                <p className="font-medium flex items-center gap-2">
                                  {getMemberDisplayName(member)}
                                  {isSelf(member.userId) && (
                                    <Badge variant="info" className="text-xs">You</Badge>
                                  )}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {member.email && <span>{member.email} · </span>}
                                  Joined {new Date(member.joinedAt).toLocaleDateString("en-US")}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {editingWsRole?.wsId === ws.workspaceId && editingWsRole?.userId === member.userId ? (
                                  <>
                                    <Select
                                      value={member.roleId}
                                      onValueChange={(value) => handleUpdateWsRole(ws.workspaceId, member.userId, value)}
                                    >
                                      <SelectTrigger className="w-[120px]">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {WORKSPACE_ROLES.map((role) => (
                                          <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setEditingWsRole(null)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    {getRoleBadge(member.roleName, member.roleId)}
                                    {!isSelf(member.userId) && (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => setEditingWsRole({ wsId: ws.workspaceId, userId: member.userId })}
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleRemoveWsMember(ws.workspaceId, member.userId)}
                                          className="text-destructive hover:text-destructive"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
