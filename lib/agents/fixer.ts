// ============================================================
// FIXER AGENT
// Monitors workflow health and recovers from failures
// ============================================================

import { callAI, AIProviderConfig, extractJSON } from "@/lib/providers/ai-provider";
import { AgentId, WorkflowSession } from "@/types";

export interface FixerInput {
  failedAgent: AgentId;
  error: string;
  context: Record<string, unknown>;
  session: WorkflowSession;
  retryCount: number;
  maxRetries: number;
}

export interface FixerOutput {
  action: "retry" | "skip" | "fallback" | "abort";
  strategy: string;
  modifiedContext?: Record<string, unknown>;
  message: string;
  shouldNotifyUser: boolean;
}

export async function runFixerAgent(
  input: FixerInput,
  aiConfig: AIProviderConfig,
  onProgress: (message: string, data?: Record<string, unknown>) => void
): Promise<FixerOutput> {
  onProgress(`Fixer Agent activated for ${input.failedAgent} failure...`, {
    error: input.error,
    retryCount: input.retryCount,
  });

  // Check if we've exceeded retry limit
  if (input.retryCount >= input.maxRetries) {
    onProgress(`Max retries (${input.maxRetries}) exceeded for ${input.failedAgent}`);
    return {
      action: "abort",
      strategy: "Max retry limit reached",
      message: `Agent ${input.failedAgent} failed after ${input.maxRetries} attempts. Workflow cannot continue automatically.`,
      shouldNotifyUser: true,
    };
  }

  // Analyze the error with AI
  onProgress("Analyzing failure with AI...");
  const analysis = await analyzeFailure(input, aiConfig);

  onProgress(`Fixer strategy: ${analysis.action} - ${analysis.strategy}`);

  return analysis;
}

// ============================================================
// AI FAILURE ANALYSIS
// ============================================================

async function analyzeFailure(
  input: FixerInput,
  config: AIProviderConfig
): Promise<FixerOutput> {
  const response = await callAI(config, [
    {
      role: "system",
      content: `You are an AI workflow recovery specialist. Analyze failures and determine the best recovery strategy. Return JSON only.`,
    },
    {
      role: "user",
      content: `An agent in the Amazon Multi-Agent workflow has failed. Determine the recovery strategy.

Failed Agent: ${input.failedAgent}
Error: ${input.error}
Retry Count: ${input.retryCount}/${input.maxRetries}
Workflow Status: ${input.session.status}
Query: ${input.session.userQuery}

Possible Actions:
- "retry": Retry the failed agent (optionally with modified parameters)
- "skip": Skip this agent and continue with available data
- "fallback": Use alternative approach (e.g., use cached/mock data)
- "abort": Stop the workflow and notify user

Return JSON:
{
  "action": "retry",
  "strategy": "clear explanation of the recovery strategy",
  "modifiedContext": {},
  "message": "user-friendly message about what happened and what the fixer is doing",
  "shouldNotifyUser": false
}

Common solutions:
- API rate limits → retry with delay
- Network errors → retry
- No products found → fallback to mock data
- Invalid API key → abort and notify user
- Login required → notify user for input`,
    },
  ]);

  const parsed = extractJSON<FixerOutput>(response.content);

  return (
    parsed || {
      action: "retry",
      strategy: "Automatic retry with default parameters",
      message: `Retrying ${input.failedAgent} after failure: ${input.error}`,
      shouldNotifyUser: false,
    }
  );
}

// ============================================================
// HEALTH MONITOR
// ============================================================

export function checkWorkflowHealth(session: WorkflowSession): {
  isHealthy: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check for stalled agents
  if (session.status === "running") {
    const startTime = new Date(session.startedAt).getTime();
    const now = Date.now();
    const elapsed = (now - startTime) / 1000 / 60; // minutes

    if (elapsed > 10) {
      issues.push("Workflow has been running for more than 10 minutes");
      suggestions.push("Consider cancelling and retrying with a simpler query");
    }
  }

  // Check for missing results
  if (!session.searchResults && session.status !== "running") {
    issues.push("No search results obtained");
    suggestions.push("Try a different search query or category");
  }

  if (!session.analysis && session.searchResults) {
    issues.push("Analysis incomplete despite having search results");
    suggestions.push("The analyzer may have timed out - try again");
  }

  return {
    isHealthy: issues.length === 0,
    issues,
    suggestions,
  };
}
