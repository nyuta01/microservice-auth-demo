"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FileText, Tag, Clock, FolderOpen } from "lucide-react";
import { authClient, LoadingPage, EmptyState } from "@repo/web-lib";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Alert, AlertDescription } from "@repo/ui/alert";

interface Document {
  id: string;
  title: string;
  content: string | null;
  category: string | null;
  tags: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DocumentListProps {
  workspaceId: string;
}

export default function DocumentList({ workspaceId }: DocumentListProps) {
  const params = useParams();
  const pathname = usePathname();
  const orgId = params.orgId as string;
  const actualWorkspaceId = (params.workspaceId as string) || workspaceId;

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!actualWorkspaceId) {
        setError("Workspace ID is not specified");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setDocuments([]);

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
          headers: {
            Authorization: `Bearer ${sessionToken}`,
            "X-Workspace-ID": actualWorkspaceId,
          },
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          setError("Failed to fetch documents");
          setLoading(false);
          return;
        }

        const data = await res.json();
        setDocuments(data.documents || []);
      } catch (err) {
        console.error("Failed to fetch documents:", err);
        setError("An error occurred while fetching documents");
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [actualWorkspaceId, params.workspaceId, pathname]);

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
            <Link href={`/org/${orgId}/workspace/${actualWorkspaceId}/documents/new`}>
              Create New Document
            </Link>
          </Button>
        </div>
      )}

      {documents.length === 0 ? (
        <EmptyState
          title="No documents"
          description="Create a new document to get started"
          action={
            orgId && actualWorkspaceId ? (
              <Button asChild>
                <Link href={`/org/${orgId}/workspace/${actualWorkspaceId}/documents/new`}>
                  Create New Document
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-3">
          {documents.map((document) => (
            <Link
              key={document.id}
              href={
                orgId && actualWorkspaceId
                  ? `/org/${orgId}/workspace/${actualWorkspaceId}/documents/${document.id}`
                  : "#"
              }
            >
              <Card className="transition-all hover:shadow-md hover:border-primary/20">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-base font-medium leading-tight">
                        {document.title}
                      </CardTitle>
                    </div>
                    {document.category && (
                      <Badge variant="info" className="gap-1">
                        <FolderOpen className="h-3 w-3" />
                        {document.category}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {document.content && (
                    <CardDescription className="line-clamp-2 mb-3">
                      {document.content}
                    </CardDescription>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {document.tags && (
                      <div className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        <span>{document.tags.split(",").join(", ")}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        Updated: {new Date(document.updatedAt).toLocaleDateString("en-US")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
