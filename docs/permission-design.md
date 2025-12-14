# Permission Design

## Overview

This system uses a 3-tier permission model:

1. **System Level** - Super Admin (user.role = 'admin')
2. **Organization Level** - Organization-wide management permissions
3. **Workspace Level** - Permissions within individual workspaces

## Permission Naming Convention

| Scope | Format | Example |
|-------|--------|---------|
| Organization | `org:{action}` | `org:manage`, `org:users` |
| Workspace | `workspace:{resource}:{action}` | `workspace:task:read` |

## Permission List

### Organization Level Permissions

| Permission ID | Description | Assigned Roles |
|---------------|-------------|----------------|
| `org:manage` | Organization management (Console access) | org:owner, org:admin |
| `org:users` | Organization user management | org:owner, org:admin |
| `org:workspaces` | Workspace management (all WS access) | org:owner, org:admin |
| `org:settings` | Organization settings changes | org:owner, org:admin |

### Workspace Level Permissions

#### Task Management

| Permission ID | Description | Assigned Roles |
|---------------|-------------|----------------|
| `workspace:task:read` | Read tasks | admin, member, viewer |
| `workspace:task:write` | Create/update tasks | admin, member |
| `workspace:task:delete` | Delete tasks | admin |
| `workspace:task:assign` | Assign tasks | admin |

#### Document Management

| Permission ID | Description | Assigned Roles |
|---------------|-------------|----------------|
| `workspace:document:read` | Read documents | admin, member, viewer |
| `workspace:document:write` | Create/update documents | admin, member |
| `workspace:document:delete` | Delete documents | admin |

#### Schedule Management

| Permission ID | Description | Assigned Roles |
|---------------|-------------|----------------|
| `workspace:schedule:read` | Read schedules | admin, member, viewer |
| `workspace:schedule:write` | Create/update schedules | admin, member |
| `workspace:schedule:delete` | Delete schedules | admin |

#### Workspace Management

| Permission ID | Description | Assigned Roles |
|---------------|-------------|----------------|
| `workspace:admin` | Workspace admin permission | admin |

## Authorization Check Flow

### Zero Trust Architecture

All API requests go through the following permission check flow:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. JWT Verification                                          │
│    - Verify JWT issued by AuthN API                          │
│    - Extract user.role from JWT payload                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Super Admin Check                                         │
│    if (user.role === "admin") {                             │
│      return { allowed: true };  // Full permissions          │
│    }                                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Permission Scope Determination                            │
│    permission.startsWith("org:") → Organization check        │
│    permission.startsWith("workspace:") → Workspace check     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Organization/Workspace Membership Verification            │
│    - Reference organization_members / workspace_members      │
│    - Check permissions via role_permissions table            │
└─────────────────────────────────────────────────────────────┘
```

### AuthZ API Endpoint

```typescript
// POST /internal/authorize
{
  userId: string,
  organizationId?: string,
  workspaceId?: string,
  permission: string,
  userRole?: string  // user.role from JWT
}

// Response
{
  allowed: boolean,
  reason?: string
}
```

### Implementation Example

```typescript
// AuthZ API authorization logic
async function authorize(params: {
  userId: string;
  organizationId?: string;
  workspaceId?: string;
  permission: string;
  userRole?: string;
}): Promise<{ allowed: boolean; reason?: string }> {
  const { userId, organizationId, workspaceId, permission, userRole } = params;

  // 1. Super Admin check
  if (userRole === "admin") {
    return { allowed: true, reason: "Super-admin has full access" };
  }

  // 2. Permission scope determination
  if (permission.startsWith("org:")) {
    // Organization permission check
    if (!organizationId) {
      return { allowed: false, reason: "Organization ID required" };
    }
    return checkOrganizationPermission(userId, organizationId, permission);
  }

  // 3. Workspace permission check
  if (!workspaceId) {
    return { allowed: false, reason: "Workspace ID required" };
  }

  // Users with org:workspaces permission can access all Workspaces
  if (organizationId) {
    const hasOrgAccess = await checkOrganizationPermission(
      userId,
      organizationId,
      "org:workspaces"
    );
    if (hasOrgAccess.allowed) {
      return { allowed: true, reason: "Organization admin has workspace access" };
    }
  }

  return checkWorkspacePermission(userId, workspaceId, permission);
}
```

## Usage in Business Services

### Task API / Document API

```typescript
// Request headers
Authorization: Bearer <JWT>
X-Workspace-ID: <workspace-id>

