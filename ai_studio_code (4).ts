/**
 * SPECTRE v13.1 - Type Definitions
 * Core types for the orchestration system
 */

export type Tier = "low" | "mid" | "high" | "local";

export type Sensitivity = "low" | "medium" | "high" | "critical";

export type Modality = "text" | "code" | "image" | "audio" | "video" | "multimodal";

export type TaskStatus = "pending" | "processing" | "completed" | "failed" | "escalated";

export interface Task {
  id: string;
  intent: string;
  category?: string;
  sensitivity: Sensitivity;
  complexity: 1 | 2 | 3;
  modality?: Modality;
  tags?: string[];
  priority?: number;
  maxAttempts?: number;
  timeout?: number;
  metadata?: Record<string, unknown>;
}

export interface Output {
  taskId: string;
  tier: Tier;
  model: string;
  raw: string;
  validated: boolean;
  attempts: number;
  final: string;
  simulated: boolean;
  timestamp: string;
  processingTime: number;
  status: TaskStatus;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
}

export interface LTMQueryResult {
  context: string;
  sources: string[];
  confidence: number;
}

export interface ComplianceResult {
  compliant: boolean;
  violations: string[];
  category: string;
}

export interface ProviderResult {
  content: string;
  simulated: boolean;
  model: string;
  tokens?: {
    input: number;
    output: number;
  };
  latency?: number;
}

export interface OrchestratorConfig {
  ltm: {
    endpoint: string;
    enabled: boolean;
  };
  models: Record<Tier, string[]>;
  validation: {
    maxFails: number;
    enabled: boolean;
  };
  anonymization: {
    enabled: boolean;
    rules: {
      removePII: boolean;
      normalizeTone: boolean;
      stripInternalMarkers: boolean;
    };
  };
  compliance: {
    enabled: boolean;
    allowedCategories: string[];
    blockedPatterns: RegExp[];
  };
}