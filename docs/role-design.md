# Role Design

## Overview

This system has three levels of roles:

1. **User Role (user.role)** - Managed in AuthN API, system-wide permissions
2. **Organization Role** - Managed in AuthZ API, organization-level permissions
3. **Workspace Role** - Managed in AuthZ API, workspace-level permissions

## 1. User Role (user.role)

System-wide permission level managed in AuthN API's `user` table.

| Value | Description | Access Scope |
|-------|-------------|--------------|
| `admin` | System administrator (Super Admin) | Can access all Organizations/Workspaces |
| `user` / `null` | Regular user | Permissions managed via Organization/Workspace membership |

### Super Admin (user.role = 'admin')

- Default role from better-auth admin plugin
- Bypasses AuthZ API permission checks
- Can get full Organization list from Console API
- Can access System Admin Web/API

```typescript
// AuthZ API decision
if (userRole === "admin") {
  return { allowed: true, reason: "Super-admin has full access" };
}
```

## 2. Organization Roles

Managed in AuthZ API's `organization_members` table.

| Role ID | Role Name | Description | Console Access |
|---------|-----------|-------------|----------------|
| `org:owner` | Organization Owner | Organization owner (full permissions) | Allowed |
| `org:member` | Organization Member | Organization member | Not allowed |

### Permission Mapping

```
org:owner
├── org:manage      # Organization management (Console access)
├── org:users       # User management
├── org:workspaces  # Workspace management (all WS access)
└── org:settings    # Organization settings

org:member
└── (No organization-level permissions, access only as Workspace member)
```

### Console Access Control

Only users with `org:manage` permission can access Console Web/API:

- `org:owner` → Console access allowed
- `org:member` → Console access not allowed (can only use Task Web/Document Web)

## 3. Workspace Roles

Managed in AuthZ API's `workspace_members` table.

| Role ID | Role Name | Description |
|---------|-----------|-------------|
| `workspace:owner` | Workspace Owner | Full workspace permissions |
| `workspace:member` | Workspace Member | Read/write own resources |
| `workspace:viewer` | Workspace Viewer | Read only |

### Permission Mapping

```
workspace:owner
├── workspace:owner                # WS owner permission
├── workspace:task:read            # Read all tasks
├── workspace:task:create          # Create tasks
├── workspace:task:update:own      # Update own tasks
├── workspace:task:update:all      # Update all tasks
├── workspace:task:delete:own      # Delete own tasks
├── workspace:task:delete:all      # Delete all tasks
├── workspace:document:read        # Read all documents
├── workspace:document:create      # Create documents
├── workspace:document:update:own  # Update own documents
├── workspace:document:update:all  # Update all documents
├── workspace:document:delete:own  # Delete own documents
├── workspace:document:delete:all  # Delete all documents
├── workspace:schedule:read        # Read all schedules
├── workspace:schedule:create      # Create schedules
├── workspace:schedule:update:own  # Update own schedules
├── workspace:schedule:update:all  # Update all schedules
├── workspace:schedule:delete:own  # Delete own schedules
└── workspace:schedule:delete:all  # Delete all schedules

workspace:member
├── workspace:task:read
├── workspace:task:create
├── workspace:task:update:own      # Can only update own tasks
├── workspace:task:delete:own      # Can only delete own tasks
├── workspace:document:read
├── workspace:document:create
├── workspace:document:update:own
├── workspace:document:delete:own
├── workspace:schedule:read
├── workspace:schedule:create
├── workspace:schedule:update:own
└── workspace:schedule:delete:own

workspace:viewer
├── workspace:task:read
├── workspace:document:read
└── workspace:schedule:read
```

## Role Hierarchy Relationships

```
┌─────────────────────────────────────────────────────────────┐
│ user.role = 'admin' (Super Admin)                           │
│   → Can access all Organizations/Workspaces                 │
│   → Bypasses AuthZ permission checks                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Organization Roles (org:owner)                              │
│   → org:workspaces grants access to all WS in organization  │
│   → org:manage grants Console access                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Workspace Roles (workspace:owner / workspace:member)        │
│   → Permissions within specific Workspace                   │
│   → Operate resources in Task Web / Document Web            │
└─────────────────────────────────────────────────────────────┘
```

## Database Tables

### AuthN API (authn_db)

```sql
-- user table
CREATE TABLE "user" (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT,  -- 'admin' | 'user' | NULL
  ...
);
```

### AuthZ API (authz_db)

```sql
-- roles table
CREATE TABLE roles (
  id TEXT PRIMARY KEY,  -- 'org:owner', 'workspace:owner', etc.
  name TEXT NOT NULL
);

-- permissions table
CREATE TABLE permissions (
  id TEXT PRIMARY KEY,  -- 'org:manage', 'workspace:task:read', etc.
  description TEXT
);

-- role_permissions table
CREATE TABLE role_permissions (
  role_id TEXT REFERENCES roles(id),
  permission_id TEXT REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);

-- organization_members table
CREATE TABLE organization_members (
  user_id TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  role_id TEXT REFERENCES roles(id),
  PRIMARY KEY (user_id, organization_id)
);

-- workspace_members table
CREATE TABLE workspace_members (
  user_id TEXT NOT NULL,
  workspace_id UUID REFERENCES workspaces(id),
  role_id TEXT REFERENCES roles(id),
  PRIMARY KEY (user_id, workspace_id)
);
```

## Initial Role Data

Role data inserted by seed script:

```typescript
const rolesData = [
  { id: "org:owner", name: "Organization Owner" },
  { id: "org:member", name: "Organization Member" },
  { id: "workspace:owner", name: "Workspace Owner" },
  { id: "workspace:member", name: "Workspace Member" },
  { id: "workspace:viewer", name: "Workspace Viewer" },
];
```

## Use Cases

### Case 1: Super Admin manages entire system

```
user.role = 'admin'
  → Bypasses AuthZ API permission checks
  → Gets full Organization list from Console API
  → Manages users and organizations in System Admin Web
```

### Case 2: Organization owner manages organization

```
organization_members.role_id = 'org:owner'
  → Access Console Web via org:manage permission
  → Access all Workspaces in organization via org:workspaces permission
  → Can create/delete Workspaces, manage members
```

### Case 3: Regular member uses Workspace

```
organization_members.role_id = 'org:member'
workspace_members.role_id = 'workspace:member'
  → Cannot access Console Web
  → Operates resources in assigned WS via Task Web / Document Web
  → Can read/create and update/delete own resources
```

### Case 4: View-only user

```
workspace_members.role_id = 'workspace:viewer'
  → View only in Task Web / Document Web
  → Cannot create, update, or delete
```
