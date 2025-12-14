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
| Workspace | `workspace:{resource}:{action}` | `workspace:task:read`, `workspace:task:create` |
| Workspace (ownership) | `workspace:{resource}:{action}:{scope}` | `workspace:task:update:own`, `workspace:task:delete:all` |

### Action Types

| Action | Description |
|--------|-------------|
| `read` | Read/view resources |
| `create` | Create new resources |
| `update` | Modify existing resources |
| `delete` | Remove resources |

### Ownership Scopes

| Scope | Description |
|-------|-------------|
| `:own` | Can only operate on resources owned by the user |
| `:all` | Can operate on all resources regardless of ownership |

**Note:** Users with `:all` permission automatically have `:own` permission as well.

## Permission List

### Organization Level Permissions

| Permission ID | Description | Assigned Roles |
|---------------|-------------|----------------|
| `org:manage` | Organization management (Console access) | org:owner |
| `org:users` | Organization user management | org:owner |
| `org:workspaces` | Workspace management (all WS access) | org:owner |
| `org:settings` | Organization settings changes | org:owner |

### Workspace Level Permissions

#### Task Management

| Permission ID | Description | Assigned Roles |
|---------------|-------------|----------------|
| `workspace:task:read` | Read all tasks | owner, member, viewer |
| `workspace:task:create` | Create tasks | owner, member |
| `workspace:task:update:own` | Update own tasks | owner, member |
| `workspace:task:update:all` | Update all tasks | owner |
| `workspace:task:delete:own` | Delete own tasks | owner, member |
| `workspace:task:delete:all` | Delete all tasks | owner |

#### Document Management

| Permission ID | Description | Assigned Roles |
|---------------|-------------|----------------|
| `workspace:document:read` | Read all documents | owner, member, viewer |
| `workspace:document:create` | Create documents | owner, member |
| `workspace:document:update:own` | Update own documents | owner, member |
| `workspace:document:update:all` | Update all documents | owner |
| `workspace:document:delete:own` | Delete own documents | owner, member |
| `workspace:document:delete:all` | Delete all documents | owner |

#### Schedule Management

| Permission ID | Description | Assigned Roles |
|---------------|-------------|----------------|
| `workspace:schedule:read` | Read all schedules | owner, member, viewer |
| `workspace:schedule:create` | Create schedules | owner, member |
| `workspace:schedule:update:own` | Update own schedules | owner, member |
| `workspace:schedule:update:all` | Update all schedules | owner |
| `workspace:schedule:delete:own` | Delete own schedules | owner, member |
| `workspace:schedule:delete:all` | Delete all schedules | owner |

#### Workspace Management

| Permission ID | Description | Assigned Roles |
|---------------|-------------|----------------|
| `workspace:owner` | Workspace owner permission | owner |

## Authorization Check Flow

### Zero Trust Architecture

All API requests go through the following permission check flow:

```
┌─────────────────────────────────────────────────────────────┐
│                     AuthZ API                                │
├─────────────────────────────────────────────────────────────┤
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
│    - For :own, also check if user has :all permission        │
└─────────────────────────────────────────────────────────────┘

                            ↓ (returns allowed: true/false)

┌─────────────────────────────────────────────────────────────┐
│                  Business Service                            │
├─────────────────────────────────────────────────────────────┤
│ 5. Ownership Verification (for :own permissions)             │
│    - Get resource from database                              │
│    - Compare resource.createdBy with userId                  │
│    - If user doesn't have :all, verify ownership             │
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

### Permission Check Logic for :own/:all

AuthZ API only checks if the user has the requested permission. **Ownership verification is the responsibility of business services.**

```typescript
// AuthZ API logic:
// - For :own permissions, check if user has :own OR :all permission
// - For :all permissions, check if user has :all permission
// - AuthZ does NOT verify resource ownership

