# Document Web

Document management web application. Built with [Next.js](https://nextjs.org/) + [React](https://reactjs.org/) + [Tailwind CSS](https://tailwindcss.com/).

## Getting Started

Start the development server:

```bash
pnpm dev
```

The application runs at [http://localhost:20101](http://localhost:20101).

## Environment Variables

The following environment variables are required (set in `next.config.js`):

```bash
NEXT_PUBLIC_AUTH_URL=http://localhost:10000
NEXT_PUBLIC_DOCUMENT_API_URL=http://localhost:10101
```

## Main Pages

| Path | Description |
|------|-------------|
| `/` | Redirect (based on login status) |
| `/login` | Login page |
| `/logout` | Logout process |
| `/org/[orgId]/workspace/[workspaceId]` | Document list |
| `/org/[orgId]/workspace/[workspaceId]/documents/new` | Create new document |
| `/org/[orgId]/workspace/[workspaceId]/documents/[id]` | Document details & edit |

## Features

- Document CRUD operations
- Markdown support
- Tag management
- Workspace switching

## Authentication Flow

1. Authenticate with AuthN API at `/login`
2. Session management via better-auth client
3. Attach JWT token to Document API requests

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
    ├── page.tsx            # Document list
    └── documents/
        ├── new/page.tsx    # Create document
        └── [id]/page.tsx   # Document details
components/
├── Header.tsx              # Header component
├── DocumentList.tsx        # Document list component
└── WorkspaceSelector.tsx   # Workspace switcher
lib/
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
