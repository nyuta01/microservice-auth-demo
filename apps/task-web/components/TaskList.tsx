"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Calendar, Circle, CircleCheck, CircleDot, ArrowUp, ArrowRight, ArrowDown } from "lucide-react";
import { authClient, LoadingPage, EmptyState } from "@repo/web-lib";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Alert, AlertDescription } from "@repo/ui/alert";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  assigneeId: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TaskListProps {
  workspaceId: string;
}

export default function TaskList({ workspaceId }: TaskListProps) {
  const params = useParams();
  const pathname = usePathname();
  const orgId = params.orgId as string;
  const actualWorkspaceId = (params.workspaceId as string) || workspaceId;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!actualWorkspaceId) {
        setError("Workspace ID is not specified");
        setLoading(false);
        return;
      }

      // Reset state when workspaceId changes
      setLoading(true);
      setError(null);
      setTasks([]);

      try {
        const session = await authClient.getSession();
        if (!session?.data?.user) {
          setError("Login required");
          setLoading(false);
          return;
        }

        const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:10000";
        const tokenRes = await fetch(`${authUrl}/api/auth/token`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!tokenRes.ok) {
          setError("Authentication failed");
          setLoading(false);
          return;
        }

        const tokenData = await tokenRes.json();
        const sessionToken = tokenData.token;

        console.log("[TaskList] Fetching tasks with:", {
          workspaceId: actualWorkspaceId,
          userId: session?.data?.user?.id,
        });

        const taskApiUrl = process.env.NEXT_PUBLIC_TASK_API_URL || "http://localhost:10100";
        const res = await fetch(`${taskApiUrl}/api/tasks`, {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
            "X-Workspace-ID": actualWorkspaceId,
          },
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          setError("Failed to fetch tasks");
          setLoading(false);
          return;
        }

        const data = await res.json();
        setTasks(data.tasks || []);
      } catch (err) {
        console.error("Failed to fetch tasks:", err);
        setError("An error occurred while fetching tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [actualWorkspaceId, params.workspaceId, pathname]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "todo":
        return (
          <Badge variant="secondary" className="gap-1">
            <Circle className="h-3 w-3" />
            Not Started
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="info" className="gap-1">
            <CircleDot className="h-3 w-3" />
            In Progress
          </Badge>
        );
      case "done":
        return (
          <Badge variant="success" className="gap-1">
            <CircleCheck className="h-3 w-3" />
            Completed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "low":
        return (
          <Badge variant="outline" className="gap-1 text-green-600 border-green-200">
            <ArrowDown className="h-3 w-3" />
            Low
          </Badge>
        );
      case "medium":
        return (
          <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-200">
            <ArrowRight className="h-3 w-3" />
            Medium
          </Badge>
        );
      case "high":
        return (
          <Badge variant="outline" className="gap-1 text-red-600 border-red-200">
            <ArrowUp className="h-3 w-3" />
            High
          </Badge>
        );
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  if (loading) {
    return <LoadingPage />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {orgId && actualWorkspaceId && (
        <div>
          <Button asChild>
            <Link href={`/org/${orgId}/workspace/${actualWorkspaceId}/tasks/new`}>
              Create New Task
            </Link>
          </Button>
        </div>
      )}

      {tasks.length === 0 ? (
        <EmptyState
          title="No tasks found"
          description="Create a new task to get started"
          action={
            orgId && actualWorkspaceId ? (
              <Button asChild>
                <Link href={`/org/${orgId}/workspace/${actualWorkspaceId}/tasks/new`}>
                  Create New Task
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-3">
          {tasks.map((task) => (
            <Link
              key={task.id}
              href={
                orgId && actualWorkspaceId
                  ? `/org/${orgId}/workspace/${actualWorkspaceId}/tasks/${task.id}`
                  : "#"
              }
            >
              <Card className="transition-all hover:shadow-md hover:border-primary/20">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-base font-medium leading-tight">
                      {task.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 shrink-0">
                      {getStatusBadge(task.status)}
                      {getPriorityBadge(task.priority)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {task.description && (
                    <CardDescription className="line-clamp-2 mb-2">
                      {task.description}
                    </CardDescription>
                  )}
                  {task.dueDate && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Due: {new Date(task.dueDate).toLocaleDateString("en-US")}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
