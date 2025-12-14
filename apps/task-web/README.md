# Task Web

Task management web application. Built with [Next.js](https://nextjs.org/) + [React](https://reactjs.org/) + [Tailwind CSS](https://tailwindcss.com/).

## Getting Started

Start the development server:

```bash
pnpm dev
```

The application runs at [http://localhost:20100](http://localhost:20100).

## Environment Variables

The following environment variables are required (set in `next.config.js`):

```bash
NEXT_PUBLIC_AUTH_URL=http://localhost:10000
NEXT_PUBLIC_TASK_API_URL=http://localhost:10100
```

## Main Pages

| Path | Description |
|------|-------------|
| `/` | Redirect (based on login status) |
| `/login` | Login page |
| `/logout` | Logout process |
| `/org/[orgId]/workspace/[workspaceId]` | Task list (dashboard) |
| `/org/[orgId]/workspace/[workspaceId]/tasks/new` | Create new task |
| `/org/[orgId]/workspace/[workspaceId]/tasks/[id]` | Task details & edit |

## Features

- Task CRUD operations
- Status management (todo / in_progress / done)
- Priority settings (low / medium / high)
- Task assignee management
- Workspace switching

## Authentication Flow

1. Authenticate with AuthN API at `/login`
2. Session management via better-auth client
3. Attach JWT token to Task API requests

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
    ├── page.tsx            # Task list
    └── tasks/
        ├── new/page.tsx    # Create task
        └── [id]/page.tsx   # Task details
components/
├── Header.tsx              # Header component
├── TaskList.tsx            # Task list component
└── WorkspaceSelector.tsx   # Workspace switcher
lib/
├── types.ts                # Type definitions
├── get-workspace-id.ts     # Workspace ID utility
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
