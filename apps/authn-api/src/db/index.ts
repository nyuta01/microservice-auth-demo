import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { resolve } from "path";
import postgres from "postgres";
import * as schema from "./schema";

// Load .env file from root directory
// tsx runs as CommonJS, so __dirname is available
config({ path: resolve(__dirname, "../../../.env") });

const connectionString = process.env.DATABASE_URL_AUTH;

if (!connectionString) {
  console.error("DATABASE_URL_AUTH is not set!");
  console.error("Please ensure .env file exists in the root directory with DATABASE_URL_AUTH set.");
  throw new Error("DATABASE_URL_AUTH environment variable is not set");
}

// For debugging: verify the username part of connection string (do not display password)
const urlMatch = connectionString.match(/postgres:\/\/([^:]+):/);
if (urlMatch) {
  console.log(`Connecting to database as user: ${urlMatch[1]}`);
}

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });

// Export function to close database connection
export const closeDatabase = async () => {
  await client.end();
};
