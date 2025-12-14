/**
 * AuthZ API client
 */

const AUTHZ_URL = process.env.SERVICE_URL_AUTHZ || "http://localhost:10001";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || "internal_shared_secret_key";

export async function callAuthZApi<T = unknown>(
  endpoint: string,
  method: string = "GET",
  body?: unknown
): Promise<T> {
  const url = `${AUTHZ_URL}${endpoint}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Secret": INTERNAL_SECRET,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error");
    throw new Error(`AuthZ API error: ${res.status} - ${errorText}`);
  }

  return res.json() as Promise<T>;
}
