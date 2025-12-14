import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { resolve } from "path";
import postgres from "postgres";
import * as schema from "./authz-schema";

// Load .env file from root directory
config({ path: resolve(__dirname, "../../../.env") });

const connectionString = process.env.DATABASE_URL_AUTHZ;

if (!connectionString) {
  console.error("DATABASE_URL_AUTHZ is not set!");
  throw new Error("DATABASE_URL_AUTHZ environment variable is not set");
}

const client = postgres(connectionString, { prepare: false });
export const authzDb = drizzle(client, { schema });
