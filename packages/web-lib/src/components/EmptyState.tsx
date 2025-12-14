"use client";

import * as React from "react";
import { cn } from "@repo/ui/lib/utils";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-8 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-3 text-muted-foreground [&>svg]:h-8 [&>svg]:w-8">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground max-w-xs">
          {description}
        </p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
