import { createAuthClient } from "better-auth/client";
import { jwtClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:10000",
  plugins: [
    jwtClient(), // Add JWT client plugin
  ],
});
