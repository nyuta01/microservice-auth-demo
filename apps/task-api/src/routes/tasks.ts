import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { checkPermission } from "@repo/api-clients";
import type { JwtUser } from "@repo/api-middleware";
import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { tasks } from "../db/schema";

const app = new OpenAPIHono<{
  Variables: {
    user: JwtUser;
    userId: string;
  };
}>();

// Schema definitions
const WorkspaceIdHeaderSchema = z.object({
  "X-Workspace-ID": z.uuid().openapi({
    param: {
      name: "X-Workspace-ID",
      in: "header",
    },
    description: "Workspace ID",
    example: "00000000-0000-0000-0000-000000000001",
  }),
});

const TaskIdParamSchema = z.object({
  id: z.uuid().openapi({
    param: {
      name: "id",
      in: "path",
    },
    description: "Task ID",
    example: "00000000-0000-0000-0000-000000000001",
  }),
});

const TaskSchema = z
  .object({
    id: z.uuid().openapi({ example: "00000000-0000-0000-0000-000000000001" }),
    workspaceId: z.uuid().openapi({ example: "00000000-0000-0000-0000-000000000001" }),
    title: z.string().openapi({ example: "Task title" }),
    description: z.string().nullable().openapi({ example: "Task description" }),
    status: z.enum(["todo", "in_progress", "done"]).openapi({ example: "todo" }),
    priority: z.enum(["low", "medium", "high"]).openapi({ example: "medium" }),
    assigneeId: z.string().nullable().openapi({ example: "user123" }),
    dueDate: z.iso.datetime().nullable().openapi({ example: "2024-12-31T23:59:59Z" }),
    createdAt: z.iso.datetime().openapi({ example: "2024-01-01T00:00:00Z" }),
    updatedAt: z.iso.datetime().openapi({ example: "2024-01-01T00:00:00Z" }),
    createdBy: z.string().openapi({ example: "user123" }),
  })
  .openapi("Task");

const TaskListResponseSchema = z
  .object({
    tasks: z.array(TaskSchema),
  })
  .openapi("TaskListResponse");

const TaskResponseSchema = z
  .object({
    task: TaskSchema,
  })
  .openapi("TaskResponse");

const CreateTaskRequestSchema = z
  .object({
    title: z.string().min(1).openapi({ example: "New task" }),
    description: z.string().nullable().optional().openapi({ example: "Task description" }),
    status: z.enum(["todo", "in_progress", "done"]).optional().openapi({ example: "todo" }),
    priority: z.enum(["low", "medium", "high"]).optional().openapi({ example: "medium" }),
    assigneeId: z.string().nullable().optional().openapi({ example: "user123" }),
    dueDate: z
      .iso
      .datetime()
      .nullable()
      .optional()
      .openapi({ example: "2024-12-31T23:59:59Z" }),
  })
  .openapi("CreateTaskRequest");

const UpdateTaskRequestSchema = CreateTaskRequestSchema.partial().openapi("UpdateTaskRequest");

// Get task list
const getTasksRoute = createRoute({
  method: "get",
  path: "/",
  request: {
    headers: WorkspaceIdHeaderSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: TaskListResponseSchema,
        },
      },
      description: "Task list",
    },
  },
  tags: ["Tasks"],
  summary: "Get task list",
  description: "Retrieve a list of tasks within the workspace",
});

app.openapi(getTasksRoute, async (c) => {
  const user = c.get("user");
  const workspaceId = c.req.valid("header")["X-Workspace-ID"];
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  if (!user?.sub) {
    throw new Error("Unauthorized: User not authenticated");
  }

  // Authorization check: 'workspace:task:read'
  const isAllowed = await checkPermission({
    userId: user.sub,
    workspaceId,
    permission: "workspace:task:read",
    token,
  });

  if (!isAllowed) {
    throw new Error("Forbidden: You do not have workspace:task:read permission");
  }

  // Fetch data
  const data = await db.select().from(tasks).where(eq(tasks.workspaceId, workspaceId));

  // Convert Date objects to ISO strings and validate with Zod schema
  const transformedTasks = data.map((task) => {
    const transformed = {
      id: task.id,
      workspaceId: task.workspaceId,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      createdAt: task.createdAt ? task.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: task.updatedAt ? task.updatedAt.toISOString() : new Date().toISOString(),
      createdBy: task.createdBy,
    };
    return TaskSchema.parse(transformed);
  });

  return c.json({ tasks: transformedTasks } satisfies z.infer<typeof TaskListResponseSchema>);
});

