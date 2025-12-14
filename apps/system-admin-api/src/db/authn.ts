import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { resolve } from "path";
import postgres from "postgres";
import * as schema from "./authn-schema";

// Load .env file from root directory
config({ path: resolve(__dirname, "../../../.env") });

const connectionString = process.env.DATABASE_URL_AUTH;

if (!connectionString) {
  console.error("DATABASE_URL_AUTH is not set!");
  throw new Error("DATABASE_URL_AUTH environment variable is not set");
}

const client = postgres(connectionString, { prepare: false });
export const authnDb = drizzle(client, { schema });
