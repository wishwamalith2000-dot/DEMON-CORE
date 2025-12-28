/**
 * SPECTRE v13.1 - Anonymization Layer
 * PII removal and tone normalization
 */

import { SPECTRE_CONFIG } from "./config";

interface AnonymizationOptions {
  removePII?: boolean;
  normalizeTone?: boolean;
  stripInternalMarkers?: boolean;
}

/**
 * Anonymize output by removing PII and normalizing tone
 */
export function anonymize(
  input: string,
  options?: AnonymizationOptions
): string {
  const opts = {
    ...SPECTRE_CONFIG.anonymization.rules,
    ...options
  };

  let output = input;

  if (opts.removePII) {
    output = removePII(output);
  }

  if (opts.normalizeTone) {
    output = normalizeTone(output);
  }

  if (opts.stripInternalMarkers) {
    output = stripInternalMarkers(output);
  }

  return output;
}

/**
 * Remove Personally Identifiable Information
 */
function removePII(text: string): string {
  let result = text;

  // Email addresses
  result = result.replace(
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    "[REDACTED-EMAIL]"
  );

  // US Social Security Numbers
  result = result.replace(
    /\b\d{3}-\d{2}-\d{4}\b/g,
    "[REDACTED-SSN]"
  );

  // Phone numbers (various formats)
  result = result.replace(
    /\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    "[REDACTED-PHONE]"
  );

  // Credit card numbers (basic pattern)
  result = result.replace(
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    "[REDACTED-CARD]"
  );

  // IP addresses
  result = result.replace(
    /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
    "[REDACTED-IP]"
  );

  // API keys (common patterns)
  result = result.replace(
    /\b(sk-[a-zA-Z0-9]{32,}|api[_-]?key[_-]?[a-zA-Z0-9]{16,})\b/gi,
    "[REDACTED-API-KEY]"
  );

  return result;
}

/**
 * Normalize tone for professional delivery
 */
function normalizeTone(text: string): string {
  let result = text;

  // Normalize whitespace
  result = result.replace(/\s+/g, " ");
  result = result.replace(/\n{3,}/g, "\n\n");

  // Remove excessive punctuation
  result = result.replace(/!{2,}/g, "!");
  result = result.replace(/\?{2,}/g, "?");

  // Trim
  result = result.trim();

  return result;
}

/**
 * Strip internal system markers
 */
function stripInternalMarkers(text: string): string {
  let result = text;

  // Remove simulation markers
  result = result.replace(/\[SIMULATED.*?\]/g, "");
  
  // Remove internal tags
  result = result.replace(/\[INTERNAL:.*?\]/g, "");
  result = result.replace(/\[DEBUG:.*?\]/g, "");
  
  // Remove tier markers
  result = result.replace(/\[TIER:.*?\]/g, "");

  // Clean up any double spaces created
  result = result.replace(/\s{2,}/g, " ");

  return result.trim();
}

/**
 * Check if text contains PII
 */
export function containsPII(text: string): boolean {
  const piiPatterns = [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
    /\b\d{3}-\d{2}-\d{4}\b/,
    /\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/,
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/
  ];

  return piiPatterns.some(pattern => pattern.test(text));
}