// Get task details
const getTaskRoute = createRoute({
  method: "get",
  path: "/{id}",
  request: {
    params: TaskIdParamSchema,
    headers: WorkspaceIdHeaderSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: TaskResponseSchema,
        },
      },
      description: "Task details",
    },
  },
  tags: ["Tasks"],
  summary: "Get task details",
  description: "Retrieve the details of the specified task",
});

app.openapi(getTaskRoute, async (c) => {
  const user = c.get("user");
  const workspaceId = c.req.valid("header")["X-Workspace-ID"];
  const { id: taskId } = c.req.valid("param");
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  // Authorization check
  const isAllowed = await checkPermission({
    userId: user.sub,
    workspaceId,
    permission: "workspace:task:read",
    token,
  });

  if (!isAllowed) {
    throw new Error("Forbidden");
  }

  // Fetch data
  const task = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)))
    .limit(1);

  if (!task[0]) {
    throw new Error("Task not found");
  }

  // Convert Date objects to ISO strings and validate with Zod schema
  const transformed = {
    id: task[0].id,
    workspaceId: task[0].workspaceId,
    title: task[0].title,
    description: task[0].description,
    status: task[0].status,
    priority: task[0].priority,
    assigneeId: task[0].assigneeId,
    dueDate: task[0].dueDate ? task[0].dueDate.toISOString() : null,
    createdAt: task[0].createdAt ? task[0].createdAt.toISOString() : new Date().toISOString(),
    updatedAt: task[0].updatedAt ? task[0].updatedAt.toISOString() : new Date().toISOString(),
    createdBy: task[0].createdBy,
  };
  const transformedTask = TaskSchema.parse(transformed);

  return c.json({ task: transformedTask } satisfies z.infer<typeof TaskResponseSchema>);
});

// Create task
const createTaskRoute = createRoute({
  method: "post",
  path: "/",
  request: {
    headers: WorkspaceIdHeaderSchema,
    body: {
      content: {
        "application/json": {
          schema: CreateTaskRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: TaskResponseSchema,
        },
      },
      description: "Task created successfully",
    },
  },
  tags: ["Tasks"],
  summary: "Create task",
  description: "Create a new task",
});

app.openapi(createTaskRoute, async (c) => {
  const user = c.get("user");
  const workspaceId = c.req.valid("header")["X-Workspace-ID"];
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  if (!user?.sub) {
    throw new Error("Unauthorized: User not authenticated");
  }

  // Authorization check: 'workspace:task:write'
  const isAllowed = await checkPermission({
    userId: user.sub,
    workspaceId,
    permission: "workspace:task:write",
    token,
  });

  if (!isAllowed) {
    throw new Error("Forbidden: You do not have workspace:task:write permission");
  }

  const body = c.req.valid("json");
  const { title, description, status, priority, assigneeId, dueDate } = body;

  // Convert dueDate string to Date object if provided
  const dueDateObj = dueDate ? new Date(dueDate) : null;

  const [newTask] = await db
    .insert(tasks)
    .values({
      workspaceId,
      title,
      description: description || null,
      status: status || "todo",
      priority: priority || "medium",
      assigneeId: assigneeId || null,
      dueDate: dueDateObj,
      createdBy: user.sub,
    })
    .returning();

  if (!newTask) {
    throw new Error("Failed to create task");
  }

  // Convert Date objects to ISO strings and validate with Zod schema
  const transformed = {
    id: newTask.id,
    workspaceId: newTask.workspaceId,
    title: newTask.title,
    description: newTask.description,
    status: newTask.status,
    priority: newTask.priority,
    assigneeId: newTask.assigneeId,
    dueDate: newTask.dueDate ? newTask.dueDate.toISOString() : null,
    createdAt: newTask.createdAt ? newTask.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: newTask.updatedAt ? newTask.updatedAt.toISOString() : new Date().toISOString(),
    createdBy: newTask.createdBy,
  };
  const transformedTask = TaskSchema.parse(transformed);

  return c.json({ task: transformedTask } satisfies z.infer<typeof TaskResponseSchema>, 201);
});

