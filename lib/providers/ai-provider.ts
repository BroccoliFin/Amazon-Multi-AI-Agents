import { AIProvider } from "@/types";

// ============================================================
// AI PROVIDER ABSTRACTION
// Supports OpenAI, Anthropic Claude, and Google Gemini
// ============================================================

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

// ============================================================
// OPENAI PROVIDER
// ============================================================

async function callOpenAI(
  config: AIProviderConfig,
  messages: ChatMessage[]
): Promise<AIResponse> {
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: config.apiKey, dangerouslyAllowBrowser: true });

  const response = await client.chat.completions.create({
    model: config.model || "gpt-4o",
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    temperature: config.temperature ?? 0.3,
    max_tokens: config.maxTokens ?? 4096,
  });

  const choice = response.choices[0];
  return {
    content: choice.message.content || "",
    usage: response.usage
      ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        }
      : undefined,
  };
}

// ============================================================
// CLAUDE PROVIDER
// ============================================================

async function callClaude(
  config: AIProviderConfig,
  messages: ChatMessage[]
): Promise<AIResponse> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: config.apiKey, dangerouslyAllowBrowser: true });

  const systemMessage = messages.find((m) => m.role === "system")?.content || "";
  const userMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  const response = await client.messages.create({
    model: config.model || "claude-opus-4-6",
    system: systemMessage,
    messages: userMessages,
    temperature: config.temperature ?? 0.3,
    max_tokens: config.maxTokens ?? 4096,
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return {
    content: textBlock?.type === "text" ? textBlock.text : "",
    usage: response.usage
      ? {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        }
      : undefined,
  };
}

// ============================================================
// GEMINI PROVIDER
// ============================================================

async function callGemini(
  config: AIProviderConfig,
  messages: ChatMessage[]
): Promise<AIResponse> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(config.apiKey);
  const model = genAI.getGenerativeModel({
    model: config.model || "gemini-1.5-pro",
    generationConfig: {
      temperature: config.temperature ?? 0.3,
      maxOutputTokens: config.maxTokens ?? 4096,
    },
  });

  const systemMessage = messages.find((m) => m.role === "system")?.content || "";
  const conversationMessages = messages.filter((m) => m.role !== "system");

  // Build the prompt with system context
  const fullPrompt = systemMessage
    ? `${systemMessage}\n\n${conversationMessages.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n\n")}`
    : conversationMessages.map((m) => m.content).join("\n\n");

  const result = await model.generateContent(fullPrompt);
  const response = await result.response;

  return {
    content: response.text(),
    usage: response.usageMetadata
      ? {
          promptTokens: response.usageMetadata.promptTokenCount || 0,
          completionTokens: response.usageMetadata.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata.totalTokenCount || 0,
        }
      : undefined,
  };
}

// ============================================================
// UNIFIED AI CALL
// ============================================================

export async function callAI(
  config: AIProviderConfig,
  messages: ChatMessage[]
): Promise<AIResponse> {
  switch (config.provider) {
    case "openai":
      return callOpenAI(config, messages);
    case "claude":
      return callClaude(config, messages);
    case "gemini":
      return callGemini(config, messages);
    default:
      throw new Error(`Unknown AI provider: ${config.provider}`);
  }
}

// ============================================================
// JSON EXTRACTION HELPER
// ============================================================

export function extractJSON<T>(text: string): T | null {
  try {
    // Try direct parse first
    return JSON.parse(text) as T;
  } catch {
    // Extract from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim()) as T;
      } catch {
        // Ignore
      }
    }
    // Try to find JSON object in text
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]) as T;
      } catch {
        // Ignore
      }
    }
    return null;
  }
}

export function getProviderDisplayName(provider: AIProvider): string {
  const names: Record<AIProvider, string> = {
    openai: "OpenAI GPT-4o",
    claude: "Claude Opus 4",
    gemini: "Google Gemini 1.5 Pro",
  };
  return names[provider];
}
