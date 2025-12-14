# Organization/Workspace Structure

## Overview

This system supports a multi-tenant structure, separating data in the following hierarchy:

```
Organization
  └── Workspace
        └── Resources (products, orders, etc.)
```

## Hierarchy Structure

### Organization
- Top-level tenant unit
- Contains multiple Workspaces
- Examples: "Demo Corp", "Acme Inc."

### Workspace
- Subdivision within an Organization
- Resources (products, orders, etc.) are separated by Workspace
- Examples: "Shibuya Store", "Tokyo Office"

### User
- Can belong to multiple Workspaces
- Can have different roles per Workspace
- Example: User A is admin in "Shibuya Store", staff in "Tokyo Office"

## Data Model

### Organizations
```typescript
{
  id: uuid,
  name: string,
  slug: string (unique),
  createdAt: timestamp
}
```

### Workspaces
```typescript
{
  id: uuid,
  organizationId: uuid (FK),
  name: string,
  createdAt: timestamp
}
```

### Workspace Members
```typescript
{
  userId: string (FK to AuthN API),
  workspaceId: uuid (FK),
  roleId: string (FK),
  joinedAt: timestamp
}
```

## Permission Management

### Role
Roles defined per Workspace

- `admin`: Administrator (full permissions)
- `staff`: Staff (read permissions)

### Permission
Permissions defined per resource

- `order:read`: Read orders
- `order:write`: Create/update orders
- `product:read`: Read products
- `product:write`: Create/update products

### Role-Permission Association
Assign permissions to roles

```
admin:
  - order:read
  - order:write
  - product:read
  - product:write

staff:
  - order:read
  - product:read
```

## Data Separation

### Workspace Separation
Resource service (Order, Product) data is logically separated by `workspaceId`.

```sql
-- Getting orders
SELECT * FROM orders
WHERE workspace_id = 'workspace_uuid';

-- Getting products
SELECT * FROM products
WHERE workspace_id = 'workspace_uuid';
```

### Authorization Check
The following checks are performed when accessing resources:

1. Verify user is a member of the Workspace
2. Verify user's role has the required permission

```typescript
// Authorization check example
const authzRes = await fetch('http://authz-api:4002/internal/authorize', {
  method: 'POST',
  headers: {
    'X-Internal-Secret': internalSecret,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    userId: user.id,
    workspaceId: workspaceId,
    permission: 'order:write',
  }),
});
```

## Frontend Workspace Selection

### Workspace Selection Feature
Display Workspace selection dropdown in header

- Display Organization/Workspace hierarchy
- Save selected Workspace ID in Cookie
- Send via `X-Workspace-ID` header in API requests

### Cookie Management
```typescript
// Save Workspace ID to Cookie
document.cookie = `workspace_id=${workspaceId}; path=/; max-age=31536000`;

// Get in Server Component
const cookieStore = await cookies();
const workspaceId = cookieStore.get('workspace_id')?.value;
```

### Getting Workspace List
```typescript
// Get workspace list via AuthN API
const res = await fetch(`${authUrl}/api/user/workspaces`, {
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
  },
});

const data = await res.json();
// data.organizations[].workspaces[] contains workspace list
```

## Initial Data

### Demo Data
Initial data inserted by `apps/authz-api/scripts/seed.ts`

```sql
-- Organization (RFC 4122 compliant UUID)
INSERT INTO organizations (id, name, slug) VALUES
  ('00000000-0000-4000-a000-000000000001', 'Acme Corporation', 'acme');

-- Workspace
INSERT INTO workspaces (id, organization_id, name) VALUES
  ('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-a000-000000000001', 'Engineering');

-- Roles
INSERT INTO roles (id, name) VALUES
  ('admin', 'Administrator'),
  ('staff', 'Staff');

-- Permissions
INSERT INTO permissions (id, description) VALUES
  ('order:read', 'Read orders'),
  ('order:write', 'Create and update orders'),
  ('product:read', 'Read products'),
  ('product:write', 'Create and update products');

-- Role-Permission mappings
INSERT INTO role_permissions (role_id, permission_id) VALUES
  ('admin', 'order:read'),
  ('admin', 'order:write'),
  ('admin', 'product:read'),
  ('admin', 'product:write'),
  ('staff', 'order:read'),
  ('staff', 'product:read');
```

### Demo User Workspace Link
Demo users are linked to Workspaces in `apps/authn-api/src/create-demo-user.ts`

```typescript
// Link user to Workspace
await db.execute(sql`
  INSERT INTO workspace_members (user_id, workspace_id, role_id)
  VALUES (${userId}, ${DEMO_WORKSPACE_ID}, ${role})
  ON CONFLICT DO NOTHING
`);
```

## Use Cases

### 1. User belongs to multiple Workspaces
- User A is admin in "Shibuya Store", staff in "Tokyo Office"
- Can switch via Workspace selection in header

### 2. Data separation by Workspace
- "Shibuya Store" products are not visible from "Tokyo Office"
- Orders are also managed per Workspace

### 3. Access control by permissions
- admin role: Can create/update products and orders
- staff role: Can only view products and orders

## Implementation Points

1. **Getting Workspace ID**: Get from Cookie, use default if not present
2. **API requests**: Always include `X-Workspace-ID` header
3. **Authorization check**: Verify permissions with `authz-api` before resource operations
4. **Data filtering**: Always filter by `workspaceId` in queries
