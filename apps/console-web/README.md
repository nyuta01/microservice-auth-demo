# Console Web

Organization/Workspace level integrated management console. Built with [Next.js](https://nextjs.org/) + [React](https://reactjs.org/) + [Tailwind CSS](https://tailwindcss.com/).

## Getting Started

Start the development server:

```bash
pnpm dev
```

The application runs at [http://localhost:20200](http://localhost:20200).

## Environment Variables

The following environment variables are required (set in `next.config.js`):

```bash
NEXT_PUBLIC_AUTH_URL=http://localhost:10000
NEXT_PUBLIC_CONSOLE_API_URL=http://localhost:10200
```

## Main Pages

| Path | Description |
|------|-------------|
| `/` | Redirect (based on login status) |
| `/login` | Login page |
| `/logout` | Logout process |
| `/org/[orgId]/workspace/[workspaceId]` | Dashboard |
| `/org/[orgId]/workspace/[workspaceId]/users` | User management |
| `/org/[orgId]/workspace/[workspaceId]/workspaces` | Workspace management |

## Features

- Dashboard (statistics display)
- Integrated task & document view
- Workspace management (create/update/delete)
- User management (member list, permission management)
- Workspace switching

## Target Users

- Organization admins
- Workspace admins

## Authentication Flow

1. Authenticate with AuthN API at `/login`
2. Session management via better-auth client
3. Attach JWT token to Console API requests
4. Requires `org:admin` or `workspace:admin` permission

## Tech Stack

- [Next.js](https://nextjs.org/) 16 - React framework
- [React](https://reactjs.org/) 19 - UI library
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [better-auth](https://www.better-auth.com/) - Auth client
- [@repo/web-lib](../../packages/web-lib) - Common auth & workspace management
- [@repo/ui](../../packages/ui) - Common UI components

## Directory Structure

```
app/
├── layout.tsx              # Root layout
├── page.tsx                # Root page (redirect)
├── login/page.tsx          # Login page
├── logout/page.tsx         # Logout page
└── org/[orgId]/workspace/[workspaceId]/
    ├── page.tsx            # Dashboard
    ├── users/page.tsx      # User management
    └── workspaces/page.tsx # Workspace management
components/
├── Header.tsx              # Header component
└── WorkspaceSelector.tsx   # Workspace switcher
lib/
├── api-client.ts           # Console API client
├── types.ts                # Type definitions
└── workspace-context.tsx   # Workspace context
```

## Build

```bash
pnpm build
```

## Type Check

```bash
pnpm check-types
```
