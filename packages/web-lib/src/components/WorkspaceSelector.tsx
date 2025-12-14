"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { Button } from "@repo/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { useWorkspace } from "../workspace-context";
import type { WorkspaceInfo } from "../types";

export function WorkspaceSelector() {
  const {
    currentOrganizationId,
    currentWorkspaceId,
    setCurrentOrganizationId,
    setCurrentWorkspaceId,
    workspaces,
    organizations,
    loading,
  } = useWorkspace();

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">Loading...</div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No workspaces available
      </div>
    );
  }

  const currentWorkspace = workspaces.find(
    (ws) => ws.workspaceId === currentWorkspaceId
  );
  const currentOrg = organizations.find(
    (org) => org.organizationId === currentOrganizationId
  );

  const handleSelect = (orgId: string, workspaceId: string) => {
    setCurrentOrganizationId(orgId);
    setCurrentWorkspaceId(workspaceId);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="min-w-[200px] justify-between">
          {currentOrg && currentWorkspace ? (
            <span className="flex items-center gap-2 truncate">
              <span className="text-muted-foreground truncate">
                {currentOrg.organizationName}
              </span>
              <span>/</span>
              <span className="truncate">{currentWorkspace.workspaceName}</span>
            </span>
          ) : (
            <span>Select Workspace</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 max-h-96 overflow-y-auto">
        {organizations.map((org, index) => (
          <React.Fragment key={org.organizationId}>
            {index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-xs uppercase text-muted-foreground">
              {org.organizationName}
            </DropdownMenuLabel>
            {org.workspaces.map((ws: WorkspaceInfo) => (
              <DropdownMenuItem
                key={ws.workspaceId}
                onClick={() => handleSelect(org.organizationId, ws.workspaceId)}
                className={cn(
                  "cursor-pointer",
                  ws.workspaceId === currentWorkspaceId &&
                    org.organizationId === currentOrganizationId &&
                    "bg-accent"
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <span>{ws.workspaceName}</span>
                  <span className="text-xs text-muted-foreground">
                    {ws.roleName}
                  </span>
                </div>
              </DropdownMenuItem>
            ))}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
