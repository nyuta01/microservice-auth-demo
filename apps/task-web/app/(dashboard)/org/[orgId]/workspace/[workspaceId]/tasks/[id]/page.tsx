"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, Calendar, Clock } from "lucide-react";
import { authClient, LoadingPage, PageHeader } from "@repo/web-lib";
import { Alert, AlertDescription } from "@repo/ui/alert";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Label } from "@repo/ui/label";

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

const getStatusBadge = (status: string) => {
  switch (status) {
    case "todo":
      return <Badge variant="secondary">Not Started</Badge>;
    case "in_progress":
      return <Badge variant="info">In Progress</Badge>;
    case "done":
      return <Badge variant="success">Completed</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case "low":
      return <Badge variant="success">Low</Badge>;
    case "medium":
      return <Badge variant="warning">Medium</Badge>;
    case "high":
      return <Badge variant="destructive">High</Badge>;
    default:
      return <Badge variant="secondary">{priority}</Badge>;
  }
};

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = params.id as string;
  const workspaceId = params.workspaceId as string;
  const orgId = params.orgId as string;

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTask = async () => {
      if (!workspaceId) return;

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

        const taskApiUrl = process.env.NEXT_PUBLIC_TASK_API_URL || "http://localhost:10100";
        const res = await fetch(`${taskApiUrl}/api/tasks/${taskId}`, {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
            "X-Workspace-ID": workspaceId,
          },
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          setError("Failed to fetch task");
          setLoading(false);
          return;
        }

        const data = await res.json();
        setTask(data.task);
      } catch (err) {
        console.error("Failed to fetch task:", err);
        setError("An error occurred while fetching task");
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [taskId, workspaceId]);

  if (loading) {
    return <LoadingPage />;
  }

  if (error || !task) {
    return (
      <div>
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error || "Task not found"}</AlertDescription>
        </Alert>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/org/${orgId}/workspace/${workspaceId}`}>Back to Task List</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={task.title}
        backLink={
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href={`/org/${orgId}/workspace/${workspaceId}`}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Task Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Description</Label>
            <p className="text-sm">{task.description || "No description"}</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">Status</Label>
              <div>{getStatusBadge(task.status)}</div>
            </div>

            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">Priority</Label>
              <div>{getPriorityBadge(task.priority)}</div>
            </div>

            {task.dueDate && (
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Due Date</Label>
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="h-3 w-3" />
                  {new Date(task.dueDate).toLocaleDateString("en-US")}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Created: {new Date(task.createdAt).toLocaleString("en-US")}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Updated: {new Date(task.updatedAt).toLocaleString("en-US")}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
