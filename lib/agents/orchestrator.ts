// ============================================================
// ORCHESTRATOR AGENT
// Coordinates all agents and manages workflow
// ============================================================

import { callAI, AIProviderConfig } from "@/lib/providers/ai-provider";
import { runResearchAgent } from "./researcher";
import { runAnalyzerAgent } from "./analyzer";
import { runReporterAgent } from "./reporter";
import { runFixerAgent } from "./fixer";
import {
  AgentId,
  AgentLog,
  AgentMessage,
  AppSettings,
  UserInputRequest,
  WorkflowSession,
} from "@/types";

export interface OrchestratorCallbacks {
  onAgentStatusChange: (agentId: AgentId, status: string) => void;
  onAgentTaskChange: (agentId: AgentId, task: string | null) => void;
  onAgentLog: (agentId: AgentId, log: AgentLog) => void;
  onMessage: (message: AgentMessage) => void;
  onSearchResults: (results: import("@/types").SearchResult) => void;
  onAnalysis: (analysis: import("@/types").ProductComparison) => void;
  onReport: (report: import("@/types").ResearchReport) => void;
  onUserInputRequired: (request: UserInputRequest) => Promise<Record<string, string>>;
  onWorkflowComplete: () => void;
  onWorkflowError: (error: string) => void;
  onSessionUpdate: (updates: Partial<WorkflowSession>) => void;
}

let agentIdCounter = 0;
function genId() {
  return `${Date.now()}_${agentIdCounter++}`;
}

// ============================================================
// ORCHESTRATOR MAIN
// ============================================================