// Permission check example
const authResult = await checkPermission({
  userId: user.sub,
  workspaceId: workspaceId,
  permission: "workspace:task:write",
  userRole: user.role,
});

if (!authResult.allowed) {
  return c.json({ error: "Forbidden" }, 403);
}
```

### Console API

```typescript
// Permission check when getting portal info
// Super Admin gets all Organizations
if (user.role === "admin") {
  const allOrgs = await callAuthZApi("/internal/organizations", "GET");
  return c.json({ organizations: allOrgs.organizations });
}

// Regular users get only organizations with org:manage permission
const userWorkspaces = await callAuthZApi("/internal/user-workspaces", "POST", {
  userId: user.sub,
});

// Filter by org:manage permission
const managableOrgs = await filterByPermission(
  userWorkspaces.organizations,
  user.sub,
  "org:manage"
);
```

## Access Control Matrix

### Web Application Access

| App | user.role='admin' | org:owner/admin | org:member | WS member |
|-----|-------------------|-----------------|------------|-----------|
| System Admin Web | Allowed | Not allowed | Not allowed | Not allowed |
| Console Web | Allowed | Allowed | Not allowed | Not allowed |
| Task Web | Allowed | Allowed | Allowed | Allowed |
| Document Web | Allowed | Allowed | Allowed | Allowed |

### Resource Operation Access

| Operation | workspace:admin | workspace:member | workspace:viewer |
|-----------|-----------------|------------------|------------------|
| View tasks | Allowed | Allowed | Allowed |
| Create tasks | Allowed | Allowed | Not allowed |
| Update tasks | Allowed | Allowed | Not allowed |
| Delete tasks | Allowed | Not allowed | Not allowed |
| Assign tasks | Allowed | Not allowed | Not allowed |
| View documents | Allowed | Allowed | Allowed |
| Create documents | Allowed | Allowed | Not allowed |
| Update documents | Allowed | Allowed | Not allowed |
| Delete documents | Allowed | Not allowed | Not allowed |

## Initial Permission Data

Permission data inserted by seed script:

```typescript
const permissionsData = [
  // Task management
  { id: "workspace:task:read", description: "Read tasks" },
  { id: "workspace:task:write", description: "Create and update tasks" },
  { id: "workspace:task:delete", description: "Delete tasks" },
  { id: "workspace:task:assign", description: "Assign tasks" },
  // Document management
  { id: "workspace:document:read", description: "Read documents" },
  { id: "workspace:document:write", description: "Create and update documents" },
  { id: "workspace:document:delete", description: "Delete documents" },
  // Schedule management
  { id: "workspace:schedule:read", description: "Read schedules" },
  { id: "workspace:schedule:write", description: "Create and update schedules" },
  { id: "workspace:schedule:delete", description: "Delete schedules" },
  // Workspace management
  { id: "workspace:admin", description: "Workspace administration" },
  // Organization management
  { id: "org:manage", description: "Manage organization" },
  { id: "org:users", description: "Manage users" },
  { id: "org:workspaces", description: "Manage workspaces" },
  { id: "org:settings", description: "Manage organization settings" },
];
```

## Security Considerations

1. **Zero Trust**: Permission check on every API request
2. **JWT Verification**: Verify JWT issued by AuthN API on every request
3. **Principle of Least Privilege**: Grant only minimum necessary permissions
4. **Scope Separation**: Clear separation of Organization/Workspace permissions
5. **Audit Logs**: Log permission check results (future implementation)
