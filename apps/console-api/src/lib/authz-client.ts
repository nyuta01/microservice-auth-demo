/**
 * AuthZ API client
 */

const AUTHZ_URL = process.env.SERVICE_URL_AUTHZ || "http://localhost:10001";

function getInternalSecret(): string {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) {
    throw new Error("INTERNAL_API_SECRET environment variable is required");
  }
  return secret;
}

interface CallOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

export async function callAuthZApi<T = unknown>(
  endpoint: string,
  options: CallOptions = {}
): Promise<T> {
  const { method = "GET", body, token } = options;
  const url = `${AUTHZ_URL}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Internal-Secret": getInternalSecret(),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error");
    throw new Error(`AuthZ API error: ${res.status} - ${errorText}`);
  }

  return res.json() as Promise<T>;
}
