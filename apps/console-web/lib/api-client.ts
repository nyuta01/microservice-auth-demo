/**
 * Console API Client
 * Helper function to send requests to Console API
 */

const CONSOLE_API_URL = process.env.NEXT_PUBLIC_CONSOLE_API_URL || "http://localhost:10200";

interface ApiOptions {
  orgId?: string;
  workspaceId?: string;
  method?: string;
  body?: unknown;
}

async function getAuthToken(): Promise<string> {
  const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:10000";
  const tokenRes = await fetch(`${authUrl}/api/auth/token`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!tokenRes.ok) {
    throw new Error("Authentication failed");
  }

  const tokenData = await tokenRes.json();
  return tokenData.token;
}

export async function callConsoleApi<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { orgId, workspaceId, method = "GET", body } = options;

  const token = await getAuthToken();

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  if (orgId) {
    headers["X-Organization-ID"] = orgId;
  }
  if (workspaceId) {
    headers["X-Workspace-ID"] = workspaceId;
  }

  const res = await fetch(`${CONSOLE_API_URL}${endpoint}`, {
    method,
    headers,
    credentials: "include",
    cache: "no-store",
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || `API error: ${res.status}`);
  }

  return res.json();
}
