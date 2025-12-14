# AuthZ API

Authorization management internal API service. Built with [Hono](https://hono.dev/) + [Drizzle ORM](https://orm.drizzle.team/).

## Getting Started

Start the development server:

```bash
pnpm dev
```

The server runs at [http://localhost:10001](http://localhost:10001).

## Environment Variables

The following environment variables are required:

```bash
DATABASE_URL_AUTHZ=postgresql://...
INTERNAL_API_SECRET=your-secret-key
```

## Database

### Generate migrations

```bash
pnpm db:generate
```

### Run migrations

```bash
pnpm db:migrate
```

### Seed data

```bash
pnpm db:seed
```

### Drizzle Studio

```bash
pnpm db:studio
```

## API Endpoints

### Authorization

- `POST /internal/authorize` - Permission check

#### Request Examples

**Organization level permission check** (permissions starting with `org:*`):

```json
{
  "userId": "user123",
  "organizationId": "00000000-0000-0000-0000-000000000001",
  "permission": "org:users"
}
```

**Workspace level permission check** (permissions starting with `workspace:*`):

```json
{
  "userId": "user123",
  "workspaceId": "00000000-0000-0000-0000-000000000001",
  "permission": "workspace:task:read"
}
```

#### Response Examples

```json
{
  "allowed": true
}
```

```json
{
  "allowed": false,
  "reason": "Insufficient permission"
}
```

#### Authorization Logic

1. **Determine scope from permission prefix**
   - `org:` → Organization level permission check
   - `workspace:` → Workspace level permission check

2. **Organization level** (`org:*`)
   - `organizationId` required
   - Check membership in `organization_members` table
   - Verify role has required permission

3. **Workspace level** (`workspace:*`)
   - `workspaceId` required
   - Organization admins (users with `org:workspaces` permission) can access all Workspaces
   - Check membership in `workspace_members` table
   - Verify role has required permission

### User Workspaces

- `POST /internal/user-workspaces` - Get user's workspace list

### Workspaces

- `GET /internal/workspaces/{workspaceId}/members` - Get workspace members list
- `POST /internal/workspaces` - Create workspace
- `PUT /internal/workspaces/{id}` - Update workspace
- `DELETE /internal/workspaces/{id}` - Delete workspace

### Organizations

- `GET /internal/organizations/{organizationId}/members` - Get organization members list

## Permission Design

See [docs/permission-design.md](../../docs/permission-design.md) for details.

### Permission Examples

#### Organization Level Permissions

- `org:manage` - Organization settings changes (full permissions)
- `org:users` - Organization user management
- `org:billing` - Billing and subscription management
- `org:workspaces` - Workspace creation/deletion, access to all Workspaces
- `org:settings` - View/edit organization settings

#### Workspace Level Permissions

- `workspace:task:read` - Read tasks
- `workspace:task:write` - Create/update tasks
- `workspace:task:delete` - Delete tasks
- `workspace:document:read` - Read documents
- `workspace:document:write` - Create/update documents
- `workspace:document:delete` - Delete documents

## OpenAPI Documentation

View OpenAPI schema at [http://localhost:10001/api/doc](http://localhost:10001/api/doc).

## Tech Stack

- [Hono](https://hono.dev/) - Web framework
- [Zod OpenAPI](https://github.com/honojs/middleware/tree/main/packages/zod-openapi) - OpenAPI schema generation
- [Drizzle ORM](https://orm.drizzle.team/) - Database ORM
- [PostgreSQL](https://www.postgresql.org/) - Database
