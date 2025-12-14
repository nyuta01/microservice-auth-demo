/**
 * Dashboard and statistics route
 */
import { checkPermission } from "@repo/api-clients";
import type { JwtUser } from "@repo/api-middleware";
import type { Task, TasksResponse } from "@repo/types";
import { Hono } from "hono";

type Env = {
  Variables: {
    user: JwtUser;
    userId: string;
  };
};

// Environment variables
const TASK_API_URL = process.env.SERVICE_URL_TASK_API || "http://localhost:10100";

// Helper function: Call Task API
async function callTaskApi<T = unknown>(
  endpoint: string,
  token: string,
  workspaceId: string,
  method: string = "GET",
  body?: unknown
): Promise<T> {
  const url = `${TASK_API_URL}${endpoint}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Workspace-ID": workspaceId,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new Error(`Task API error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

const dashboard = new Hono<Env>();

/**
 * Get dashboard data
 */
dashboard.get("/", async (c) => {
  const user = c.get("user");
  const workspaceId = c.req.header("X-Workspace-ID");
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  if (!workspaceId) {
    throw new Error("X-Workspace-ID header is required");
  }

  // Permission check: workspace:owner or workspace:task:read
  const isAllowed = await checkPermission({
    userId: user.sub,
    workspaceId,
    permission: "workspace:task:read",
    token,
  });

  if (!isAllowed) {
    throw new Error("Forbidden");
  }

  // Get data from each resource API
  const [tasksData] = await Promise.all([
    callTaskApi<TasksResponse>("/api/tasks", token || "", workspaceId).catch(
      () => ({ tasks: [] }) as TasksResponse
    ),
  ]);

  // Calculate statistics
  const tasks = tasksData.tasks || [];
  const stats = {
    tasks: {
      total: tasks.length,
      todo: tasks.filter((t: Task) => t.status === "todo").length,
      inProgress: tasks.filter((t: Task) => t.status === "in_progress").length,
      done: tasks.filter((t: Task) => t.status === "done").length,
    },
  };

  return c.json({
    stats,
    recentTasks: tasks.slice(0, 10),
  });
});

/**
 * Get statistics
 */
dashboard.get("/stats", async (c) => {
  const user = c.get("user");
  const workspaceId = c.req.header("X-Workspace-ID");
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  if (!workspaceId) {
    throw new Error("X-Workspace-ID header is required");
  }

  // Permission check
  const isAllowed = await checkPermission({
    userId: user.sub,
    workspaceId,
    permission: "workspace:task:read",
    token,
  });

  if (!isAllowed) {
    throw new Error("Forbidden");
  }

  // Get data from each resource API
  const [tasksData] = await Promise.all([
    callTaskApi<TasksResponse>("/api/tasks", token || "", workspaceId).catch(
      () => ({ tasks: [] }) as TasksResponse
    ),
  ]);

  // Calculate statistics
  const tasks = tasksData.tasks || [];
  const stats = {
    tasks: {
      total: tasks.length,
      byStatus: {
        todo: tasks.filter((t: Task) => t.status === "todo").length,
        inProgress: tasks.filter((t: Task) => t.status === "in_progress").length,
        done: tasks.filter((t: Task) => t.status === "done").length,
      },
      byPriority: {
        low: tasks.filter((t: Task) => t.priority === "low").length,
        medium: tasks.filter((t: Task) => t.priority === "medium").length,
        high: tasks.filter((t: Task) => t.priority === "high").length,
      },
    },
  };

  return c.json({ stats });
});

/**
 * Integrated resource search
 */
dashboard.get("/search", async (c) => {
  const user = c.get("user");
  const workspaceId = c.req.header("X-Workspace-ID");
  const query = c.req.query("q");
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  if (!user?.sub) {
    throw new Error("Unauthorized");
  }

  if (!workspaceId) {
    throw new Error("X-Workspace-ID header is required");
  }

  if (!query) {
    throw new Error('Query parameter "q" is required');
  }

  // Permission check
  const isAllowed = await checkPermission({
    userId: user.sub,
    workspaceId,
    permission: "workspace:task:read",
    token,
  });

  if (!isAllowed) {
    throw new Error("Forbidden");
  }

  // Search from each resource API (currently Task API only)
  const [tasksData] = await Promise.all([
    callTaskApi<TasksResponse>("/api/tasks", token || "", workspaceId).catch(
      () => ({ tasks: [] }) as TasksResponse
    ),
  ]);

  // Filter by query
  const tasks = tasksData.tasks || [];
  const queryLower = query.toLowerCase();
  const filteredTasks = tasks.filter(
    (task: Task) =>
      task.title?.toLowerCase().includes(queryLower) ||
      task.description?.toLowerCase().includes(queryLower)
  );

  return c.json({
    tasks: filteredTasks,
    total: filteredTasks.length,
  });
});

export { dashboard };
