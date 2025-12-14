# System Admin API

System-wide management API. For system administrators only. Built with [Hono](https://hono.dev/) + [Drizzle ORM](https://orm.drizzle.team/).

## Getting Started

Start the development server:

```bash
pnpm dev
```

The server runs at [http://localhost:10201](http://localhost:10201).

## Environment Variables

The following environment variables are required:

```bash
DATABASE_URL_AUTH=postgresql://...    # AuthN database (read only)
DATABASE_URL_AUTHZ=postgresql://...   # AuthZ database (read/write)
SERVICE_URL_AUTH=http://localhost:10000
BETTER_AUTH_URL=http://localhost:10000
```

## API Endpoints

All endpoints require JWT authentication + system admin permission (`user.role = 'admin'`).

### User Management

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/system-admin/users` | Get all users list |
| GET | `/api/system-admin/users/:id` | Get user details |
| POST | `/api/system-admin/users` | Create user |
| PUT | `/api/system-admin/users/:id` | Update user (role, BAN, etc.) |

### Organization Management

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/system-admin/organizations` | Get all organizations list |
| POST | `/api/system-admin/organizations` | Create organization |
| PUT | `/api/system-admin/organizations/:id` | Update organization |
| DELETE | `/api/system-admin/organizations/:id` | Delete organization |
| GET | `/api/system-admin/organizations/:id/members` | Get organization members |
| POST | `/api/system-admin/organizations/:id/members` | Add user to organization |

### Workspace Management

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/system-admin/workspaces` | Get all workspaces list |

### System Statistics

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/system-admin/stats` | Get system statistics |

## Authentication & Authorization

1. **JWT Authentication**: Verify JWT tokens issued by AuthN API
2. **System Admin Permission Check**: Verify `user.role = 'admin'`
3. Independent from regular Organization/Workspace authorization system

## Architecture

System Admin API connects directly to both AuthN and AuthZ databases:

```
┌──────────────────┐
│ System Admin Web │
└────────┬─────────┘
         │ JWT Auth + admin permission
         ▼
┌──────────────────┐
│ System Admin API │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐  ┌────────┐
│auth_db │  │authz_db│
│(read)  │  │(r/w)   │
└────────┘  └────────┘
```

## Target Users

- System administrators (`user.role = 'admin'`) only
- Default role from better-auth admin plugin

## Tech Stack

- [Hono](https://hono.dev/) - Web framework
- [Drizzle ORM](https://orm.drizzle.team/) - Database ORM
- [PostgreSQL](https://www.postgresql.org/) - Database
- [@repo/api-middleware](../../packages/api-middleware) - Common middleware
- [@repo/types](../../packages/types) - Common type definitions

## Directory Structure

```
src/
├── index.ts           # Entry point + route definitions
└── db/
    ├── authn.ts       # AuthN database connection
    ├── authn-schema.ts # AuthN schema (user, etc.)
    ├── authz.ts       # AuthZ database connection
    └── authz-schema.ts # AuthZ schema (organization, etc.)
```

## Build

```bash
pnpm build
```
