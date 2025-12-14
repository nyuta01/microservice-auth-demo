# Service Details

## Core Services

### AuthN API (Port 10000)

**Role**: Authentication, user management, JWT issuance

**Tech Stack**: Hono + better-auth (JWT Plugin + Admin Plugin)

**Main Features**:
- User registration and login
- JWT token issuance (includes `role` field)
- Session management
- User role management (`admin` / `user`)

**JWT Payload**:
```typescript
{
  id: string,      // User ID
  email: string,
  name: string,
  role: string,    // 'admin' | 'user'
}
```

**Database**: `authn_db` (Port 6000)

### AuthZ API (Port 10001)

**Role**: Authorization, organization/workspace management

**Tech Stack**: Hono + Drizzle ORM

**Main Endpoints**:
- `POST /internal/authorize` - Permission check (Zero Trust: role from JWT)
- `POST /internal/user-workspaces` - User's workspace list
- `GET /internal/organizations` - All organizations list (for super-admin)
- `GET /internal/organizations/{id}/members` - Organization members list
- `GET /internal/workspaces/{id}/members` - Workspace members list
- `POST /internal/workspaces` - Create workspace
- Member management endpoints

**Permission Check Logic**:
```typescript
// 1. Super-admin check
if (userRole === "admin") {
  return { allowed: true };
}

// 2. Permission scope determination
if (permission.startsWith("org:")) {
  // Organization permission check
} else {
  // Workspace permission check (org:workspaces grants all WS access)
}
```

**Database**: `authz_db` (Port 6001)

## Business Services

### Task API (Port 10100)

**Role**: Task management API

**Main Endpoints**:
- `GET /api/tasks` - Task list
- `POST /api/tasks` - Create task
- `GET /api/tasks/:id` - Task details
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

**Authentication & Authorization**:
- JWT token verification
- Workspace specified via `X-Workspace-ID` header
- `workspace:task:*` permission check via AuthZ API

**Database**: `task_db` (Port 6010)

### Task Web (Port 20100)

**Role**: Task management web application

**Main Pages**:
- `/` - Workspace selection (if multiple) or auto-redirect
- `/org/{orgId}/workspace/{wsId}` - Task list
- `/org/{orgId}/workspace/{wsId}/tasks/new` - Create task
- `/org/{orgId}/workspace/{wsId}/tasks/:id` - Task details
- `/login` - Login
- `/logout` - Logout

### Document API (Port 10101)

**Role**: Document management API

**Main Endpoints**:
- `GET /api/documents` - Document list
- `POST /api/documents` - Create document
- `GET /api/documents/:id` - Document details
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document

**Authentication & Authorization**:
- JWT token verification
- Workspace specified via `X-Workspace-ID` header
- `workspace:document:*` permission check via AuthZ API

**Database**: `document_db` (Port 6011)

### Document Web (Port 20101)

**Role**: Document management web application

**Main Pages**:
- `/` - Workspace selection (if multiple) or auto-redirect
- `/org/{orgId}/workspace/{wsId}` - Document list
- `/org/{orgId}/workspace/{wsId}/documents/new` - Create document
- `/org/{orgId}/workspace/{wsId}/documents/:id` - Document details
- `/login` - Login
- `/logout` - Logout

## Admin Services

### Console API (Port 10200)

**Role**: Organization/Workspace integrated management API

**Target Users**:
- Users with `org:owner` / `org:admin` role
- Super Admin (`user.role = 'admin'`)

**Main Endpoints**:
- `GET /api/portal` - Portal info (filtered by org:manage permission, super-admin sees all)
- `GET /api/user-workspaces` - User's workspace list (no filtering)
- `GET /api/organizations` - Organization list
- `GET /api/workspaces` - Workspace list
- `POST /api/workspaces` - Create workspace
- `DELETE /api/workspaces/:id` - Delete workspace
- `GET /api/members` - Members list
- Member management endpoints
- `GET /api/dashboard/*` - Dashboard data

**Access Control**:
- `/api/portal`: Returns only organizations with `org:manage` permission
- `/api/user-workspaces`: No filtering (for Task Web/Document Web)
- Super Admin: Returns all organizations

### Console Web (Port 20200)

**Role**: Organization/Workspace management console

**Target Users**:
- Users with `org:owner` / `org:admin` role
- Super Admin

**Main Pages**:
- `/` - Organization selection
- `/org/{orgId}` - Organization portal
- `/org/{orgId}/workspaces` - Workspace management
- `/org/{orgId}/members` - Member management
- `/login` - Login
- `/logout` - Logout

**Access Control**:
- Shows "Organization management permission required" if user lacks `org:manage` permission

### System Admin API (Port 10201)

**Role**: System-wide management API (super-admin only)

**Target Users**: Super Admin (`user.role = 'admin'`) only

**Main Endpoints**:
- `GET /api/dashboard` - System dashboard
- `GET /api/users` - All users list
- `POST /api/users` - Create user
- `GET /api/organizations` - All organizations list

**Authentication & Authorization**:
- Checks JWT `role === 'admin'`

### System Admin Web (Port 20201)

**Role**: System management UI (super-admin only)

**Target Users**: Super Admin (`user.role = 'admin'`) only

**Main Pages**:
- `/` - System dashboard
- `/users` - User management
- `/users/create` - Create user
- `/organizations` - Organization management
- `/organizations/:id` - Organization details
- `/login` - Login
- `/logout` - Logout

## Common Packages

### packages/api-middleware

Common middleware for JWT verification, CORS configuration, error handling

**Exports**:
- `verifyJwt(serviceName)` - JWT verification middleware
- `corsConfig` - CORS configuration
- `createErrorHandler(serviceName)` - Error handler
- `notFoundHandler` - 404 handler

### packages/api-clients

Inter-service communication clients

**Exports**:
- `checkPermission(params)` - Permission check via AuthZ API

### packages/web-lib

Frontend common library

**Exports**:
- `WorkspaceProvider` - Workspace context
- `useWorkspace()` - Workspace info hook
- `authClient` - better-auth client

### packages/types

Common type definitions

**Exports**:
- `OrganizationInfo`, `WorkspaceInfo`, etc.
