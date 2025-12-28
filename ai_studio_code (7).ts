/**
 * SPECTRE v13.1 - Task Router
 * Intelligent routing of tasks to appropriate model tiers
 */

import type { Task, Tier } from "./types";
import { SPECTRE_CONFIG } from "./config";

/**
 * Select the appropriate tier based on task parameters
 */
export function selectTier(task: Task): Tier {
  // Critical sensitivity always goes to HIGH
  if (task.sensitivity === "critical") {
    return "high";
  }
  
  // High sensitivity or max complexity -> HIGH tier
  if (task.sensitivity === "high" || task.complexity === 3) {
    return "high";
  }
  
  // Medium sensitivity or moderate complexity -> MID tier
  if (task.sensitivity === "medium" || task.complexity === 2) {
    return "mid";
  }
  
  // Check for specific tags that require higher tiers
  const highTierTags = ["architecture", "security", "performance", "optimization"];
  const midTierTags = ["refactor", "debug", "test", "document"];
  
  if (task.tags?.some(tag => highTierTags.includes(tag.toLowerCase()))) {
    return "high";
  }
  
  if (task.tags?.some(tag => midTierTags.includes(tag.toLowerCase()))) {
    return "mid";
  }
  
  // Default to LOW tier for simple tasks
  return "low";
}

/**
 * Pick a specific model from the selected tier
 */
export function pickModel(tier: Tier): string {
  const pool = SPECTRE_CONFIG.models[tier];
  
  if (!pool || pool.length === 0) {
    // Fallback chain: high -> mid -> low
    const fallbackOrder: Tier[] = ["high", "mid", "low"];
    for (const fallbackTier of fallbackOrder) {
      const fallbackPool = SPECTRE_CONFIG.models[fallbackTier];
      if (fallbackPool && fallbackPool.length > 0) {
        return fallbackPool[0];
      }
    }
    throw new Error("No models available in any tier");
  }
  
  // Random selection from pool (could be weighted in production)
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Get fallback tier if current tier fails
 */
export function getFallbackTier(currentTier: Tier): Tier | null {
  const fallbackMap: Record<Tier, Tier | null> = {
    "high": "mid",
    "mid": "low",
    "low": null,
    "local": "low"
  };
  return fallbackMap[currentTier];
}

/**
 * Determine if task should use local models (for sensitive operations)
 */
export function shouldUseLocal(task: Task): boolean {
  const localIndicators = [
    task.sensitivity === "critical",
    task.tags?.includes("sensitive"),
    task.tags?.includes("offline"),
    task.metadata?.forceLocal === true
  ];
  
  return localIndicators.some(Boolean);
}