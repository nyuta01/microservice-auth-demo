import { cookies } from "next/headers";

export async function getWorkspaceId(): Promise<string> {
  const cookieStore = await cookies();
  const workspaceId = cookieStore.get("workspace_id")?.value;

  return (
    workspaceId ||
    process.env.NEXT_PUBLIC_DEMO_WORKSPACE_ID ||
    process.env.DEMO_WORKSPACE_ID ||
    "00000000-0000-0000-0000-000000000002"
  );
}
