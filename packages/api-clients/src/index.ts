/**
 * AuthZ Service Client
 * Handles queries from resource servers to the authorization server
 */

const AUTHZ_URL = process.env.SERVICE_URL_AUTHZ || "http://localhost:10001";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || "internal_shared_secret_key";

interface CheckPermissionRequest {
  userId: string;
  organizationId?: string;
  workspaceId?: string;
  permission: string;
  /**
   * JWT token (Zero Trust: role is verified by AuthZ API)
   */
  token?: string;
  /**
   * @deprecated Please pass the JWT token. Kept for backward compatibility.
   */
  userRole?: string;
}

interface CheckPermissionResponse {
  allowed: boolean;
  reason?: string;
}

export const checkPermission = async (params: CheckPermissionRequest): Promise<boolean> => {
  try {
    console.log("[API Client] checkPermission called with:", {
      ...params,
      token: params.token ? "[REDACTED]" : undefined,
    });

    // Validate parameters
    if (!params.userId || !params.permission) {
      console.error("[API Client] Missing required parameters:", params);
      return false;
    }

    // Either organizationId or workspaceId is required
    if (!params.organizationId && !params.workspaceId) {
      console.error("[API Client] Either organizationId or workspaceId is required:", params);
      return false;
    }

    // Build headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Internal-Secret": INTERNAL_SECRET,
    };

    // Zero Trust: Forward JWT token for verification by AuthZ API
    if (params.token) {
      headers["Authorization"] = `Bearer ${params.token}`;
    }

    // Request body (token not included in body)
    const { token: _token, ...bodyParams } = params;

    const res = await fetch(`${AUTHZ_URL}/internal/authorize`, {
      method: "POST",
      headers,
      body: JSON.stringify(bodyParams),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[API Client] AuthZ check failed with status: ${res.status}`, errorText);
      return false;
    }

    const data: CheckPermissionResponse = await res.json();
    console.log("[API Client] AuthZ response:", data);
    return data.allowed;
  } catch (error) {
    console.error("[API Client] AuthZ Service unreachable:", error);
    return false; // Fail safe: deny when server is down
  }
};
