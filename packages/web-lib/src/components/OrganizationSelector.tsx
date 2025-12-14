"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";

export interface OrganizationInfo {
  organizationId: string;
  organizationName: string;
}

export interface OrganizationSelectorProps {
  organizations: OrganizationInfo[];
  currentOrganizationId: string | null;
  onOrganizationChange: (organizationId: string) => void;
  loading?: boolean;
  placeholder?: string;
}

export function OrganizationSelector({
  organizations,
  currentOrganizationId,
  onOrganizationChange,
  loading = false,
  placeholder = "Select Organization",
}: OrganizationSelectorProps) {
  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">Loading...</div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">No organizations available</div>
    );
  }

  return (
    <Select
      value={currentOrganizationId || undefined}
      onValueChange={onOrganizationChange}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {organizations.map((org) => (
          <SelectItem key={org.organizationId} value={org.organizationId}>
            {org.organizationName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
