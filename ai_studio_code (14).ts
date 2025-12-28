/**
 * SPECTRE v13.1 - Entry Point
 * CLI interface for the orchestrator
 */

import "dotenv/config";
import pino from "pino";
import { processTask } from "./orchestrator";
import type { Task, Sensitivity } from "./orchestrator/types";

// Initialize logger
const log = pino({
  level: process.env.LOG_LEVEL ?? "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true
    }
  }
});

/**
 * Parse CLI arguments into task parameters
 */
function parseArgs(): { intent: string; options: Partial<Task> } {
  const args = process.argv.slice(2);
  
  let intent = "";
  const options: Partial<Task> = {
    category: "research",
    sensitivity: "low" as Sensitivity,
    complexity: 1,
    modality: "text"
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === "--category" && args[i + 1]) {
      options.category = args[++i];
    } else if (arg === "--sensitivity" && args[i + 1]) {
      options.sensitivity = args[++i] as Sensitivity;
    } else if (arg === "--complexity" && args[i + 1]) {
      options.complexity = parseInt(args[++i], 10) as 1 | 2 | 3;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else if (!arg.startsWith("--")) {
      intent += (intent ? " " : "") + arg;
    }
  }

  if (!intent) {
    intent = "Explain the SPECTRE v13.1 orchestrator architecture and its key components.";
  }

  return { intent, options };
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
SPECTRE v13.1 - Multi-Model AI Orchestrator

USAGE:
  npm start "<intent>" [options]
  
OPTIONS:
  --category <cat>      Task category (research, code-review, etc.)
  --sensitivity <level> low, medium, high, critical
  --complexity <1-3>    Task complexity level
  --help, -h            Show this help message

EXAMPLES:
  npm start "Explain SOLID principles in TypeScript"
  npm start "Review this code for security issues" --category code-review --sensitivity high
  npm start "Debug this function" --complexity 2

ENVIRONMENT:
  Configure API keys in .env file for live model responses.
  Without keys, the system runs in simulation mode.
  `);
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║              DΞMON CORE SPECTRE v13.1                         ║
║     Stealth Protocol for Ethical Compliance,                  ║
║     Tiered Routing & Execution                                ║
╚═══════════════════════════════════════════════════════════════╝
  `);

  const { intent, options } = parseArgs();
  
  log.info({ intent: intent.substring(0, 100) + "..." }, "Processing task");

  const task: Task = {
    id: `task-${Date.now()}`,
    intent,
    category: options.category,
    sensitivity: options.sensitivity || "low",
    complexity: options.complexity || 1,
    modality: options.modality || "text",
    tags: ["cli", options.category || "general"]
  };

  try {
    const result = await processTask(task);
    
    log.info({
      taskId: result.taskId,
      tier: result.tier,
      model: result.model,
      validated: result.validated,
      attempts: result.attempts,
      simulated: result.simulated,
      processingTime: `${result.processingTime}ms`
    }, "Task completed");

    console.log("\n" + "═".repeat(60));
    console.log("RESULT:");
    console.log("═".repeat(60));
    console.log(result.final);
    console.log("═".repeat(60));
    
    // Output full JSON for programmatic use
    if (process.env.JSON_OUTPUT === "true") {
      console.log("\nFULL OUTPUT (JSON):");
      console.log(JSON.stringify(result, null, 2));
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error({ error: errorMessage }, "Task failed");
    console.error(`\n❌ ERROR: ${errorMessage}`);
    process.exit(1);
  }
}

// Execute
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});