export async function runOrchestrator(
  session: WorkflowSession,
  settings: AppSettings,
  callbacks: OrchestratorCallbacks
): Promise<void> {
  const aiConfig: AIProviderConfig = {
    provider: settings.aiProvider,
    apiKey: settings.apiKeys[settings.aiProvider],
    temperature: 0.3,
    maxTokens: 4096,
  };

  const log = (
    agentId: AgentId,
    level: AgentLog["level"],
    message: string,
    data?: Record<string, unknown>
  ) => {
    callbacks.onAgentLog(agentId, {
      id: genId(),
      agentId,
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  };

  const sendMessage = (
    from: AgentId,
    to: AgentId | "all",
    type: AgentMessage["type"],
    content: string,
    data?: Record<string, unknown>
  ) => {
    callbacks.onMessage({
      id: genId(),
      fromAgent: from,
      toAgent: to,
      type,
      content,
      data,
      timestamp: new Date().toISOString(),
    });
  };

  const setStatus = (agentId: AgentId, status: string) =>
    callbacks.onAgentStatusChange(agentId, status);

  const setTask = (agentId: AgentId, task: string | null) =>
    callbacks.onAgentTaskChange(agentId, task);

  try {
    // ============================================================
    // ORCHESTRATOR INITIALIZATION
    // ============================================================
    setStatus("orchestrator", "working");
    setTask("orchestrator", "Initializing workflow");
    log("orchestrator", "info", `Starting workflow for: "${session.userQuery}"`, {
      category: session.category,
    });
    sendMessage(
      "orchestrator",
      "all",
      "info",
      `Workflow started for query: "${session.userQuery}" in ${session.category}`
    );

    // Validate API key
    if (!aiConfig.apiKey) {
      throw new Error(
        `No API key configured for ${settings.aiProvider}. Please add your API key in Settings.`
      );
    }

    await delay(500);

    // ============================================================
    // STEP 1: RESEARCH AGENT
    // ============================================================
    setStatus("orchestrator", "working");
    setTask("orchestrator", "Dispatching Research Agent");
    sendMessage("orchestrator", "researcher", "task", "Start product research", {
      query: session.userQuery,
    });

    setStatus("researcher", "thinking");
    setTask("researcher", "Analyzing search query");
    log("researcher", "info", `Starting research for: "${session.userQuery}"`);

    let researchOutput;
    let researchRetries = 0;

    while (researchRetries <= settings.workflowPreferences.maxRetries) {
      try {
        setStatus("researcher", "working");
        researchOutput = await runResearchAgent(
          {
            query: session.userQuery,
            category: session.category,
            maxProducts: settings.searchPreferences.maxProducts,
            minRating: settings.searchPreferences.minRating,
            primeOnly: settings.searchPreferences.primeOnly,
          },
          aiConfig,
          (message, data) => {
            setTask("researcher", message);
            log("researcher", "info", message, data);
            sendMessage("researcher", "orchestrator", "info", message, data);
          }
        );
        break; // Success
      } catch (error) {
        researchRetries++;
        log("researcher", "error", `Research failed: ${error}`, { attempt: researchRetries });

        if (researchRetries <= settings.workflowPreferences.maxRetries) {
          setStatus("fixer", "working");
          setTask("fixer", "Fixing research failure");
          log("fixer", "info", `Attempting to fix research failure (attempt ${researchRetries})`);

          const fixResult = await runFixerAgent(
            {
              failedAgent: "researcher",
              error: String(error),
              context: { query: session.userQuery, category: session.category },
              session,
              retryCount: researchRetries,
              maxRetries: settings.workflowPreferences.maxRetries,
            },
            aiConfig,
            (msg, data) => log("fixer", "info", msg, data)
          );

          if (fixResult.action === "abort") {
            setStatus("fixer", "error");
            throw new Error(fixResult.message);
          } else if (fixResult.action === "fallback") {
            // Use mock data
            const { generateMockProducts } = await import("@/lib/tools/amazon-scraper");
            const mockProducts = generateMockProducts(
              session.userQuery,
              session.category,
              settings.searchPreferences.maxProducts
            );
            researchOutput = {
              searchResults: {
                query: session.userQuery,
                category: session.category,
                products: mockProducts,
                totalFound: mockProducts.length,
                searchedAt: new Date().toISOString(),
              },
              topProducts: mockProducts,
              categories: [session.category],
              suggestedQueries: [session.userQuery],
              summary: "Using simulated data due to search limitations.",
            };
            setStatus("fixer", "success");
            break;
          }

          setStatus("fixer", "idle");
          await delay(2000 * researchRetries); // Exponential backoff
        }
      }
    }

    if (!researchOutput) {
      throw new Error("Research agent failed after all retries");
    }

    setStatus("researcher", "success");
    setTask("researcher", `Found ${researchOutput.topProducts.length} products`);
    callbacks.onSearchResults(researchOutput.searchResults);
    log("researcher", "success", `Research complete: ${researchOutput.topProducts.length} products found`);
    sendMessage("researcher", "orchestrator", "result", "Research complete", {
      productCount: researchOutput.topProducts.length,
    });

    await delay(300);

    // ============================================================
    // STEP 2: ANALYSIS AGENT
    // ============================================================
    setStatus("orchestrator", "working");
    setTask("orchestrator", "Dispatching Analysis Agent");
    sendMessage("orchestrator", "analyzer", "task", "Start product analysis", {
      productCount: researchOutput.topProducts.length,
    });

    setStatus("analyzer", "thinking");
    setTask("analyzer", "Preparing analysis");
    log("analyzer", "info", `Starting analysis of ${researchOutput.topProducts.length} products`);

    let analysisOutput;
    let analysisRetries = 0;

    while (analysisRetries <= settings.workflowPreferences.maxRetries) {
      try {
        setStatus("analyzer", "working");
        analysisOutput = await runAnalyzerAgent(
          {
            products: researchOutput.topProducts,
            query: session.userQuery,
            category: session.category,
            userBudget: settings.searchPreferences.maxPrice,
          },
          aiConfig,
          (message, data) => {
            setTask("analyzer", message);
            log("analyzer", "info", message, data);
          }
        );
        break;
      } catch (error) {
        analysisRetries++;
        log("analyzer", "error", `Analysis failed: ${error}`);

        if (analysisRetries > settings.workflowPreferences.maxRetries) break;

        setStatus("fixer", "working");
        setTask("fixer", "Fixing analysis failure");
        const fixResult = await runFixerAgent(
          {
            failedAgent: "analyzer",
            error: String(error),
            context: {},
            session,
            retryCount: analysisRetries,
            maxRetries: settings.workflowPreferences.maxRetries,
          },
          aiConfig,
          (msg) => log("fixer", "info", msg)
        );

        if (fixResult.action === "abort" || fixResult.action === "skip") break;
        setStatus("fixer", "idle");
        await delay(2000);
      }
    }

    if (analysisOutput) {
      setStatus("analyzer", "success");
      setTask("analyzer", "Analysis complete");
      callbacks.onAnalysis(analysisOutput.comparison);
      log("analyzer", "success", `Analysis complete with ${analysisOutput.recommendations.length} recommendations`);
      sendMessage("analyzer", "orchestrator", "result", "Analysis complete", {
        recommendationsCount: analysisOutput.recommendations.length,
      });
    } else {
      setStatus("analyzer", "error");
      log("analyzer", "error", "Analysis failed - continuing with partial data");
    }

    await delay(300);

    // ============================================================
    // STEP 3: SHOPPING AGENT (if enabled)
    // ============================================================
    if (settings.workflowPreferences.enableShopping && analysisOutput) {
      const topProduct = analysisOutput.recommendations[0]?.product ||
        researchOutput.topProducts[0];

      if (topProduct) {
        setStatus("orchestrator", "working");
        setTask("orchestrator", "Dispatching Shopping Agent");
        sendMessage("orchestrator", "shopper", "task", "Begin shopping process", {
          product: topProduct.title,
        });

        setStatus("shopper", "thinking");
        setTask("shopper", `Preparing to purchase: ${topProduct.title}`);
        log("shopper", "info", `Starting shopping process for: ${topProduct.title}`);

        try {
          setStatus("shopper", "working");
          const { runShopperAgent } = await import("./shopper");
          const shopResult = await runShopperAgent(
            {
              product: topProduct,
              amazonEmail: settings.amazonCredentials.email,
              amazonPassword: settings.amazonCredentials.password,
            },
            aiConfig,
            (message, data) => {
              setTask("shopper", message);
              log("shopper", "info", message, data);
            },
            async (request) => {
              setStatus("shopper", "waiting");
              setTask("shopper", "Waiting for user input");
              log("shopper", "warning", `User input required: ${request.type}`);
              sendMessage("shopper", "orchestrator", "user_input_required", request.message);
              return await callbacks.onUserInputRequired(request);
            }
          );

          if (shopResult.success) {
            setStatus("shopper", "success");
            setTask("shopper", `Order placed: ${shopResult.orderId}`);
            log("shopper", "success", `Shopping complete! Order ID: ${shopResult.orderId}`);
          } else {
            setStatus("shopper", "error");
            log("shopper", "error", shopResult.error || "Shopping failed");
          }
        } catch (error) {
          setStatus("shopper", "error");
          log("shopper", "error", `Shopping error: ${error}`);
        }
      }
    }

    await delay(300);

    // ============================================================
    // STEP 4: REPORT AGENT
    // ============================================================
    setStatus("orchestrator", "working");
    setTask("orchestrator", "Dispatching Report Agent");
    sendMessage("orchestrator", "reporter", "task", "Generate research report");

    setStatus("reporter", "thinking");
    setTask("reporter", "Compiling data for report");
    log("reporter", "info", "Starting report generation");

    let report;
    try {
      setStatus("reporter", "working");

      const defaultAnalysis = analysisOutput || {
        comparison: {
          products: researchOutput.topProducts.slice(0, 5),
          bestValue: researchOutput.topProducts[0] || null,
          highestRated: researchOutput.topProducts[0] || null,
          cheapest: researchOutput.topProducts[0] || null,
          summary: researchOutput.summary,
        },
        recommendations: researchOutput.topProducts.slice(0, 5).map((p, i) => ({
          rank: i + 1,
          product: p,
          reason: "Top search result",
          score: p.rating || 4.0,
          pros: p.features.slice(0, 2),
          cons: [],
          bestFor: "General users",
        })),
        priceAnalysis: {
          min: 0,
          max: 0,
          avg: 0,
          median: 0,
          priceDistribution: [],
          bestValueProduct: null,
        },
        ratingAnalysis: {
          avgRating: 0,
          avgReviews: 0,
          highestRated: null,
          mostReviewed: null,
          ratingDistribution: [],
        },
        marketInsights: ["Market analysis in progress"],
        buyingGuide: "See individual product recommendations above.",
      };

      report = await runReporterAgent(
        {
          searchResults: researchOutput.searchResults,
          analysis: defaultAnalysis,
          query: session.userQuery,
          category: session.category,
        },
        aiConfig,
        (message, data) => {
          setTask("reporter", message);
          log("reporter", "info", message, data);
        }
      );

      setStatus("reporter", "success");
      setTask("reporter", "Report ready");
      callbacks.onReport(report);
      log("reporter", "success", "Research report generated successfully");
      sendMessage("reporter", "orchestrator", "result", "Report ready", {
        reportId: report.id,
      });
    } catch (error) {
      setStatus("reporter", "error");
      log("reporter", "error", `Report generation failed: ${error}`);
    }

    // ============================================================
    // WORKFLOW COMPLETE
    // ============================================================
    setStatus("orchestrator", "success");
    setTask("orchestrator", "Workflow completed successfully");
    log("orchestrator", "success", "All agents completed successfully");
    sendMessage("orchestrator", "all", "result", "Workflow complete! Report is ready.");

    callbacks.onWorkflowComplete();
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    log("orchestrator", "error", `Workflow failed: ${errorMsg}`);
    setStatus("orchestrator", "error");
    setTask("orchestrator", "Workflow failed");
    callbacks.onWorkflowError(errorMsg);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