async function checkWorkspacePermission(
  roleId: string,
  permission: string
): Promise<AuthorizationResult> {
  // Direct permission check
  if (await hasRolePermission(roleId, permission)) {
    return { allowed: true };
  }

  // For :own permissions, also check if user has :all permission
  if (permission.endsWith(":own")) {
    const allPermission = permission.replace(/:own$/, ":all");
    if (await hasRolePermission(roleId, allPermission)) {
      return { allowed: true };
    }
  }

  return { allowed: false, reason: "Insufficient permission" };
}
```

### Ownership Verification in Business Services

Business services (Task API, Document API) are responsible for verifying resource ownership:

```typescript
// Business service (e.g., Task API) ownership verification
async function updateTask(taskId: string, userId: string, updates: TaskUpdate) {
  const task = await getTask(taskId);

  // 1. Check permission with AuthZ API
  const authResult = await checkPermission({
    userId,
    workspaceId: task.workspaceId,
    permission: "workspace:task:update:own",
  });

  if (!authResult.allowed) {
    throw new ForbiddenError("No permission to update tasks");
  }

  // 2. Verify ownership (business service responsibility)
  // If user only has :own permission, verify they own the resource
  const hasAllPermission = await checkPermission({
    userId,
    workspaceId: task.workspaceId,
    permission: "workspace:task:update:all",
  });

  if (!hasAllPermission.allowed && task.createdBy !== userId) {
    throw new ForbiddenError("Cannot update tasks created by others");
  }

  // 3. Perform the update
  return await updateTaskInDb(taskId, updates);
}
```

## Usage in Business Services

### Task API / Document API

```typescript
// Request headers
Authorization: Bearer <JWT>
X-Workspace-ID: <workspace-id>

// Create task (no ownership check needed)
const authResult = await checkPermission({
  userId: user.sub,
  workspaceId: workspaceId,
  permission: "workspace:task:create",
});

if (!authResult.allowed) {
  return c.json({ error: "Forbidden" }, 403);
}

// Update task (ownership check done by business service)
const task = await getTask(taskId);

// Step 1: Check if user has update permission
const authResult = await checkPermission({
  userId: user.sub,
  workspaceId: workspaceId,
  permission: "workspace:task:update:own",
});

if (!authResult.allowed) {
  return c.json({ error: "Forbidden" }, 403);
}

// Step 2: Check ownership (business service logic)
const hasAllPermission = await checkPermission({
  userId: user.sub,
  workspaceId: workspaceId,
  permission: "workspace:task:update:all",
});

if (!hasAllPermission.allowed && task.createdBy !== user.sub) {
  return c.json({ error: "Cannot modify resources owned by others" }, 403);
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

| App | user.role='admin' | org:owner | org:member | WS member |
|-----|-------------------|-----------|------------|-----------|
| System Admin Web | Allowed | Not allowed | Not allowed | Not allowed |
| Console Web | Allowed | Allowed | Not allowed | Not allowed |
| Task Web | Allowed | Allowed | Allowed | Allowed |
| Document Web | Allowed | Allowed | Allowed | Allowed |

### Resource Operation Access

| Operation | workspace:owner | workspace:member | workspace:viewer |
|-----------|-----------------|------------------|------------------|
| Read resources | All | All | All |
| Create resources | Allowed | Allowed | Not allowed |
| Update own resources | Allowed | Allowed | Not allowed |
| Update all resources | Allowed | Not allowed | Not allowed |
| Delete own resources | Allowed | Allowed | Not allowed |
| Delete all resources | Allowed | Not allowed | Not allowed |

## Initial Permission Data

Permission data inserted by seed script:

```typescript
const permissionsData = [
  // Task management
  { id: "workspace:task:read", description: "Read all tasks" },
  { id: "workspace:task:create", description: "Create tasks" },
  { id: "workspace:task:update:own", description: "Update own tasks" },
  { id: "workspace:task:update:all", description: "Update all tasks" },
  { id: "workspace:task:delete:own", description: "Delete own tasks" },
  { id: "workspace:task:delete:all", description: "Delete all tasks" },
  // Document management
  { id: "workspace:document:read", description: "Read all documents" },
  { id: "workspace:document:create", description: "Create documents" },
  { id: "workspace:document:update:own", description: "Update own documents" },
  { id: "workspace:document:update:all", description: "Update all documents" },
  { id: "workspace:document:delete:own", description: "Delete own documents" },
  { id: "workspace:document:delete:all", description: "Delete all documents" },
  // Schedule management
  { id: "workspace:schedule:read", description: "Read all schedules" },
  { id: "workspace:schedule:create", description: "Create schedules" },
  { id: "workspace:schedule:update:own", description: "Update own schedules" },
  { id: "workspace:schedule:update:all", description: "Update all schedules" },
  { id: "workspace:schedule:delete:own", description: "Delete own schedules" },
  { id: "workspace:schedule:delete:all", description: "Delete all schedules" },
  // Workspace management
  { id: "workspace:owner", description: "Workspace owner permission" },
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
5. **Resource Ownership**: Members can only modify their own resources
6. **Audit Logs**: Log permission check results (future implementation)