// Update task
const updateTaskRoute = createRoute({
  method: "put",
  path: "/{id}",
  request: {
    params: TaskIdParamSchema,
    headers: WorkspaceIdHeaderSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateTaskRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: TaskResponseSchema,
        },
      },
      description: "Task updated successfully",
    },
  },
  tags: ["Tasks"],
  summary: "Update task",
  description: "Update the specified task",
});

app.openapi(updateTaskRoute, async (c) => {
  const user = c.get("user");
  const workspaceId = c.req.valid("header")["X-Workspace-ID"];
  const { id: taskId } = c.req.valid("param");
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  // Authorization check: 'workspace:task:write'
  const isAllowed = await checkPermission({
    userId: user.sub,
    workspaceId,
    permission: "workspace:task:write",
    token,
  });

  if (!isAllowed) {
    throw new Error("Forbidden: You do not have workspace:task:write permission");
  }

  const body = c.req.valid("json");
  const updateData: {
    title?: string;
    description?: string | null;
    status?: string;
    priority?: string;
    assigneeId?: string | null;
    dueDate?: Date | null;
  } = {};

  if (body.title !== undefined) updateData.title = body.title;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.priority !== undefined) updateData.priority = body.priority;
  if (body.assigneeId !== undefined) updateData.assigneeId = body.assigneeId;
  if (body.dueDate !== undefined) {
    updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  }

  const [updatedTask] = await db
    .update(tasks)
    .set({
      ...updateData,
      updatedAt: new Date(),
    })
    .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)))
    .returning();

  if (!updatedTask) {
    throw new Error("Task not found");
  }

  // Convert Date objects to ISO strings and validate with Zod schema
  const transformed = {
    id: updatedTask.id,
    workspaceId: updatedTask.workspaceId,
    title: updatedTask.title,
    description: updatedTask.description,
    status: updatedTask.status,
    priority: updatedTask.priority,
    assigneeId: updatedTask.assigneeId,
    dueDate: updatedTask.dueDate ? updatedTask.dueDate.toISOString() : null,
    createdAt: updatedTask.createdAt
      ? updatedTask.createdAt.toISOString()
      : new Date().toISOString(),
    updatedAt: updatedTask.updatedAt
      ? updatedTask.updatedAt.toISOString()
      : new Date().toISOString(),
    createdBy: updatedTask.createdBy,
  };
  const transformedTask = TaskSchema.parse(transformed);

  return c.json({ task: transformedTask } satisfies z.infer<typeof TaskResponseSchema>);
});

// Delete task
const deleteTaskRoute = createRoute({
  method: "delete",
  path: "/{id}",
  request: {
    params: TaskIdParamSchema,
    headers: WorkspaceIdHeaderSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: TaskResponseSchema,
        },
      },
      description: "Task deleted successfully",
    },
  },
  tags: ["Tasks"],
  summary: "Delete task",
  description: "Delete the specified task",
});

app.openapi(deleteTaskRoute, async (c) => {
  const user = c.get("user");
  const workspaceId = c.req.valid("header")["X-Workspace-ID"];
  const { id: taskId } = c.req.valid("param");
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  // Authorization check: 'workspace:task:delete'
  const isAllowed = await checkPermission({
    userId: user.sub,
    workspaceId,
    permission: "workspace:task:delete",
    token,
  });

  if (!isAllowed) {
    throw new Error("Forbidden: You do not have workspace:task:delete permission");
  }

  const [deletedTask] = await db
    .delete(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)))
    .returning();

  if (!deletedTask) {
    throw new Error("Task not found");
  }

  // Convert Date objects to ISO strings and type conversion to match schema
  const transformed = {
    id: deletedTask.id,
    workspaceId: deletedTask.workspaceId,
    title: deletedTask.title,
    description: deletedTask.description,
    status: deletedTask.status as "todo" | "in_progress" | "done",
    priority: deletedTask.priority as "low" | "medium" | "high",
    assigneeId: deletedTask.assigneeId,
    dueDate: deletedTask.dueDate ? deletedTask.dueDate.toISOString() : null,
    createdAt: deletedTask.createdAt
      ? deletedTask.createdAt.toISOString()
      : new Date().toISOString(),
    updatedAt: deletedTask.updatedAt
      ? deletedTask.updatedAt.toISOString()
      : new Date().toISOString(),
    createdBy: deletedTask.createdBy,
  };
  const transformedTask = TaskSchema.parse(transformed) as z.infer<typeof TaskSchema>;

  return c.json({ task: transformedTask } satisfies z.infer<typeof TaskResponseSchema>);
});

