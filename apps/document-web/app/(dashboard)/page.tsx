"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useWorkspace } from "@repo/web-lib";

export default function HomePage() {
  const router = useRouter();
  const { workspaces, organizations, loading } = useWorkspace();
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    // Do nothing while loading
    if (loading) return;

    // Auto-redirect if there's only one workspace
    if (workspaces.length === 1) {
      const firstWorkspace = workspaces[0];
      if (firstWorkspace) {
        router.push(`/org/${firstWorkspace.organizationId}/workspace/${firstWorkspace.workspaceId}`);
        return;
      }
    }

    // Show selector screen if there are multiple workspaces or none
    setShowSelector(true);
  }, [loading, workspaces, router]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!showSelector) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Redirecting...</p>
      </div>
    );
  }

  // No workspaces available
  if (workspaces.length === 0) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded p-6 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">No workspaces available</h1>
          <p className="text-gray-600">
            You don't have access to any workspaces.
            <br />
            Please contact your organization administrator to request an invitation to a workspace.
          </p>
        </div>
      </div>
    );
  }

  // Workspace selection screen
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Select Workspace</h1>

      <div className="space-y-4">
        {organizations.map((org) => (
          <div key={org.organizationId} className="bg-white border border-gray-200 rounded">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h2 className="font-semibold text-gray-900">{org.organizationName}</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {org.workspaces?.map((ws) => (
                <Link
                  key={ws.workspaceId}
                  href={`/org/${org.organizationId}/workspace/${ws.workspaceId}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{ws.workspaceName}</p>
                      <p className="text-sm text-gray-500">{ws.roleName}</p>
                    </div>
                    <span className="text-blue-600">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
