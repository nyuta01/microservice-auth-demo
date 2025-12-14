"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useOrganization } from "@/lib/organization-context";

export default function HomePage() {
  const router = useRouter();
  const { organizations, loading } = useOrganization();

  useEffect(() => {
    if (!loading && organizations.length > 0) {
      const firstOrg = organizations[0];
      if (firstOrg) {
        router.push(`/org/${firstOrg.organizationId}`);
      }
    }
  }, [organizations, loading, router]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="text-center py-8">
      <p className="text-sm text-muted-foreground">Redirecting...</p>
    </div>
  );
}