// Update status
const updateTaskStatusRoute = createRoute({
  method: "patch",
  path: "/{id}/status",
  request: {
    params: TaskIdParamSchema,
    headers: WorkspaceIdHeaderSchema,
    body: {
      content: {
        "application/json": {
          schema: z.object({
            status: z.enum(["todo", "in_progress", "done"]).openapi({ example: "in_progress" }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: TaskResponseSchema,
        },
      },
      description: "Status updated successfully",
    },
  },
  tags: ["Tasks"],
  summary: "Update task status",
  description: "Update the status of the specified task",
});

app.openapi(updateTaskStatusRoute, async (c) => {
  const user = c.get("user");
  const workspaceId = c.req.valid("header")["X-Workspace-ID"];
  const { id: taskId } = c.req.valid("param");
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  // Authorization check
  const isAllowed = await checkPermission({
    userId: user.sub,
    workspaceId,
    permission: "workspace:task:write",
    token,
  });

  if (!isAllowed) {
    throw new Error("Forbidden");
  }

  const { status } = c.req.valid("json");

  const [updatedTask] = await db
    .update(tasks)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)))
    .returning();

  if (!updatedTask) {
    throw new Error("Task not found");
  }

  // Convert Date objects to ISO strings and validate with Zod schema
  const transformed = {
    id: updatedTask.id,
    workspaceId: updatedTask.workspaceId,
    title: updatedTask.title,
    description: updatedTask.description,
    status: updatedTask.status,
    priority: updatedTask.priority,
    assigneeId: updatedTask.assigneeId,
    dueDate: updatedTask.dueDate ? updatedTask.dueDate.toISOString() : null,
    createdAt: updatedTask.createdAt
      ? updatedTask.createdAt.toISOString()
      : new Date().toISOString(),
    updatedAt: updatedTask.updatedAt
      ? updatedTask.updatedAt.toISOString()
      : new Date().toISOString(),
    createdBy: updatedTask.createdBy,
  };
  const transformedTask = TaskSchema.parse(transformed);

  return c.json({ task: transformedTask } satisfies z.infer<typeof TaskResponseSchema>);
});

// Update assignment
const updateTaskAssignRoute = createRoute({
  method: "patch",
  path: "/{id}/assign",
  request: {
    params: TaskIdParamSchema,
    headers: WorkspaceIdHeaderSchema,
    body: {
      content: {
        "application/json": {
          schema: z.object({
            assigneeId: z.string().nullable().openapi({ example: "user123" }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: TaskResponseSchema,
        },
      },
      description: "Assignment updated successfully",
    },
  },
  tags: ["Tasks"],
  summary: "Update task assignment",
  description: "Update the assignee of the specified task",
});

app.openapi(updateTaskAssignRoute, async (c) => {
  const user = c.get("user");
  const workspaceId = c.req.valid("header")["X-Workspace-ID"];
  const { id: taskId } = c.req.valid("param");
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  // Authorization check: 'workspace:task:assign'
  const isAllowed = await checkPermission({
    userId: user.sub,
    workspaceId,
    permission: "workspace:task:assign",
    token,
  });

  if (!isAllowed) {
    throw new Error("Forbidden");
  }

  const { assigneeId } = c.req.valid("json");

  const [updatedTask] = await db
    .update(tasks)
    .set({
      assigneeId: assigneeId || null,
      updatedAt: new Date(),
    })
    .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)))
    .returning();

  if (!updatedTask) {
    throw new Error("Task not found");
  }

  // Convert Date objects to ISO strings and validate with Zod schema
  const transformed = {
    id: updatedTask.id,
    workspaceId: updatedTask.workspaceId,
    title: updatedTask.title,
    description: updatedTask.description,
    status: updatedTask.status,
    priority: updatedTask.priority,
    assigneeId: updatedTask.assigneeId,
    dueDate: updatedTask.dueDate ? updatedTask.dueDate.toISOString() : null,
    createdAt: updatedTask.createdAt
      ? updatedTask.createdAt.toISOString()
      : new Date().toISOString(),
    updatedAt: updatedTask.updatedAt
      ? updatedTask.updatedAt.toISOString()
      : new Date().toISOString(),
    createdBy: updatedTask.createdBy,
  };
  const transformedTask = TaskSchema.parse(transformed);

  return c.json({ task: transformedTask } satisfies z.infer<typeof TaskResponseSchema>);
});

export default app;
