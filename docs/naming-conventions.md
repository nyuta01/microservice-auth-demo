# Naming Conventions (New Architecture)

## Overview

Defines consistent naming conventions based on best practices.

## Service Naming Conventions

### Service Names

**Rule**: kebab-case, descriptive names

```typescript
// ✅ Correct examples
task-api
task-web
document-api
document-web
schedule-api
schedule-web
console-web                 // Organization/Workspace level management console
console-api                 // Organization/Workspace level management API
system-admin-web            // System admin management UI
system-admin-api            // System admin management API
```

### Directory Names

**Rule**: kebab-case, match service names

```
apps/
├── task-api/
├── task-web/
├── document-api/
├── document-web/
├── schedule-api/
├── schedule-web/
├── console-web/            // Organization/Workspace level management console
├── console-api/            // Organization/Workspace level management API
├── system-admin-web/       // System admin management UI
└── system-admin-api/       // System admin management API
```

## Database Naming Conventions

### Table Names

**Rule**: plural, snake_case

```typescript
// ✅ Correct examples
export const tasks = pgTable('tasks', { ... });
export const documents = pgTable('documents', { ... });
export const schedules = pgTable('schedules', { ... });
export const organizations = pgTable('organizations', { ... });
export const workspaces = pgTable('workspaces', { ... });
export const workspaceMembers = pgTable('workspace_members', { ... });
export const organizationMembers = pgTable('organization_members', { ... });
```

### Column Names

**Rule**: snake_case (database), camelCase (TypeScript)

```typescript
// ✅ Correct examples
export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull(), // 'todo', 'in_progress', 'done'
  priority: text('priority').notNull(), // 'low', 'medium', 'high'
  assigneeId: text('assignee_id').references(() => user.id),
  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: text('created_by').notNull(),
});
```

**Rule details**:
- Database column names: `snake_case` (e.g., `workspace_id`, `created_at`)
- TypeScript property names: `camelCase` (e.g., `workspaceId`, `createdAt`)
- Foreign keys: `{referenced_table_name}_id` (e.g., `workspace_id`, `assignee_id`)

## Resource Naming Conventions

### Resource Names (Singular)

**Rule**: lowercase, singular

```typescript
// ✅ Correct examples
task
document
schedule
organization
workspace
```

### Resource Names (Plural)

**Rule**: lowercase, plural (table names, API endpoints)

```typescript
// ✅ Correct examples
tasks
documents
schedules
organizations
workspaces
```

## API Naming Conventions

### Endpoints

**Rule**: RESTful, kebab-case, plural resource names

```typescript
// ✅ Correct examples
GET    /api/tasks
POST   /api/tasks
GET    /api/tasks/:id
PUT    /api/tasks/:id
DELETE /api/tasks/:id
PATCH  /api/tasks/:id/status

GET    /api/documents
POST   /api/documents
GET    /api/documents/:id
PUT    /api/documents/:id
DELETE /api/documents/:id

GET    /api/schedules
POST   /api/schedules
GET    /api/schedules/:id
PUT    /api/schedules/:id
DELETE /api/schedules/:id
```

### Request/Response

**Rule**: camelCase

```typescript
// ✅ Correct examples
// Request
{
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assigneeId?: string;
  dueDate?: string;
}

// Response
{
  id: string;
  workspaceId: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigneeId: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}
```

## Role ID Naming Conventions

### Rules

**Format**: `{scope}:{role_name}`

- `scope`: `org` (organization) or `workspace`
- `role_name`: role name (lowercase, hyphen-separated allowed)

### Organization Roles

```typescript
// ✅ Correct examples
'org:owner'    // Organization owner
'org:admin'    // Organization admin
'org:member'   // Organization member
```

### Workspace Roles

```typescript
// ✅ Correct examples
'workspace:admin'   // Workspace admin
'workspace:member'  // Workspace member
'workspace:viewer'  // Workspace viewer
```

