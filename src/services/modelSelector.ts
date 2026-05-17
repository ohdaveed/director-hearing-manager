import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { VertexAI } from "@google-cloud/vertexai";

export type ModelProvider = "openai" | "anthropic" | "vertex";

export interface ModelConfig {
  provider: ModelProvider;
  name: string;
  apiKeyEnvVar?: string;
  projectId?: string;
  location?: string;
}

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

const MODELS: ModelConfig[] = [
  {
    provider: "openai",
    name: "gpt-4o",
    apiKeyEnvVar: "VITE_OPENAI_API_KEY",
  },
  {
    provider: "anthropic",
    name: "claude-3-5-sonnet-20241022",
    apiKeyEnvVar: "VITE_ANTHROPIC_API_KEY",
  },
  {
    provider: "vertex",
    name: "gemini-2.0-flash",
    projectId: "dhm2026",
    location: "us-central1",
  },
];

class ModelExhaustedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ModelExhaustedError";
  }
}

async function checkOpenAIQuota(): Promise<boolean> {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) return false;

    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

    // Lightweight check: list models (doesn't consume tokens)
    await openai.models.list();
    return true;
  } catch (error) {
    console.warn("OpenAI quota check failed:", error);
    return false;
  }
}

async function checkAnthropicQuota(): Promise<boolean> {
  try {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) return false;

    // Just check if API key exists - actual quota check happens during call
    return true;
  } catch (error) {
    console.warn("Anthropic quota check failed:", error);
    return false;
  }
}

async function checkVertexQuota(): Promise<boolean> {
  try {
    // Vertex uses ADC (Application Default Credentials)
    // No API key needed - SDK picks up credentials from environment
    // Just check if project is configured
    return true;
  } catch (error) {
    console.warn("Vertex AI quota check failed:", error);
    return false;
  }
}

export async function selectModel(): Promise<ModelConfig> {
  // Check OpenAI first (primary)
  if (await checkOpenAIQuota()) {
    return MODELS[0]; // OpenAI config
  }

  // Check Anthropic second (fallback 1)
  if (await checkAnthropicQuota()) {
    return MODELS[1]; // Anthropic config
  }

  // Check Vertex third (fallback 2)
  if (await checkVertexQuota()) {
    return MODELS[2]; // Vertex config
  }

  throw new ModelExhaustedError(
    "All model providers unavailable (quota exceeded or authentication failed)",
  );
}

export async function callWithModel(
  config: ModelConfig,
  systemPrompt: string,
  messages: Message[],
): Promise<string> {
  switch (config.provider) {
    case "openai": {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) throw new Error("OpenAI API key not configured");

      const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

      const response = await openai.chat.completions.create({
        model: config.name,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
        max_tokens: 2000,
      });

      return response.choices[0]?.message?.content || "";
    }

    case "anthropic": {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error("Anthropic API key not configured");

      const anthropic = new Anthropic({ apiKey });

      const response = await anthropic.messages.create({
        model: config.name,
        max_tokens: 2000,
        system: systemPrompt,
        messages: messages
          .filter((m) => m.role !== "system")
          .map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
      });

      const content = response.content[0];
      if (content.type === "text") {
        return content.text;
      }
      throw new Error("Unexpected response type from Anthropic");
    }

    case "vertex": {
      const vertex = new VertexAI({
        project: config.projectId,
        location: config.location,
      });

      const model = vertex.preview.getGenerativeModel({
        model: config.name,
      });

      const chat = model.startChat({
        systemInstruction: { role: "system", parts: [{ text: systemPrompt }] },
      });

      // Convert messages to Vertex format
      for (const message of messages) {
        if (message.role === "user") {
          await chat.sendMessage(message.content);
        }
      }

      // Get the last response
      const result = await chat.sendMessage(
        messages[messages.length - 1]?.content || "",
      );
      const response = await result.response;

      return response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}

export { ModelExhaustedError };
