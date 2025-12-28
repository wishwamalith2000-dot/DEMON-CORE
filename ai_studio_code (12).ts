/**
 * SPECTRE v13.1 - Main Orchestrator
 * Core orchestration logic with full pipeline
 */

import { v4 as uuidv4 } from "uuid";
import { queryLTM } from "./ltm";
import { selectTier, pickModel, getFallbackTier, shouldUseLocal } from "./router";
import { validate, circuitBreaker, shouldRetry } from "./validation";
import { anonymize } from "./anonymization";
import { checkCompliance } from "./compliance";
import { resolveAdapter } from "../providers/registry";
import { SPECTRE_CONFIG } from "./config";
import type { Task, Output, Tier } from "./types";

/**
 * Process a task through the SPECTRE pipeline
 */
export async function processTask(task: Task): Promise<Output> {
  const startTime = Date.now();
  
  // Initialize task ID if not provided
  const taskId = task.id || `task-${uuidv4()}`;

  // ============================================
  // PHASE 1: COMPLIANCE CHECK
  // ============================================
  const compliance = checkCompliance(task.intent, task.category);
  if (!compliance.compliant) {
    return createErrorOutput(taskId, startTime, {
      error: `Compliance violation: ${compliance.violations.join(", ")}`,
      status: "failed"
    });
  }

  // ============================================
  // PHASE 2: TIER SELECTION
  // ============================================
  let tier: Tier = shouldUseLocal(task) ? "local" : selectTier(task);
  let model = pickModel(tier);
  const adapter = resolveAdapter(model);

  // ============================================
  // PHASE 3: LTM QUERY
  // ============================================
  const ltmResult = await queryLTM(task.intent);
  const context = ltmResult.context;

  // ============================================
  // PHASE 4: MODEL EXECUTION WITH VALIDATION
  // ============================================
  const maxAttempts = task.maxAttempts ?? SPECTRE_CONFIG.validation.maxFails;
  let attempts = 0;
  let raw = "";
  let validated = false;
  let simulated = false;

  while (!validated && !circuitBreaker(attempts, maxAttempts)) {
    attempts++;

    const prompt = buildPrompt(task.intent, context, compliance.category);

    if (adapter) {
      try {
        const result = await adapter.generate(model, prompt);
        raw = result.content;
        simulated = result.simulated;
      } catch (error) {
        raw = `[ERROR] Adapter failed: ${error}`;
        simulated = true;
      }
    } else {
      // Simulation mode
      raw = generateSimulatedResponse(model, prompt);
      simulated = true;
    }

    // Validate output
    if (SPECTRE_CONFIG.validation.enabled) {
      const validationResult = validate(raw);
      validated = validationResult.valid;
      
      if (!validated && shouldRetry(validationResult, attempts)) {
        // Try fallback tier
        const fallbackTier = getFallbackTier(tier);
        if (fallbackTier) {
          tier = fallbackTier;
          model = pickModel(tier);
        }
      }
    } else {
      validated = true;
    }
  }

  // ============================================
  // PHASE 5: ANONYMIZATION
  // ============================================
  const final = SPECTRE_CONFIG.anonymization.enabled
    ? anonymize(raw)
    : raw;

  // ============================================
  // PHASE 6: OUTPUT ASSEMBLY
  // ============================================
  return {
    taskId,
    tier,
    model,
    raw,
    validated,
    attempts,
    final,
    simulated,
    timestamp: new Date().toISOString(),
    processingTime: Date.now() - startTime,
    status: validated ? "completed" : "failed"
  };
}

/**
 * Build the full prompt with context
 */
function buildPrompt(intent: string, context: string, category: string): string {
  return `[SPECTRE v13.1 | Category: ${category}]

CONTEXT FROM LONG-TERM MEMORY:
${context || "No prior context available."}

USER INTENT:
${intent}

INSTRUCTIONS:
- Provide a complete, actionable response
- Include code examples where appropriate
- Cite sources if referencing external information
- Flag any assumptions made

RESPONSE:`;
}

/**
 * Generate simulated response for testing
 */
function generateSimulatedResponse(model: string, prompt: string): string {
  const intentMatch = prompt.match(/USER INTENT:\n(.+?)\n/s);
  const intent = intentMatch ? intentMatch[1].trim() : "unknown intent";
  
  return `[SIMULATED RESPONSE FROM ${model}]

Based on your request: "${intent.substring(0, 100)}..."

This is a simulated response generated in development mode.
To enable live model responses, configure API keys in .env file.

Key points:
1. The orchestrator successfully routed this task
2. Compliance checks passed
3. LTM context was retrieved
4. Validation pipeline executed

[END SIMULATION]`;
}

/**
 * Create error output object
 */
function createErrorOutput(
  taskId: string,
  startTime: number,
  options: { error: string; status: "failed" | "escalated" }
): Output {
  return {
    taskId,
    tier: "low",
    model: "none",
    raw: "",
    validated: false,
    attempts: 0,
    final: options.error,
    simulated: true,
    timestamp: new Date().toISOString(),
    processingTime: Date.now() - startTime,
    status: options.status,
    error: options.error
  };
}

// Re-export types and utilities
export * from "./types";
export { SPECTRE_CONFIG } from "./config";