/**
 * AuthN API client
 */

const AUTHN_URL = process.env.SERVICE_URL_AUTHN || "http://localhost:10000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || "internal_shared_secret_key";

interface AuthNUser {
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UsersResponse {
  users: AuthNUser[];
}

// User information cache (simple memory cache)
let usersCache: Map<string, AuthNUser> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

export async function fetchUsers(): Promise<Map<string, AuthNUser>> {
  const now = Date.now();

  // Return cache if it's still valid
  if (usersCache && now - cacheTimestamp < CACHE_TTL) {
    return usersCache;
  }

  const url = `${AUTHN_URL}/api/admin/users`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Secret": INTERNAL_SECRET,
    },
  });

  if (!res.ok) {
    console.error(`AuthN API error: ${res.status}`);
    return new Map();
  }

  const data = (await res.json()) as UsersResponse;
  const userMap = new Map<string, AuthNUser>();

  for (const user of data.users) {
    userMap.set(user.id, user);
  }

  usersCache = userMap;
  cacheTimestamp = now;

  return userMap;
}

export function clearUsersCache(): void {
  usersCache = null;
  cacheTimestamp = 0;
}
