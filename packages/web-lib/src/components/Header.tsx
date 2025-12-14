"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@repo/ui/lib/utils";
import { Button } from "@repo/ui/button";

export interface NavItem {
  href: string;
  label: string;
  isActive?: boolean;
}

export interface HeaderProps {
  appName: string;
  navItems?: NavItem[];
  rightContent?: React.ReactNode;
  userEmail?: string | null;
  isLoggedIn?: boolean;
  loginPath?: string;
  logoutPath?: string;
  className?: string;
}

export function Header({
  appName,
  navItems = [],
  rightContent,
  userEmail,
  isLoggedIn = false,
  loginPath = "/login",
  logoutPath = "/logout",
  className,
}: HeaderProps) {
  return (
    <header
      className={cn(
        "bg-background border-b border-border shadow-sm",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-2xl font-bold text-foreground">
              {appName}
            </Link>
            {navItems.length > 0 && (
              <nav className="hidden md:flex space-x-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      item.isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                {rightContent}
                {userEmail && (
                  <span className="text-sm text-muted-foreground">
                    {userEmail}
                  </span>
                )}
                <Button variant="ghost" size="sm" asChild>
                  <Link href={logoutPath}>Logout</Link>
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" asChild>
                <Link href={loginPath}>Login</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
