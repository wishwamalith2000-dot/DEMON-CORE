/**
 * SPECTRE v13.1 - Configuration
 * Central configuration for the orchestration system
 */

import matrix from "../models.matrix.json";
import type { OrchestratorConfig, Tier } from "./types";

export const SPECTRE_CONFIG: OrchestratorConfig = {
  ltm: {
    endpoint: process.env.LTM_ENDPOINT || "ltm://spectre-v13-1-local",
    enabled: process.env.LTM_ENABLED !== "false"
  },
  
  models: matrix as Record<Tier, string[]>,
  
  validation: {
    maxFails: 3,
    enabled: true
  },
  
  anonymization: {
    enabled: true,
    rules: {
      removePII: true,
      normalizeTone: true,
      stripInternalMarkers: true
    }
  },
  
  compliance: {
    enabled: true,
    allowedCategories: [
      "research",
      "code-review",
      "documentation",
      "data-cleaning",
      "planning",
      "ux-writing",
      "design-system",
      "educational",
      "debugging",
      "refactoring",
      "testing",
      "analysis"
    ],
    blockedPatterns: [
      /\b(exploit|weaponize|harm|rootkit|malware|zero[-\s]?day)\b/i,
      /\b(ddos|breach|infiltrate|hack\s+into)\b/i,
      /\b(illegal|contraband|fraud|impersonate)\b/i,
      /\b(phishing|ransomware|keylogger|trojan)\b/i,
      /\b(steal|exfiltrate|dump\s+credentials)\b/i
    ]
  }
};

export { Tier };