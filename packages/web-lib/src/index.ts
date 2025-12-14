/**
 * Web Library Package
 * Provides libraries used in Next.js-based web applications
 */

export { authClient } from "./auth-client";
export type {
  OrganizationInfo,
  UserWorkspacesResponse,
  WorkspaceInfo,
} from "./types";
export { useWorkspace, WorkspaceProvider } from "./workspace-context";

// Components
export {
  Header,
  type HeaderProps,
  type NavItem,
  WorkspaceSelector,
  OrganizationSelector,
  type OrganizationSelectorProps,
  PageHeader,
  type PageHeaderProps,
  LoginForm,
  type LoginFormProps,
  LoadingSpinner,
  LoadingPage,
  type LoadingSpinnerProps,
  type LoadingPageProps,
  EmptyState,
  type EmptyStateProps,
  AppSidebar,
  type AppSidebarProps,
  type SidebarNavItem,
  type NavGroup,
  DashboardLayout,
  type DashboardLayoutProps,
  type BreadcrumbItem,
} from "./components";
