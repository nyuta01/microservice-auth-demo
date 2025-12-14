"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Layers, Plus, CheckSquare, FileText, Trash2, Shield, User, Calendar } from "lucide-react";
import { useOrganization } from "@/lib/organization-context";
import { callConsoleApi } from "@/lib/api-client";
import { LoadingPage, PageHeader, EmptyState } from "@repo/web-lib";
import { Alert, AlertDescription } from "@repo/ui/alert";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import type { Workspace } from "@/lib/types";

const getRoleBadge = (roleId: string, roleName: string) => {
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

export default function WorkspacesPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.orgId as string;
  const { currentOrganization, loading } = useOrganization();

  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [creating, setCreating] = useState(false);

  const workspaces = currentOrganization?.workspaces || [];

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) {
      setError("Please enter a workspace name");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      await callConsoleApi<{ workspace: { id: string } }>("/api/workspaces", {
        orgId,
        method: "POST",
        body: {
          name: newWorkspaceName.trim(),
          organizationId: orgId,
        },
      });

      router.refresh();
      window.location.reload();
    } catch (err) {
      console.error("Failed to create workspace:", err);
      setError(err instanceof Error ? err.message : "Failed to create workspace");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteWorkspace = async (workspaceId: string, workspaceName: string) => {
    if (!confirm(`Are you sure you want to delete workspace "${workspaceName}"?`)) {
      return;
    }

    try {
      await callConsoleApi(`/api/workspaces/${workspaceId}`, {
        method: "DELETE",
        workspaceId,
      });

      router.refresh();
      window.location.reload();
    } catch (err) {
      console.error("Failed to delete workspace:", err);
      setError(err instanceof Error ? err.message : "Failed to delete workspace");
    }
  };

  if (loading) {
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
        title="Workspace Management"
        description={currentOrganization.organizationName}
        action={
          <Button
            size="sm"
            variant={showCreateForm ? "outline" : "default"}
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            <Plus className="h-4 w-4 mr-1" />
            {showCreateForm ? "Cancel" : "New"}
          </Button>
        }
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {showCreateForm && (
        <Card className="mb-4">
          <CardContent className="pt-4">
            <form onSubmit={handleCreateWorkspace} className="flex gap-3 items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="workspace-name">Workspace Name</Label>
                <div className="relative">
                  <Layers className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="workspace-name"
                    type="text"
                    required
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    className="pl-9"
                    placeholder="e.g. Tokyo Office"
                  />
                </div>
              </div>
              <Button type="submit" size="sm" disabled={creating}>
                {creating ? "Creating..." : "Create"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4" />
            Workspaces ({workspaces.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {workspaces.length === 0 ? (
            <EmptyState
              title="No workspaces"
              description="Create a new workspace to get started"
              action={
                <Button size="sm" onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  New
                </Button>
              }
            />
          ) : (
            <div className="divide-y">
              {workspaces.map((workspace: Workspace) => (
                <div key={workspace.workspaceId} className="py-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{workspace.workspaceName}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {getRoleBadge(workspace.roleId, workspace.roleName)}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(workspace.joinedAt).toLocaleDateString("en-US")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a
                        href={`${process.env.NEXT_PUBLIC_TASK_WEB_URL || "http://localhost:20100"}/org/${orgId}/workspace/${workspace.workspaceId}`}
                      >
                        <CheckSquare className="h-4 w-4 mr-1" />
                        Task
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a
                        href={`${process.env.NEXT_PUBLIC_DOCUMENT_WEB_URL || "http://localhost:20101"}/org/${orgId}/workspace/${workspace.workspaceId}`}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Document
                      </a>
                    </Button>
                    {workspace.roleId === "workspace:admin" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleDeleteWorkspace(workspace.workspaceId, workspace.workspaceName)
                        }
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
