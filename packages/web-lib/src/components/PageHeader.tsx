"use client";

import * as React from "react";
import { cn } from "@repo/ui/lib/utils";

export interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  backLink?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  action,
  backLink,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-4", className)}>
      {backLink && <div className="mb-2">{backLink}</div>}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight truncate">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground truncate">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
