/**
 * task-api seed script
 *
 * Create sample tasks for each Workspace
 * Idempotent: Skip existing data
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { tasks } from "../src/db/schema.js";

// Workspace IDs (matches authz-api/scripts/seed.ts, RFC 4122 compliant)
const ORG_1_WORKSPACE_1_ID = "00000000-0000-4000-a000-000000000002"; // Engineering
const ORG_1_WORKSPACE_2_ID = "00000000-0000-4000-a000-000000000003"; // Marketing
const ORG_2_WORKSPACE_1_ID = "00000000-0000-4000-a000-000000000011"; // Product

const SEED_USER_ID = "seed-user";

// Sample tasks (per Workspace)
const sampleTasks = [
  // ========================================
  // Acme Corporation - Engineering
  // ========================================
  {
    id: "00000000-0000-4000-a000-100000000001",
    workspaceId: ORG_1_WORKSPACE_1_ID,
    title: "API Design Review",
    description: "Review the design documentation for new API endpoints",
    status: "in_progress",
    priority: "high",
    createdBy: SEED_USER_ID,
  },
  {
    id: "00000000-0000-4000-a000-100000000002",
    workspaceId: ORG_1_WORKSPACE_1_ID,
    title: "Add Unit Tests",
    description: "Increase test coverage for authentication module to 80% or higher",
    status: "todo",
    priority: "medium",
    createdBy: SEED_USER_ID,
  },
  {
    id: "00000000-0000-4000-a000-100000000003",
    workspaceId: ORG_1_WORKSPACE_1_ID,
    title: "Fix Deployment Script",
    description: "Optimize the deployment stage of CI/CD pipeline",
    status: "done",
    priority: "low",
    createdBy: SEED_USER_ID,
  },
  // ========================================
  // Acme Corporation - Marketing
  // ========================================
  {
    id: "00000000-0000-4000-a000-100000000011",
    workspaceId: ORG_1_WORKSPACE_2_ID,
    title: "Q1 Campaign Planning",
    description: "Plan marketing campaign for new product launch",
    status: "in_progress",
    priority: "high",
    createdBy: SEED_USER_ID,
  },
  {
    id: "00000000-0000-4000-a000-100000000012",
    workspaceId: ORG_1_WORKSPACE_2_ID,
    title: "Create Social Media Schedule",
    description: "Create social media posting calendar for next month",
    status: "todo",
    priority: "medium",
    createdBy: SEED_USER_ID,
  },
  // ========================================
  // Global Tech Inc - Product
  // ========================================
  {
    id: "00000000-0000-4000-a000-100000000021",
    workspaceId: ORG_2_WORKSPACE_1_ID,
    title: "Conduct User Interviews",
    description: "Collect user feedback about new features",
    status: "todo",
    priority: "high",
    createdBy: SEED_USER_ID,
  },
  {
    id: "00000000-0000-4000-a000-100000000022",
    workspaceId: ORG_2_WORKSPACE_1_ID,
    title: "Competitive Analysis Report",
    description: "Create feature comparison report of major competing products",
    status: "done",
    priority: "medium",
    createdBy: SEED_USER_ID,
  },
];

async function seed() {
  const connectionString = process.env.DATABASE_URL_TASK;
  if (!connectionString) {
    throw new Error("DATABASE_URL_TASK environment variable is not set");
  }

  const client = postgres(connectionString, { prepare: false });
  const db = drizzle(client);

  console.log("=== task-api seed starting ===");

  for (const task of sampleTasks) {
    await db.insert(tasks).values(task).onConflictDoNothing();
  }

  console.log(`[OK] Tasks: ${sampleTasks.length} sample records`);
  console.log(`     - Engineering: 3 tasks`);
  console.log(`     - Marketing: 2 tasks`);
  console.log(`     - Product: 2 tasks`);
  console.log("=== task-api seed completed ===");

  await client.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
