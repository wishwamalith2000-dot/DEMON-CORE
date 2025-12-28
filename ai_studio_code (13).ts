/**
 * SPECTRE v13.1 - Provider Registry
 * Central registry for model provider adapters
 */

import "dotenv/config";
import type { ProviderResult } from "../orchestrator/types";

export interface ProviderAdapter {
  name: string;
  supports: (modelName: string) => boolean;
  generate: (modelName: string, prompt: string) => Promise<ProviderResult>;
}

/**
 * Check if environment variable exists and has value
 */
function hasEnv(key: string): boolean {
  return typeof process.env[key] === "string" && process.env[key]!.length > 0;
}

/**
 * Create simulation response
 */
function simulateResponse(model: string, prompt: string): ProviderResult {
  return {
    content: `[SIMULATED ${model}]\n\nPrompt received (${prompt.length} chars).\nConfigure API key to enable live responses.`,
    simulated: true,
    model
  };
}

// ============================================
// PROVIDER ADAPTERS
// ============================================

export const OpenAIAdapter: ProviderAdapter = {
  name: "openai",
  supports: (m) => /^^GPT-/i.test(m),
  
  async generate(modelName, prompt): Promise<ProviderResult> {
    if (!hasEnv("OPENAI_API_KEY")) {
      return simulateResponse(modelName, prompt);
    }

    try {
      // Dynamic import to avoid errors when key not present
      const { default: OpenAI } = await import("openai");
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      // Map friendly names to API model IDs
      const modelMap: Record<string, string> = {
        "GPT-5.1-Codex-Max": "gpt-4-turbo-preview",
        "GPT-5": "gpt-4-turbo-preview",
        "GPT-5.1": "gpt-4-turbo-preview",
        "GPT-5.2": "gpt-4-turbo-preview",
        "GPT-5 mini": "gpt-3.5-turbo",
        "GPT-4.1": "gpt-4-turbo-preview",
        "GPT-4o": "gpt-4o",
        "GPT-4o-mini": "gpt-4o-mini",
        "GPT-4.5": "gpt-4-turbo-preview"
      };
      
      const apiModel = modelMap[modelName] || "gpt-4-turbo-preview";
      
      const response = await client.chat.completions.create({
        model: apiModel,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4096,
        temperature: 0.7
      });

      return {
        content: response.choices[0]?.message?.content || "",
        simulated: false,
        model: modelName,
        tokens: {
          input: response.usage?.prompt_tokens || 0,
          output: response.usage?.completion_tokens || 0
        }
      };
    } catch (error) {
      return {
        content: `[ERROR] OpenAI API call failed: ${error}`,
        simulated: true,
        model: modelName
      };
    }
  }
};

export const AnthropicAdapter: ProviderAdapter = {
  name: "anthropic",
  supports: (m) => /^^Claude/i.test(m),
  
  async generate(modelName, prompt): Promise<ProviderResult> {
    if (!hasEnv("ANTHROPIC_API_KEY")) {
      return simulateResponse(modelName, prompt);
    }

    try {
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      
      const modelMap: Record<string, string> = {
        "Claude Opus 4.5": "claude-3-opus-20240229",
        "Claude Sonnet 4": "claude-3-sonnet-20240229",
        "Claude Sonnet 4.5": "claude-3-5-sonnet-20241022",
        "Claude Haiku 4.5": "claude-3-haiku-20240307"
      };
      
      const apiModel = modelMap[modelName] || "claude-3-5-sonnet-20241022";
      
      const response = await client.messages.create({
        model: apiModel,
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }]
      });

      const content = response.content[0];
      return {
        content: content.type === "text" ? content.text : "",
        simulated: false,
        model: modelName,
        tokens: {
          input: response.usage?.input_tokens || 0,
          output: response.usage?.output_tokens || 0
        }
      };
    } catch (error) {
      return {
        content: `[ERROR] Anthropic API call failed: ${error}`,
        simulated: true,
        model: modelName
      };
    }
  }
};

export const GoogleAdapter: ProviderAdapter = {
  name: "google",
  supports: (m) => /^^Gemini/i.test(m),
  
  async generate(modelName, prompt): Promise<ProviderResult> {
    if (!hasEnv("GOOGLE_API_KEY")) {
      return simulateResponse(modelName, prompt);
    }

    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
      
      const modelMap: Record<string, string> = {
        "Gemini 3 Pro": "gemini-1.5-pro",
        "Gemini 3 Standard": "gemini-1.5-flash",
        "Gemini 3 Flash": "gemini-1.5-flash"
      };
      
      const apiModel = modelMap[modelName] || "gemini-1.5-flash";
      const model = genAI.getGenerativeModel({ model: apiModel });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;

      return {
        content: response.text(),
        simulated: false,
        model: modelName
      };
    } catch (error) {
      return {
        content: `[ERROR] Google API call failed: ${error}`,
        simulated: true,
        model: modelName
      };
    }
  }
};

export const XAIAdapter: ProviderAdapter = {
  name: "xai",
  supports: (m) => /^^Grok/i.test(m),
  
  async generate(modelName, prompt): Promise<ProviderResult> {
    if (!hasEnv("XAI_API_KEY")) {
      return simulateResponse(modelName, prompt);
    }

    // xAI uses OpenAI-compatible API
    try {
      const { default: OpenAI } = await import("openai");
      const client = new OpenAI({
        apiKey: process.env.XAI_API_KEY,
        baseURL: "https://api.x.ai/v1"
      });
      
      const response = await client.chat.completions.create({
        model: "grok-beta",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4096
      });

      return {
        content: response.choices[0]?.message?.content || "",
        simulated: false,
        model: modelName
      };
    } catch (error) {
      return {
        content: `[ERROR] xAI API call failed: ${error}`,
        simulated: true,
        model: modelName
      };
    }
  }
};

// ============================================
// REGISTRY
// ============================================

export const Adapters: ProviderAdapter[] = [
  OpenAIAdapter,
  AnthropicAdapter,
  GoogleAdapter,
  XAIAdapter
];

/**
 * Resolve the appropriate adapter for a model
 */
export function resolveAdapter(modelName: string): ProviderAdapter | null {
  return Adapters.find(a => a.supports(modelName)) ?? null;
}

/**
 * List all available adapters
 */
export function listAdapters(): string[] {
  return Adapters.map(a => a.name);
}