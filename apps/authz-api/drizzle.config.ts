import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL_AUTHZ;

if (!connectionString) {
  throw new Error("DATABASE_URL_AUTHZ environment variable is not set");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  out: "./drizzle",
  dbCredentials: {
    url: connectionString,
  },
});
