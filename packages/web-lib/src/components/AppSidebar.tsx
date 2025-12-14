"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@repo/ui/sidebar";
import { Button } from "@repo/ui/button";
import { LogOut } from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export interface AppSidebarProps {
  appName: string;
  appIcon?: React.ReactNode;
  navigation: NavGroup[];
  userEmail?: string | null;
  onLogout?: () => void;
  footer?: React.ReactNode;
}

export function AppSidebar({
  appName,
  appIcon,
  navigation,
  userEmail,
  onLogout,
  footer,
}: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  {appIcon || appName.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">{appName}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navigation.map((group, groupIndex) => (
          <SidebarGroup key={groupIndex}>
            {group.label && (
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                      >
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        {footer}
        {userEmail && (
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground group-data-[collapsible=icon]:hidden">
                <span className="truncate">{userEmail}</span>
              </div>
            </SidebarMenuItem>
            {onLogout && (
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onLogout} tooltip="Logout">
                  <LogOut className="size-4" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
