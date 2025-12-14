import TaskList from "@/components/TaskList";

interface PageProps {
  params: Promise<{
    orgId: string;
    workspaceId: string;
  }>;
}

export default async function WorkspaceTasksPage({ params }: PageProps) {
  const { orgId, workspaceId } = await params;

  return (
    <div key={`${orgId}-${workspaceId}`} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Task List</h1>
        <p className="text-muted-foreground">Manage tasks in your workspace</p>
      </div>
      <TaskList workspaceId={workspaceId} />
    </div>
  );
}
