# System Admin Web

System-wide management UI. For system administrators only. Built with [Next.js](https://nextjs.org/) + [React](https://reactjs.org/) + [Tailwind CSS](https://tailwindcss.com/).

## Getting Started

Start the development server:

```bash
pnpm dev
```

The application runs at [http://localhost:20201](http://localhost:20201).

## Environment Variables

The following environment variables are required (set in `next.config.js`):

```bash
NEXT_PUBLIC_AUTH_URL=http://localhost:10000
NEXT_PUBLIC_SYSTEM_ADMIN_API_URL=http://localhost:10201
```

## Main Pages

| Path | Description |
|------|-------------|
| `/` | System dashboard (statistics) |
| `/login` | Login page |
| `/logout` | Logout process |
| `/users` | All users management |
| `/users/create` | Create user |
| `/organizations` | All organizations management |
| `/organizations/[id]` | Organization details & member management |

## Features

- System statistics dashboard
  - Total users, admins, banned count
  - Total organizations, workspaces count
- All users management
  - User list display
  - User creation (via better-auth)
  - Role changes (user / admin)
  - Ban management
- All organizations management
  - Organization list display
  - Organization create/update/delete
  - Member management (add, role changes)
- All workspaces management

## Target Users

- System administrators (`user.role = 'admin'`) only
- Regular users cannot access (403 error)

## Authentication Flow

1. Authenticate with AuthN API at `/login`
2. Session management via better-auth client
3. System Admin API verifies `user.role = 'admin'`
4. Returns 403 Forbidden if unauthorized

## Tech Stack

- [Next.js](https://nextjs.org/) 16 - React framework
- [React](https://reactjs.org/) 19 - UI library
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [better-auth](https://www.better-auth.com/) - Auth client
- [@repo/web-lib](../../packages/web-lib) - Common auth
- [@repo/ui](../../packages/ui) - Common UI components

## Directory Structure

```
app/
├── layout.tsx          # Root layout
├── page.tsx            # System dashboard
├── login/page.tsx      # Login page
├── logout/page.tsx     # Logout page
├── users/
│   ├── page.tsx        # User list
│   └── create/page.tsx # Create user
└── organizations/
    ├── page.tsx        # Organization list
    └── [id]/page.tsx   # Organization details
components/
├── Header.tsx          # Header component
lib/
└── api-client.ts       # System Admin API client
```

## Build

```bash
pnpm build
```

## Type Check

```bash
pnpm check-types
```
