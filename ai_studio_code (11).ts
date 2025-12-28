/**
 * SPECTRE v13.1 - Compliance Engine
 * Intent filtering and category validation
 */

import { z } from "zod";
import { SPECTRE_CONFIG } from "./config";
import type { ComplianceResult } from "./types";

// Intent validation schema
const intentSchema = z.string()
  .min(3, "Intent too short")
  .max(10000, "Intent too long");

/**
 * Check if intent is compliant with system policies
 */
export function checkCompliance(intent: string, category?: string): ComplianceResult {
  const violations: string[] = [];

  // Validate intent format
  const parseResult = intentSchema.safeParse(intent);
  if (!parseResult.success) {
    violations.push(`Invalid intent format: ${parseResult.error.message}`);
  }

  // Check against blocked patterns
  if (SPECTRE_CONFIG.compliance.enabled) {
    for (const pattern of SPECTRE_CONFIG.compliance.blockedPatterns) {
      if (pattern.test(intent)) {
        violations.push(`Blocked pattern detected: ${pattern.source}`);
      }
    }
  }

  // Validate category
  if (category && SPECTRE_CONFIG.compliance.enabled) {
    if (!SPECTRE_CONFIG.compliance.allowedCategories.includes(category)) {
      violations.push(`Category not allowed: ${category}`);
    }
  }

  // Determine final category
  const finalCategory = category || inferCategory(intent);

  return {
    compliant: violations.length === 0,
    violations,
    category: finalCategory
  };
}

/**
 * Simple compliance check (backward compatible)
 */
export function isCompliant(intent: string, category?: string): boolean {
  return checkCompliance(intent, category).compliant;
}

/**
 * Infer category from intent if not provided
 */
function inferCategory(intent: string): string {
  const intentLower = intent.toLowerCase();

  const categoryKeywords: Record<string, string[]> = {
    "code-review": ["review", "audit", "check", "analyze code"],
    "debugging": ["debug", "fix", "error", "bug", "issue"],
    "documentation": ["document", "readme", "explain", "describe"],
    "refactoring": ["refactor", "improve", "optimize", "clean up"],
    "testing": ["test", "spec", "coverage", "unit test"],
    "research": ["research", "find", "compare", "evaluate"],
    "planning": ["plan", "design", "architect", "structure"],
    "educational": ["learn", "teach", "explain", "how does"]
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(kw => intentLower.includes(kw))) {
      return category;
    }
  }

  return "general";
}

/**
 * Get list of allowed categories
 */
export function getAllowedCategories(): string[] {
  return [...SPECTRE_CONFIG.compliance.allowedCategories];
}

/**
 * Add custom blocked pattern (runtime)
 */
export function addBlockedPattern(pattern: RegExp): void {
  SPECTRE_CONFIG.compliance.blockedPatterns.push(pattern);
}