# Console API

Integrated API service serving as a portal to business services and handling Organization/Workspace/member management.
Built with [Hono](https://hono.dev/), aggregating multiple resource APIs.

## Getting Started

Start the development server:

```bash
pnpm dev
```

The server runs at [http://localhost:10200](http://localhost:10200).

## Environment Variables

The following environment variables are required:

```bash
SERVICE_URL_AUTHZ=http://localhost:10001
SERVICE_URL_TASK_API=http://localhost:10100
SERVICE_URL_DOCUMENT_API=http://localhost:10101
INTERNAL_API_SECRET=internal_shared_secret_key
BETTER_AUTH_URL=http://localhost:10000
```

## API Endpoints

All endpoints require JWT authentication.

### Portal

| Method | Path | Description | Required Permission |
|--------|------|-------------|---------------------|
| GET | `/api/portal` | Get portal info (user info, service list, organizations/workspaces) | - |
| GET | `/api/portal/services` | Get service list | - |

### Organization Management

| Method | Path | Description | Required Permission |
|--------|------|-------------|---------------------|
| GET | `/api/organizations` | Get user's organization list | - |
| GET | `/api/organizations/:organizationId` | Get organization details | org:manage |

### Workspace Management

| Method | Path | Description | Required Permission |
|--------|------|-------------|---------------------|
| GET | `/api/workspaces` | Get workspace list | - |
| POST | `/api/workspaces` | Create workspace | org:workspaces |
| PUT | `/api/workspaces/:id` | Update workspace | workspace:owner |
| DELETE | `/api/workspaces/:id` | Delete workspace | workspace:owner |

### Member Management

| Method | Path | Description | Required Permission |
|--------|------|-------------|---------------------|
| GET | `/api/members` | Get members list (header-based) | workspace:owner / org:users |
| GET | `/api/members/workspace/:workspaceId` | Get workspace members list | workspace:owner |
| GET | `/api/members/organization/:organizationId` | Get organization members list | org:users |

### Dashboard

| Method | Path | Description | Required Permission |
|--------|------|-------------|---------------------|
| GET | `/api/dashboard` | Get dashboard data | workspace:task:read |
| GET | `/api/dashboard/stats` | Get statistics | workspace:task:read |
| GET | `/api/dashboard/search?q={query}` | Unified resource search | workspace:task:read |

### Backward Compatibility Aliases

Old endpoints (`/api/console/*`) redirect to new endpoints with 301.

## Authentication & Authorization

1. **JWT Authentication**: Verify JWT tokens issued by AuthN API
2. **Permission Check**: Verify Organization/Workspace level permissions via AuthZ API
3. **Required Permissions**: See [docs/role-design.md](../../docs/role-design.md) for role-permission mappings

## File Structure

```
src/
├── index.ts                 # Entry point
├── lib/
│   └── authz-client.ts      # AuthZ API client
└── routes/
    ├── portal.ts            # Portal (service info)
    ├── organizations.ts     # Organization management
    ├── workspaces.ts        # Workspace management
    ├── members.ts           # Member management
    └── dashboard.ts         # Dashboard & statistics
```

## Architecture

Console API has no database of its own and aggregates internal calls to the following services:

- **AuthZ API** - Organization/Workspace/member management, user permissions
- **Task API** - Task data retrieval
- **Document API** - Document data retrieval

```
┌─────────────┐
│ Console Web │
└──────┬──────┘
       │ JWT Auth
       ▼
┌─────────────┐     ┌────────────┐
│ Console API │────▶│  AuthZ API │ (Internal API)
└──────┬──────┘     └────────────┘
       │
       ├──────────────────┐
       │                  │
       ▼                  ▼
┌────────────┐     ┌──────────────┐
│  Task API  │     │ Document API │
└────────────┘     └──────────────┘
```

## Target Users

- Regular users (portal features)
- Organization admins
- Workspace admins

**Note**: System admins (`user.role = 'admin'`) can access all Organizations/Workspaces.

## Tech Stack

- [Hono](https://hono.dev/) - Web framework
- [@repo/api-clients](../../packages/api-clients) - Inter-service communication client
- [@repo/api-middleware](../../packages/api-middleware) - Common middleware
- [@repo/types](../../packages/types) - Common type definitions

## Build

```bash
pnpm build
```
