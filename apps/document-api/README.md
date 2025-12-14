# Document API

Document management business API service. Built with [Hono](https://hono.dev/) + [Zod OpenAPI](https://github.com/honojs/middleware/tree/main/packages/zod-openapi) + [Drizzle ORM](https://orm.drizzle.team/).

## Getting Started

Start the development server:

```bash
pnpm dev
```

The server runs at [http://localhost:10101](http://localhost:10101).

## Environment Variables

The following environment variables are required:

```bash
DATABASE_URL_DOCUMENT=postgresql://...
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

### Document Operations

| Method | Path | Description | Required Permission |
|--------|------|-------------|---------------------|
| GET | `/api/documents` | Get document list | workspace:document:read |
| GET | `/api/documents/:id` | Get document details | workspace:document:read |
| POST | `/api/documents` | Create document | workspace:document:write |
| PUT | `/api/documents/:id` | Update document | workspace:document:write |
| DELETE | `/api/documents/:id` | Delete document | workspace:document:delete |

### Request Examples

```bash
# Get document list
curl -H "Authorization: Bearer <token>" \
     -H "X-Workspace-ID: <workspace-id>" \
     http://localhost:10101/api/documents

# Create document
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "X-Workspace-ID: <workspace-id>" \
     -H "Content-Type: application/json" \
     -d '{"title": "New document", "content": "# Hello World"}' \
     http://localhost:10101/api/documents
```

## OpenAPI Documentation

View OpenAPI schema at [http://localhost:10101/api/doc](http://localhost:10101/api/doc).

## Authentication & Authorization

1. **JWT Authentication**: Verify JWT tokens issued by AuthN API
2. **Workspace Isolation**: Specify workspace via `X-Workspace-ID` header
3. **Permission Check**: Verify operation permissions via AuthZ API

## Data Model

```typescript
{
  id: string;           // UUID
  workspaceId: string;  // Workspace UUID
  title: string;        // Document title
  content: string;      // Content body
  type: 'markdown' | 'html' | 'plain';  // Document format
  tags: string[];       // Tags (PostgreSQL array)
  createdAt: string;    // Created datetime
  updatedAt: string;    // Updated datetime
  createdBy: string;    // Creator ID
  updatedBy: string;    // Updater ID
}
```

## Tech Stack

- [Hono](https://hono.dev/) - Web framework
- [Zod OpenAPI](https://github.com/honojs/middleware/tree/main/packages/zod-openapi) - OpenAPI schema generation
- [Drizzle ORM](https://orm.drizzle.team/) - Database ORM
- [PostgreSQL](https://www.postgresql.org/) - Database (Port 6011)
