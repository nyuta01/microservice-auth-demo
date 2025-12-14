# Task API

Task management business API service. Built with [Hono](https://hono.dev/) + [Zod OpenAPI](https://github.com/honojs/middleware/tree/main/packages/zod-openapi) + [Drizzle ORM](https://orm.drizzle.team/).

## Getting Started

Start the development server:

```bash
pnpm dev
```

The server runs at [http://localhost:10100](http://localhost:10100).

## Environment Variables

The following environment variables are required:

```bash
DATABASE_URL_TASK=postgresql://...
SERVICE_URL_AUTHZ=http://localhost:10001
INTERNAL_API_SECRET=internal_shared_secret_key
BETTER_AUTH_URL=http://localhost:10000
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

All endpoints require JWT authentication and `X-Workspace-ID` header.

### Task Operations

| Method | Path | Description | Required Permission |
|--------|------|-------------|---------------------|
| GET | `/api/tasks` | Get task list | workspace:task:read |
| GET | `/api/tasks/:id` | Get task details | workspace:task:read |
| POST | `/api/tasks` | Create task | workspace:task:write |
| PUT | `/api/tasks/:id` | Update task | workspace:task:write |
| DELETE | `/api/tasks/:id` | Delete task | workspace:task:delete |
| PATCH | `/api/tasks/:id/status` | Update status | workspace:task:write |
| PATCH | `/api/tasks/:id/assign` | Update assignee | workspace:task:assign |

### Request Examples

```bash
# Get task list
curl -H "Authorization: Bearer <token>" \
     -H "X-Workspace-ID: <workspace-id>" \
     http://localhost:10100/api/tasks

# Create task
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "X-Workspace-ID: <workspace-id>" \
     -H "Content-Type: application/json" \
     -d '{"title": "New task", "priority": "high"}' \
     http://localhost:10100/api/tasks
```

## OpenAPI Documentation

View OpenAPI schema at [http://localhost:10100/api/doc](http://localhost:10100/api/doc).

## Authentication & Authorization

1. **JWT Authentication**: Verify JWT tokens issued by AuthN API
2. **Workspace Isolation**: Specify workspace via `X-Workspace-ID` header
3. **Permission Check**: Verify operation permissions via AuthZ API

## Data Model

```typescript
{
  id: string;           // UUID
  workspaceId: string;  // Workspace UUID
  title: string;        // Task title
  description: string | null;  // Description
  status: 'todo' | 'in_progress' | 'done';  // Status
  priority: 'low' | 'medium' | 'high';      // Priority
  assigneeId: string | null;   // Assignee ID
  dueDate: string | null;      // Due date (ISO8601)
  createdAt: string;    // Created datetime
  updatedAt: string;    // Updated datetime
  createdBy: string;    // Creator ID
}
```

## Tech Stack

- [Hono](https://hono.dev/) - Web framework
- [Zod OpenAPI](https://github.com/honojs/middleware/tree/main/packages/zod-openapi) - OpenAPI schema generation
- [Drizzle ORM](https://orm.drizzle.team/) - Database ORM
- [PostgreSQL](https://www.postgresql.org/) - Database (Port 6010)
