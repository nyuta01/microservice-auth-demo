"use client";

import * as React from "react";
import { cn } from "@repo/ui/lib/utils";

export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent text-primary",
        sizeClasses[size],
        className
      )}
    />
  );
}

export interface LoadingPageProps {
  message?: string;
}

export function LoadingPage({ message }: LoadingPageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-2">
      <LoadingSpinner size="md" />
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}
