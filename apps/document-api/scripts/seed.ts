/**
 * document-api seed script
 *
 * Create sample documents for each workspace
 * Idempotent: existing data is skipped
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { documents } from "../src/db/schema.js";

// Workspace IDs (matches authz-api/scripts/seed.ts, RFC 4122 compliant)
const ORG_1_WORKSPACE_1_ID = "00000000-0000-4000-a000-000000000002"; // Engineering
const ORG_1_WORKSPACE_2_ID = "00000000-0000-4000-a000-000000000003"; // Marketing
const ORG_2_WORKSPACE_1_ID = "00000000-0000-4000-a000-000000000011"; // Product

const SEED_USER_ID = "seed-user";

// Sample documents (for each workspace)
const sampleDocuments = [
  // ========================================
  // Acme Corporation - Engineering
  // ========================================
  {
    id: "00000000-0000-4000-a000-200000000001",
    workspaceId: ORG_1_WORKSPACE_1_ID,
    title: "System Architecture Design Document",
    content:
      "# System Architecture Design Document\n\n## Overview\nAdopting microservice architecture\n\n## Service Structure\n- AuthN API: Authentication\n- AuthZ API: Authorization\n- Business APIs: Business logic",
    category: "architecture",
    tags: "system,design,microservices",
    createdBy: SEED_USER_ID,
  },
  {
    id: "00000000-0000-4000-a000-200000000002",
    workspaceId: ORG_1_WORKSPACE_1_ID,
    title: "Coding Standards",
    content:
      "# Coding Standards\n\n## TypeScript\n- Enable strict mode\n- Prohibit use of any type\n\n## React\n- Use function components\n- Manage state with custom hooks",
    category: "standards",
    tags: "coding,typescript,react",
    createdBy: SEED_USER_ID,
  },
  {
    id: "00000000-0000-4000-a000-200000000003",
    workspaceId: ORG_1_WORKSPACE_1_ID,
    title: "API Specification v2.0",
    content:
      "# API Specification v2.0\n\n## Authentication\nUsing JWT Bearer Token\n\n## Endpoints\n- GET /api/tasks\n- POST /api/tasks\n- PUT /api/tasks/:id",
    category: "specification",
    tags: "api,documentation,rest",
    createdBy: SEED_USER_ID,
  },
  // ========================================
  // Acme Corporation - Marketing
  // ========================================
  {
    id: "00000000-0000-4000-a000-200000000011",
    workspaceId: ORG_1_WORKSPACE_2_ID,
    title: "Brand Guidelines",
    content:
      "# Brand Guidelines\n\n## Color Palette\n- Primary: #3B82F6\n- Secondary: #10B981\n\n## Fonts\n- Headings: Inter Bold\n- Body: Inter Regular",
    category: "brand",
    tags: "brand,design,guidelines",
    createdBy: SEED_USER_ID,
  },
  {
    id: "00000000-0000-4000-a000-200000000012",
    workspaceId: ORG_1_WORKSPACE_2_ID,
    title: "Q1 Marketing Plan",
    content:
      "# Q1 Marketing Plan\n\n## Goals\n- Lead acquisition: 1000\n- Webinars: 3 times\n\n## Budget\nTotal: 5,000,000 yen",
    category: "plan",
    tags: "marketing,quarterly,budget",
    createdBy: SEED_USER_ID,
  },
  // ========================================
  // Global Tech Inc - Product
  // ========================================
  {
    id: "00000000-0000-4000-a000-200000000021",
    workspaceId: ORG_2_WORKSPACE_1_ID,
    title: "Product Roadmap 2025",
    content:
      "# Product Roadmap 2025\n\n## Q1\n- Dashboard refresh\n- Mobile app v2\n\n## Q2\n- AI feature integration\n- API v3 release",
    category: "roadmap",
    tags: "product,roadmap,planning",
    createdBy: SEED_USER_ID,
  },
  {
    id: "00000000-0000-4000-a000-200000000022",
    workspaceId: ORG_2_WORKSPACE_1_ID,
    title: "User Research Results",
    content:
      "# User Research Results\n\n## Survey Overview\nTarget: 50 active users\n\n## Key Findings\n- Most requests for search function improvements\n- Mobile usage increased to 40%",
    category: "research",
    tags: "user,research,feedback",
    createdBy: SEED_USER_ID,
  },
];

async function seed() {
  const connectionString = process.env.DATABASE_URL_DOCUMENT;
  if (!connectionString) {
    throw new Error("DATABASE_URL_DOCUMENT environment variable is not set");
  }

  const client = postgres(connectionString, { prepare: false });
  const db = drizzle(client);

  console.log("=== document-api seed starting ===");

  for (const doc of sampleDocuments) {
    await db.insert(documents).values(doc).onConflictDoNothing();
  }

  console.log(`[OK] Documents: ${sampleDocuments.length} sample records`);
  console.log(`     - Engineering: 3 documents`);
  console.log(`     - Marketing: 2 documents`);
  console.log(`     - Product: 2 documents`);
  console.log("=== document-api seed completed ===");

  await client.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
