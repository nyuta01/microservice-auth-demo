/**
 * Unified Database Seed Orchestrator
 *
 * Execute seeds for all services in order:
 * 1. authz-api: Roles, Permissions, Organization, Workspace
 * 2. authn-api: Users, Organization/Workspace Members
 * 3. task-api + document-api: Sample data (parallel)
 */

import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, "..");

interface SeedResult {
  service: string;
  success: boolean;
  duration: number;
  error?: string;
}

function runSeed(service: string): Promise<SeedResult> {
  const startTime = Date.now();
  const cwd = resolve(ROOT_DIR, "apps", service);

  return new Promise((resolve) => {
    const proc = spawn("pnpm", ["db:seed"], {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
      process.stdout.write(data);
    });

    proc.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
      process.stderr.write(data);
    });

    proc.on("close", (code) => {
      const duration = Date.now() - startTime;
      resolve({
        service,
        success: code === 0,
        duration,
        error: code !== 0 ? stderr || stdout : undefined,
      });
    });

    proc.on("error", (err) => {
      const duration = Date.now() - startTime;
      resolve({
        service,
        success: false,
        duration,
        error: err.message,
      });
    });
  });
}

async function main() {
  const startTime = Date.now();

  console.log("╔══════════════════════════════════════════╗");
  console.log("║       Database Seed - Starting           ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log("");

  const results: SeedResult[] = [];

  // Step 1: authz-api (must run first - creates roles, permissions, org, workspace)
  console.log("▶ Step 1: authz-api");
  const authzResult = await runSeed("authz-api");
  results.push(authzResult);

  if (!authzResult.success) {
    console.error(`✗ authz-api failed. Aborting.`);
    process.exit(1);
  }
  console.log("");

  // Step 2: authn-api (depends on authz-api for organization/workspace)
  console.log("▶ Step 2: authn-api");
  const authnResult = await runSeed("authn-api");
  results.push(authnResult);

  if (!authnResult.success) {
    console.error(`✗ authn-api failed. Aborting.`);
    process.exit(1);
  }
  console.log("");

  // Step 3: task-api + document-api (can run in parallel)
  console.log("▶ Step 3: task-api + document-api (parallel)");
  const [taskResult, documentResult] = await Promise.all([
    runSeed("task-api"),
    runSeed("document-api"),
  ]);
  results.push(taskResult, documentResult);
  console.log("");

  // Summary
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  const allSuccess = results.every((r) => r.success);

  console.log("╔══════════════════════════════════════════╗");
  if (allSuccess) {
    console.log(`║  Seed completed in ${totalDuration}s                 ║`);
  } else {
    console.log(`║  Seed completed with errors              ║`);
  }
  console.log("╚══════════════════════════════════════════╝");
  console.log("");

  // Print summary table
  console.log("Summary:");
  for (const result of results) {
    const status = result.success ? "[OK]" : "[FAIL]";
    const time = `${(result.duration / 1000).toFixed(2)}s`;
    console.log(`  ${status} ${result.service}: ${time}`);
  }

  if (!allSuccess) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Seed orchestrator failed:", err);
  process.exit(1);
});
