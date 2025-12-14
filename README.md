# Microservice Auth Demo

A demo project implementing **shared authentication and authorization** across multiple microservices.

## Overview

Multiple services (Task Management, Document Management, etc.) share a **single Authentication service (AuthN)** and a **single Authorization service (AuthZ)**, enabling:

- Shared authentication - all services use the same AuthN API and session
- Centralized Organization/Workspace-based permission management
- Business services delegate auth logic to AuthN/AuthZ APIs (no auth code in each service)

```
┌─────────────────────────────────────────────────────────────────┐
│                        Web Applications                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Task Web   │  │Document Web │  │ Console Web │  ...        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
└─────────┼────────────────┼────────────────┼─────────────────────┘
          │                │                │
          │  JWT Token     │  JWT Token     │  JWT Token
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Services                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Task API   │  │Document API │  │ Console API │  ...        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
└─────────┼────────────────┼────────────────┼─────────────────────┘
          │                │                │
          │ Verify Token   │ Check Permission│
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Core Services                               │
│  ┌────────────────────────┐  ┌────────────────────────┐        │
│  │    AuthN API (10000)   │  │    AuthZ API (10001)   │        │
│  │                        │  │                        │        │
│  │  - better-auth         │  │  - Organization mgmt   │        │
│  │  - User authentication │  │  - Workspace mgmt      │        │
│  │  - Session management  │  │  - Membership          │        │
│  │  - JWT issuance        │  │  - Role management     │        │
│  └────────────────────────┘  └────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

## Authentication Flow (AuthN)

Uses [better-auth](https://www.better-auth.com/) to provide a shared authentication layer for all services.

1. User logs in via any Web app
2. AuthN API creates a session and issues a JWT
3. Web apps fetch the JWT from AuthN API
4. API services verify the JWT to identify the user

```typescript
// JWT verification in each API service (shared middleware)
app.use("*", verifyJwt(process.env.AUTH_SECRET!));
```

## Authorization Flow (AuthZ)

AuthZ API centrally manages Organization/Workspace permissions.

1. API service receives a request
2. Extract user ID from JWT
3. Query AuthZ API: "What can this user do in this Workspace?"
4. Allow or deny access based on permissions

```typescript
// Permission check via AuthZ API
const { allowed } = await authzClient.authorize({
  userId: "user-123",
  workspaceId: "ws-456",
  action: "task:create"
});
```

## Role System

### System Role (user.role)
Managed in AuthN API. System-wide privilege level.

| Role | Description |
|------|-------------|
| `admin` | System administrator (can access all Organizations/Workspaces) |
| `user` / `null` | Regular user (permissions via Organization/Workspace membership) |

### Organization Roles
Managed in AuthZ API. Permissions within an Organization.

| Role | Description |
|------|-------------|
| `org:owner` | Owner (full permissions - can manage members and Workspaces) |
| `org:member` | Member (Workspace access only) |

### Workspace Roles
Managed in AuthZ API. Permissions within a Workspace.

| Role | Description |
|------|-------------|
| `workspace:owner` | Owner (full permissions) |
| `workspace:member` | Member (read/write own resources) |
| `workspace:viewer` | Viewer (read only) |

## Service Architecture

### Core Services (Auth Infrastructure)
| Service | Port | Description |
|---------|------|-------------|
| AuthN API | 10000 | Authentication & JWT issuance via better-auth |
| AuthZ API | 10001 | Organization/Workspace permission management |

### Business Services
| Service | API | Web | Description |
|---------|-----|-----|-------------|
| Task | 10100 | 20100 | Task management |
| Document | 10101 | 20101 | Document management |

### Admin Services
| Service | API | Web | Description |
|---------|-----|-----|-------------|
| Console | 10200 | 20200 | Organization/Workspace management (for org:owner) |
| System Admin | 10201 | 20201 | System-wide management (for admin) |

## Setup

### 1. Environment Variables

```bash
cp .env.example .env
```

### 2. Start Databases

```bash
docker-compose up
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Run Migrations

```bash
pnpm db:generate
pnpm db:migrate
```

### 5. Seed Data

```bash
pnpm db:seed
```

### 6. Start Dev Server

```bash
pnpm dev
```

## Demo Users

All passwords are `password`.

### System Administrator

| Email | System Role | Description |
|-------|-------------|-------------|
| `super-admin@example.com` | admin | Can manage all Organizations/Workspaces |

### Acme Corporation

| Email | Name | Org Role | Workspace | Workspace Role |
|-------|------|----------|-----------|----------------|
| `org-owner-1@example.com` | Alice Johnson | org:owner | Engineering | workspace:owner |
| | | | Marketing | workspace:owner |
| `org-owner-2@example.com` | Bob Smith | org:owner | Engineering | workspace:owner |
| `ws-member-1@example.com` | Carol White | org:member | Engineering | workspace:member |
| | | | Marketing | workspace:member |
| `ws-viewer-1@example.com` | David Brown | org:member | Engineering | workspace:viewer |

### Global Tech Inc

| Email | Name | Org Role | Workspace | Workspace Role |
|-------|------|----------|-----------|----------------|
| `org-owner-3@example.com` | Eve Davis | org:owner | Product | workspace:owner |

### Multi-Organization Users

| Email | Name | Organization | Org Role | Workspace | Workspace Role |
|-------|------|--------------|----------|-----------|----------------|
| `multi-org-owner@example.com` | Frank Miller | Acme Corp | org:owner | Engineering | workspace:owner |
| | | Global Tech | org:owner | Product | workspace:owner |
| `multi-org-member@example.com` | Grace Lee | Acme Corp | org:member | Engineering | workspace:member |
| | | | | Marketing | workspace:viewer |
| | | Global Tech | org:member | Product | workspace:member |

## Verification

1. **Task Web** (http://localhost:20100) - Task management app
2. **Document Web** (http://localhost:20101) - Document management app
3. **Console Web** (http://localhost:20200) - Organization management
4. **System Admin Web** (http://localhost:20201) - System administration

## Tech Stack

| Category | Technology |
|----------|------------|
| Authentication | better-auth (JWT Plugin) |
| Backend | Hono |
| Frontend | Next.js (App Router) |
| Database | PostgreSQL + Drizzle ORM |
| Styling | Tailwind CSS + shadcn/ui |
| Monorepo | Turborepo + pnpm |

## Documentation

- [Architecture Design](./docs/architecture.md) - System architecture
- [Role Design](./docs/role-design.md) - Role system details
- [Permission Design](./docs/permission-design.md) - Permission system details
- [Port Assignment](./docs/port-assignment.md) - Port numbering rules