## Permission ID Naming Conventions

### Rules

**Format**: `{scope}:{resource}:{action}`

- `scope`: `org` (organization) or `workspace`
- `resource`: resource name (e.g., `task`, `document`, `schedule`)
- `action`: action (e.g., `read`, `write`, `delete`, `assign`)

### Organization Permissions

```typescript
// ✅ Correct examples
'org:manage'      // Organization management
'org:users'       // User management
'org:workspaces'  // Workspace management
'org:settings'    // Settings management
```

### Workspace Permissions

#### Task Management
```typescript
'workspace:task:read'     // Read tasks
'workspace:task:write'    // Create/update tasks
'workspace:task:delete'   // Delete tasks
'workspace:task:assign'   // Assign tasks
```

#### Document Management
```typescript
'workspace:document:read'   // Read documents
'workspace:document:write'  // Create/update documents
'workspace:document:delete' // Delete documents
```

#### Schedule Management
```typescript
'workspace:schedule:read'   // Read schedules
'workspace:schedule:write'  // Create/update schedules
'workspace:schedule:delete' // Delete schedules
```

## TypeScript Naming Conventions

### Variable and Function Names

**Rule**: camelCase

```typescript
// ✅ Correct examples
const taskId = 'task-123';
const workspaceId = 'workspace-456';
const organizationId = 'org-789';

function getTaskById(taskId: string): Promise<Task> {
  // ...
}

async function createTask(
  workspaceId: string,
  taskData: CreateTaskInput
): Promise<Task> {
  // ...
}
```

### Type and Interface Names

**Rule**: PascalCase

```typescript
// ✅ Correct examples
interface Task {
  id: string;
  workspaceId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

type TaskStatus = 'todo' | 'in_progress' | 'done';
type TaskPriority = 'low' | 'medium' | 'high';

interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: Date;
}
```

### Constant Names

**Rule**: UPPER_SNAKE_CASE

```typescript
// ✅ Correct examples
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;
const DEFAULT_TASK_STATUS = 'todo';
const DEFAULT_TASK_PRIORITY = 'medium';
```

## Environment Variable Naming Conventions

### Rules

**Format**: `{SCOPE}_{DESCRIPTION}` or `NEXT_PUBLIC_{DESCRIPTION}`

```typescript
// ✅ Correct examples
DATABASE_URL_AUTH
DATABASE_URL_AUTHZ
DATABASE_URL_TASK
DATABASE_URL_DOCUMENT
DATABASE_URL_SCHEDULE
BETTER_AUTH_SECRET
BETTER_AUTH_URL
INTERNAL_API_SECRET
SERVICE_URL_AUTHZ
NEXT_PUBLIC_AUTH_URL
NEXT_PUBLIC_TASK_API_URL
NEXT_PUBLIC_DOCUMENT_API_URL
NEXT_PUBLIC_SCHEDULE_API_URL
NEXT_PUBLIC_SYSTEM_ADMIN_API_URL
```

## File and Directory Names

### Rules

- File names: kebab-case (e.g., `task-api.ts`, `create-task.ts`)
- Directory names: kebab-case (e.g., `task-api`, `task-web`)
- Component files: PascalCase (e.g., `TaskList.tsx`, `TaskForm.tsx`)

### Examples

```
apps/
  task-api/
    src/
      db/
        schema.ts
        index.ts
      routes/
        tasks.ts
      index.ts
  task-web/
    app/
      tasks/
        page.tsx
        [id]/
          page.tsx
    components/
      TaskList.tsx
      TaskForm.tsx
    lib/
      task-client.ts
```

## Summary

Consistent naming conventions provide:

1. **Improved readability**: Scope and resource are clear
2. **Improved maintainability**: Structure can be inferred from naming
3. **Improved extensibility**: Easy to add new resources and permissions
4. **Team collaboration**: Unified conventions make collaboration easier
