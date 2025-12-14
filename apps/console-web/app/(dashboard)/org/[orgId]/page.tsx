"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckSquare, FileText, Layers, Settings, Users } from "lucide-react";
import { useOrganization } from "@/lib/organization-context";
import { LoadingPage, PageHeader, EmptyState } from "@repo/web-lib";
import { Alert, AlertDescription } from "@repo/ui/alert";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";

export default function OrganizationPortalPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const { currentOrganization, loading } = useOrganization();

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

  const workspaces = currentOrganization.workspaces || [];

  return (
    <div className="space-y-4">
      <PageHeader
        title={currentOrganization.organizationName}
        description="Organization Portal"
      />

      {/* Management menu */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4" />
            Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/org/${orgId}/workspaces`}>
                <Layers className="h-4 w-4 mr-1" />
                Workspaces
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/org/${orgId}/members`}>
                <Users className="h-4 w-4 mr-1" />
                Members
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Workspace list */}
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
                <Button size="sm" asChild>
                  <Link href={`/org/${orgId}/workspaces`}>Create</Link>
                </Button>
              }
            />
          ) : (
            <div className="divide-y">
              {workspaces.map((ws) => (
                <div key={ws.workspaceId} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{ws.workspaceName}</p>
                    <p className="text-xs text-muted-foreground">
                      {ws.roleName} · {new Date(ws.joinedAt).toLocaleDateString("en-US")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`${process.env.NEXT_PUBLIC_TASK_WEB_URL || "http://localhost:20100"}/org/${orgId}/workspace/${ws.workspaceId}`}
                      >
                        <CheckSquare className="h-3 w-3 mr-1" />
                        Task
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`${process.env.NEXT_PUBLIC_DOCUMENT_WEB_URL || "http://localhost:20101"}/org/${orgId}/workspace/${ws.workspaceId}`}
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        Document
                      </a>
                    </Button>
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
