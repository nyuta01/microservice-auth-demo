"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { callSystemAdminApi } from "@/lib/api-client";
import { authClient, PageHeader } from "@repo/web-lib";
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

export default function CreateUserPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "admin" | "">("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Name, email, and password are required");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const session = await authClient.getSession();
      if (!session?.data?.user) {
        router.push("/login");
        return;
      }

      await callSystemAdminApi("/api/system-admin/users", {
        method: "POST",
        body: {
          name: name.trim(),
          email: email.trim(),
          password,
          role: role || null,
        },
      });

      router.push("/users");
    } catch (err) {
      console.error("Failed to create user:", err);
      if (err instanceof Error && err.message.includes("Forbidden")) {
        setError("System administrator privileges required");
      } else {
        setError(err instanceof Error ? err.message : "Failed to create user");
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Create User"
        description="Create a new user"
        backLink={
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/users">
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as "user" | "admin" | "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Default (user)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={creating}>
                {creating ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
