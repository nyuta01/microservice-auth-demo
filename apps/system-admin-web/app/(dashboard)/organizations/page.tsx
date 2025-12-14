"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Building2, Calendar, Hash } from "lucide-react";
import { callSystemAdminApi } from "@/lib/api-client";
import { authClient, EmptyState, LoadingPage, PageHeader } from "@repo/web-lib";
import { Alert, AlertDescription } from "@repo/ui/alert";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/table";

interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
}

interface OrganizationsResponse {
  organizations: Organization[];
}

export default function OrganizationsPage() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const session = await authClient.getSession();
        if (!session?.data?.user) {
          router.push("/login");
          return;
        }

        const data = await callSystemAdminApi<OrganizationsResponse>(
          "/api/system-admin/organizations"
        );
        setOrganizations(data.organizations || []);
      } catch (err) {
        console.error("Failed to fetch organizations:", err);
        if (err instanceof Error && err.message.includes("Forbidden")) {
          setError("System administrator privileges required");
        } else {
          setError(err instanceof Error ? err.message : "Failed to fetch organization list");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, [router]);

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim() || !newOrgSlug.trim()) {
      setError("Please enter organization name and slug");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      await callSystemAdminApi("/api/system-admin/organizations", {
        method: "POST",
        body: {
          name: newOrgName.trim(),
          slug: newOrgSlug.trim(),
        },
      });

      // Refresh the list
      const data = await callSystemAdminApi<OrganizationsResponse>(
        "/api/system-admin/organizations"
      );
      setOrganizations(data.organizations || []);
      setShowCreateForm(false);
      setNewOrgName("");
      setNewOrgSlug("");
    } catch (err) {
      console.error("Failed to create organization:", err);
      setError(err instanceof Error ? err.message : "Failed to create organization");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <div>
      <PageHeader
        title="Organization Management"
        description="Manage all organizations in the system"
        action={
          <Button
            size="sm"
            variant={showCreateForm ? "outline" : "default"}
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? "Cancel" : "New"}
          </Button>
        }
      />

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>
              Close
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {showCreateForm && (
        <Card className="mb-4">
          <CardContent className="pt-4">
            <form onSubmit={handleCreateOrganization} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">
                  Organization Name <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="org-name"
                    type="text"
                    required
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    className="pl-9"
                    placeholder="e.g., Acme Corporation"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-slug">
                  Slug <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="org-slug"
                    type="text"
                    required
                    value={newOrgSlug}
                    onChange={(e) => setNewOrgSlug(e.target.value)}
                    className="pl-9"
                    placeholder="e.g., acme-corp"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewOrgName("");
                    setNewOrgSlug("");
                    setError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={creating}>
                  {creating ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Organization List</CardTitle>
        </CardHeader>
        <CardContent>
          {organizations.length === 0 ? (
            <EmptyState
              title="No organizations"
              description="Create a new organization to get started"
              action={
                <Button size="sm" onClick={() => setShowCreateForm(true)}>
                  New
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Organization Name
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Slug
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Created Date
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/organizations/${org.id}`}
                        className="text-primary hover:underline"
                      >
                        {org.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {org.slug}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(org.createdAt).toLocaleDateString("en-US")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
