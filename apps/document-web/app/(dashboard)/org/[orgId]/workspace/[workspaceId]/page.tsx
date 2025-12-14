import DocumentList from "@/components/DocumentList";

interface PageProps {
  params: Promise<{
    orgId: string;
    workspaceId: string;
  }>;
}

export default async function WorkspaceDocumentsPage({ params }: PageProps) {
  const { orgId, workspaceId } = await params;

  return (
    <div key={`${orgId}-${workspaceId}`}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
        <p className="mt-2 text-gray-600">Manage documents within the workspace</p>
      </div>
      <DocumentList workspaceId={workspaceId} />
    </div>
  );
}
