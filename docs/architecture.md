# Architecture Design

## Overview

A multi-service SaaS platform providing task management and document management.
All resources belong to an Organization and Workspace, using a common authentication and authorization foundation.

## System Configuration

### Core Services

| Service | Port | Framework | Role |
|---------|------|-----------|------|
| AuthN API | 10000 | Hono + better-auth | Authentication, user management, JWT issuance |
| AuthZ API | 10001 | Hono | Authorization, organization/workspace management |

### Business Services

| Service | Port | Framework | Role |
|---------|------|-----------|------|
| Task API | 10100 | Hono | Task management API |
| Task Web | 20100 | Next.js | Task management web app |
| Document API | 10101 | Hono | Document management API |
| Document Web | 20101 | Next.js | Document management web app |

### Admin Services

| Service | Port | Framework | Role |
|---------|------|-----------|------|
| Console API | 10200 | Hono | Organization/Workspace integrated management API |
| Console Web | 20200 | Next.js | Organization/Workspace management console |
| System Admin API | 10201 | Hono | System-wide management API (for super-admin) |
| System Admin Web | 20201 | Next.js | System management UI (for super-admin) |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                            │
├─────────────────────────────────────────────────────────────────┤
│  Task Web (20100) │ Document Web (20101)                         │
│  Console Web (20200) │ System Admin Web (20201)                  │
└──────────┬──────────────┬──────────────┬──────────────┬─────────┘
           │              │              │              │
           │  JWT Token   │  JWT Token   │  JWT Token   │  JWT Token
           │              │              │              │
┌──────────▼──────────────▼──────────────▼──────────────▼─────────┐
│                    AuthN API (10000)                             │
│                    better-auth + Hono                            │
│                    - User Management                             │
│                    - Session Management (JWT)                    │
│                    - JWT Generation (includes role)              │
└──────────┬───────────────────────────────────────────────────────┘
           │
           │  Internal API (JWT forwarding)
           │
┌──────────▼───────────────────────────────────────────────────────┐
│                    AuthZ API (10001)                             │
│                    - Organization/Workspace Management           │
│                    - Role/Permission Management                  │
│                    - Permission Check (role from JWT)            │
└──────────┬───────────────────────────────────────────────────────┘
           │
           │  Permission Check
           │
┌──────────▼───────────────────────────────────────────────────────┐
│  Business Services                                                │
├───────────────────┬───────────────────┬──────────────────────────┤
│ Task API (10100)  │ Document API      │ Console API (10200)      │
│                   │ (10101)           │ System Admin API (10201) │
└───────────────────┴───────────────────┴──────────────────────────┘
```

## Data Model

### Resource Hierarchy

```
Organization
  └── Workspace
        └── Resources
              ├── Tasks
              └── Documents
```

### Role Hierarchy

```
User Role (user.role) - Managed in AuthN API
  ├── admin    → Can access all Organizations/Workspaces
  └── user/null → Permissions managed via Organization/Workspace membership

Organization Role (organization_members) - Managed in AuthZ API
  ├── org:owner  → Has org:manage permission → Can use Console
  ├── org:admin  → Has org:manage permission → Can use Console
  └── org:member → No org:manage permission → Cannot access Console

Workspace Role (workspace_members) - Managed in AuthZ API
  ├── workspace:admin  → Full permissions
  ├── workspace:member → Read/write
  └── workspace:viewer → Read only
```

## Authentication & Authorization Flow

### 1. Authentication Flow

1. User logs in via web app
2. AuthN API generates JWT token (includes `role` field)
3. All web apps and APIs use the same JWT token (SSO)

### 2. Authorization Flow (Zero Trust)

1. API service receives request
2. Validates JWT token, extracts `role`
3. Permission check via AuthZ API (JWT forwarded)
   - `role === 'admin'` → Full permissions (super-admin)
   - Otherwise → Organization/Workspace permission check
4. Execute resource operation if authorized

### 3. Super Admin Special Handling

```typescript
// AuthZ API decision
if (userRole === "admin") {
  return { allowed: true, reason: "Super-admin has full access" };
}
```

Super Admin:
- JWT `role` field is `"admin"`
- Bypasses all AuthZ API permission checks
- Gets full Organization list from Console API

### 4. Console Access Control

- Only users with `org:manage` permission can access Console Web
- `org:member` role does not have `org:manage` permission → Cannot access Console
- Task Web/Document Web do not require `org:manage` permission

## Directory Structure

```
apps/
├── authn-api/              # [10000] Authentication service
├── authz-api/              # [10001] Authorization service
├── task-api/               # [10100] Task management API
├── task-web/               # [20100] Task management web
├── document-api/           # [10101] Document management API
├── document-web/           # [20101] Document management web
├── console-api/            # [10200] Organization/Workspace integrated management API
├── console-web/            # [20200] Organization/Workspace management console
├── system-admin-api/       # [10201] System admin API
└── system-admin-web/       # [20201] System admin web

packages/
├── api-middleware/         # Common middleware (JWT verification, CORS, error handling)
├── api-clients/            # Inter-service communication clients
├── web-lib/                # Frontend common library
├── types/                  # Common type definitions
└── ui/                     # UI components
```

## Database Configuration

| Service | Database Name | Port |
|---------|---------------|------|
| AuthN API | authn_db | 6000 |
| AuthZ API | authz_db | 6001 |
| Task API | task_db | 6010 |
| Document API | document_db | 6011 |

## Tech Stack

- **Monorepo**: Turborepo
- **Runtime**: Node.js (v20+)
- **Package Manager**: pnpm
- **Backend**: Hono
- **Frontend**: Next.js (App Router)
- **Authentication**: better-auth (JWT Plugin + Admin Plugin)
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Styling**: Tailwind CSS
