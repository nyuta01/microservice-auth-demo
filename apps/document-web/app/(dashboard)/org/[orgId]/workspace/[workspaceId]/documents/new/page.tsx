"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { authClient, PageHeader } from "@repo/web-lib";
import { Alert, AlertDescription } from "@repo/ui/alert";
import { Button } from "@repo/ui/button";
import { Card, CardContent } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Textarea } from "@repo/ui/textarea";

export default function NewDocumentPage() {
  const router = useRouter();
  const params = useParams();
  const orgId = params.orgId as string;
  const workspaceId = params.workspaceId as string;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setLoading(true);
    setError("");

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

      const documentApiUrl = process.env.NEXT_PUBLIC_DOCUMENT_API_URL || "http://localhost:10101";
      const res = await fetch(`${documentApiUrl}/api/documents`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "X-Workspace-ID": workspaceId,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim() || null,
          category: category.trim() || null,
          tags: tags.trim() || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        setError(errorData.error || "Failed to create document");
        setLoading(false);
        return;
      }

      const data = await res.json();
      router.push(`/org/${orgId}/workspace/${workspaceId}/documents/${data.document.id}`);
      router.refresh();
    } catch (err) {
      console.error("Failed to create document:", err);
      setError("An error occurred while creating document");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Create New Document"
        description="Create a new document"
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
                placeholder="e.g. Project Plan"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter document content"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. report, memo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. important, Project A"
                />
              </div>
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
