"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { authClient, PageHeader, useWorkspace } from "@repo/web-lib";
import { Alert, AlertDescription } from "@repo/ui/alert";
import { Button } from "@repo/ui/button";
import { Card, CardContent } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import { Textarea } from "@repo/ui/textarea";

export default function NewTaskPage() {
  const router = useRouter();
  const params = useParams();
  const { currentWorkspaceId } = useWorkspace();
  const workspaceId = (params.workspaceId as string) || currentWorkspaceId;
  const orgId = params.orgId as string;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"todo" | "in_progress" | "done">("todo");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!workspaceId) {
      setError("Workspace is not selected");
      setLoading(false);
      return;
    }

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
      const res = await fetch(`${taskApiUrl}/api/tasks`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "X-Workspace-ID": workspaceId,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title,
          description: description || null,
          status,
          priority,
          dueDate: dueDate || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.error || "Failed to create task");
        setLoading(false);
        return;
      }

      const data = await res.json();
      router.push(`/org/${orgId}/workspace/${workspaceId}/tasks/${data.task.id}`);
    } catch (err) {
      console.error("Failed to create task:", err);
      setError("An error occurred while creating task");
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Create New Task"
        backLink={
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href={`/org/${orgId}/workspace/${workspaceId}`}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
        }
      />

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Task description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={loading}>
                {loading ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
