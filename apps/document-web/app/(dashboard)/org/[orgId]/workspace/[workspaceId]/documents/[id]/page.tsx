"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, Clock, Pencil, Tag, Trash2, FolderOpen } from "lucide-react";
import { authClient, LoadingPage, PageHeader } from "@repo/web-lib";
import { Alert, AlertDescription } from "@repo/ui/alert";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Textarea } from "@repo/ui/textarea";

interface Document {
  id: string;
  title: string;
  content: string | null;
  category: string | null;
  tags: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function DocumentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orgId = params.orgId as string;
  const workspaceId = params.workspaceId as string;
  const documentId = params.id as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchDocument = async () => {
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
        const res = await fetch(`${documentApiUrl}/api/documents/${documentId}`, {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
            "X-Workspace-ID": workspaceId,
          },
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          setError("Failed to fetch document");
          setLoading(false);
          return;
        }

        const data = await res.json();
        setDocument(data.document);
        setTitle(data.document.title);
        setContent(data.document.content || "");
        setCategory(data.document.category || "");
        setTags(data.document.tags || "");
      } catch (err) {
        console.error("Failed to fetch document:", err);
        setError("An error occurred while fetching document");
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [documentId, workspaceId]);

  const handleUpdate = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const session = await authClient.getSession();
      if (!session?.data?.user) {
        setError("Login required");
        setSaving(false);
        return;
      }

      const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:10000";
      const tokenRes = await fetch(`${authUrl}/api/auth/token`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!tokenRes.ok) {
        setError("Authentication failed");
        setSaving(false);
        return;
      }

      const tokenData = await tokenRes.json();
      const sessionToken = tokenData.token;

      const documentApiUrl = process.env.NEXT_PUBLIC_DOCUMENT_API_URL || "http://localhost:10101";
      const res = await fetch(`${documentApiUrl}/api/documents/${documentId}`, {
        method: "PUT",
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
        setError(errorData.error || "Failed to update document");
        setSaving(false);
        return;
      }

      const data = await res.json();
      setDocument(data.document);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update document:", err);
      setError("An error occurred while updating document");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      const session = await authClient.getSession();
      if (!session?.data?.user) {
        setError("Login required");
        return;
      }

      const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:10000";
      const tokenRes = await fetch(`${authUrl}/api/auth/token`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!tokenRes.ok) {
        setError("Authentication failed");
        return;
      }

      const tokenData = await tokenRes.json();
      const sessionToken = tokenData.token;

      const documentApiUrl = process.env.NEXT_PUBLIC_DOCUMENT_API_URL || "http://localhost:10101";
      const res = await fetch(`${documentApiUrl}/api/documents/${documentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "X-Workspace-ID": workspaceId,
        },
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        setError(errorData.error || "Failed to delete document");
        return;
      }

      router.push(`/org/${orgId}/workspace/${workspaceId}`);
      router.refresh();
    } catch (err) {
      console.error("Failed to delete document:", err);
      setError("An error occurred while deleting document");
    }
  };

  if (loading) {
    return <LoadingPage />;
  }

  if (error && !document) {
    return (
      <div>
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/org/${orgId}/workspace/${workspaceId}`}>Back</Link>
        </Button>
      </div>
    );
  }

  if (!document) {
    return (
      <div>
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>Document not found</AlertDescription>
        </Alert>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/org/${orgId}/workspace/${workspaceId}`}>Back</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEditing ? "Edit Document" : document.title}
        backLink={
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href={`/org/${orgId}/workspace/${workspaceId}`}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
        }
        action={
          !isEditing && (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button size="sm" variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          )
        }
      />

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isEditing ? (
        <Card>
          <CardContent className="pt-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdate();
              }}
              className="space-y-4"
            >
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setTitle(document.title);
                    setContent(document.content || "");
                    setCategory(document.category || "");
                    setTags(document.tags || "");
                    setError("");
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Document Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {document.category && (
                <Badge variant="info" className="gap-1">
                  <FolderOpen className="h-3 w-3" />
                  {document.category}
                </Badge>
              )}
              {document.tags && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Tag className="h-3 w-3" />
                  {document.tags.split(",").join(", ")}
                </div>
              )}
            </div>

            {document.content && (
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm">{document.content}</pre>
              </div>
            )}

            <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Created: {new Date(document.createdAt).toLocaleString("en-US")}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Updated: {new Date(document.updatedAt).toLocaleString("en-US")}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
