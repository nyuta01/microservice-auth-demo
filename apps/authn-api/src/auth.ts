import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, jwt } from "better-auth/plugins";
import { db } from "./db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    strategy: "jwt", // Stateless JWT
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  plugins: [
    jwt({
      // Include role in JWT payload
      jwt: {
        definePayload: async ({ user }) => ({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role ?? "user", // admin plugin: 'admin' | 'user'
        }),
      },
    }),
    admin(), // Add Admin plugin
  ],
  trustedOrigins: [
    "http://localhost:20100", // Task Web
    "http://localhost:20101", // Document Web
    "http://localhost:20102", // Schedule Web
    "http://localhost:20200", // Console Web
    "http://localhost:20201", // System Admin Web
  ],
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain: "localhost", // In production, use ".example.com"
    },
  },
});
