/**
 * SPECTRE v13.1 - Validation Layer
 * Output validation with circuit breaker logic
 */

import type { ValidationResult } from "./types";
import { SPECTRE_CONFIG } from "./config";

/**
 * Validate raw output for quality and safety
 */
export function validate(raw: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  // Check for empty output
  if (!raw || raw.trim().length === 0) {
    errors.push("Output is empty");
    score -= 100;
  }

  // Check for error indicators
  if (/\bERROR\b/i.test(raw)) {
    errors.push("Output contains error indicator");
    score -= 30;
  }

  // Check for incomplete code blocks
  const codeBlockOpens = (raw.match(/```/g) || []).length;
  if (codeBlockOpens % 2 !== 0) {
    errors.push("Unclosed code block detected");
    score -= 20;
  }

  // Check for hallucination indicators
  const hallucinationPatterns = [
    /I don't have access to/i,
    /I cannot browse/i,
    /As an AI/i,
    /I'm not able to/i
  ];
  
  for (const pattern of hallucinationPatterns) {
    if (pattern.test(raw)) {
      warnings.push("Potential capability disclaimer detected");
      score -= 10;
    }
  }

  // Check for truncation
  if (raw.endsWith("...") || raw.endsWith("…")) {
    warnings.push("Output may be truncated");
    score -= 5;
  }

  // Check minimum length for substantive responses
  if (raw.length < 50 && !raw.includes("```")) {
    warnings.push("Output may be too brief");
    score -= 10;
  }

  return {
    valid: errors.length === 0 && score >= 50,
    errors,
    warnings,
    score: Math.max(0, score)
  };
}

/**
 * Simple validation check (backward compatible)
 */
export function isValid(raw: string): boolean {
  return validate(raw).valid;
}

/**
 * Check if circuit breaker should activate
 */
export function circuitBreaker(attempts: number, maxFails?: number): boolean {
  const threshold = maxFails ?? SPECTRE_CONFIG.validation.maxFails;
  return attempts >= threshold;
}

/**
 * Determine if output should be retried
 */
export function shouldRetry(result: ValidationResult, attempts: number): boolean {
  if (circuitBreaker(attempts)) {
    return false;
  }
  
  // Retry on soft failures (warnings only, score >= 30)
  if (result.errors.length === 0 && result.score >= 30) {
    return false; // Accept with warnings
  }
  
  return !result.valid;
}