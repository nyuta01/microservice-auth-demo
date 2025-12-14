"use client";

import * as React from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@repo/ui/sidebar";
import { Separator } from "@repo/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@repo/ui/breadcrumb";
import { AppSidebar, type AppSidebarProps } from "./AppSidebar";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface DashboardLayoutProps extends Omit<AppSidebarProps, "userEmail" | "onLogout"> {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  userEmail?: string | null;
  onLogout?: () => void;
  headerRight?: React.ReactNode;
}

export function DashboardLayout({
  children,
  breadcrumbs,
  headerRight,
  userEmail,
  onLogout,
  ...sidebarProps
}: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar
        {...sidebarProps}
        userEmail={userEmail}
        onLogout={onLogout}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          {breadcrumbs && breadcrumbs.length > 0 && (
            <>
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((item, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && <BreadcrumbSeparator />}
                      <BreadcrumbItem>
                        {item.href ? (
                          <BreadcrumbLink href={item.href}>
                            {item.label}
                          </BreadcrumbLink>
                        ) : (
                          <BreadcrumbPage>{item.label}</BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </>
          )}
          {headerRight && (
            <div className="ml-auto flex items-center gap-2">
              {headerRight}
            </div>
          )}
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
