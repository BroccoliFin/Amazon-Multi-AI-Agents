"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  AgentId,
  AgentLog,
  AgentMessage,
  AgentState,
  AgentStatus,
  AgentTask,
  AppSettings,
  WorkflowSession,
  UserInputRequest,
  ResearchReport,
  SearchResult,
  ProductComparison,
} from "@/types";

// ============================================================
// DEFAULT AGENT CONFIGS
// ============================================================

const DEFAULT_AGENTS: Record<AgentId, AgentState> = {
  orchestrator: {
    id: "orchestrator",
    name: "Orchestrator",
    description: "Manages and coordinates all agents in the workflow",
    icon: "orchestrator",
    status: "idle",
    currentTask: null,
    tasks: [],
    logs: [],
    metrics: { tasksCompleted: 0, tasksFailed: 0, totalTime: 0 },
  },
  researcher: {
    id: "researcher",
    name: "Research Agent",
    description: "Searches Amazon for products based on user query",
    icon: "researcher",
    status: "idle",
    currentTask: null,
    tasks: [],
    logs: [],
    metrics: { tasksCompleted: 0, tasksFailed: 0, totalTime: 0 },
  },
  analyzer: {
    id: "analyzer",
    name: "Analysis Agent",
    description: "Analyzes products, compares prices, ratings and features",
    icon: "analyzer",
    status: "idle",
    currentTask: null,
    tasks: [],
    logs: [],
    metrics: { tasksCompleted: 0, tasksFailed: 0, totalTime: 0 },
  },
  shopper: {
    id: "shopper",
    name: "Shopping Agent",
    description: "Handles cart management and checkout process",
    icon: "shopper",
    status: "idle",
    currentTask: null,
    tasks: [],
    logs: [],
    metrics: { tasksCompleted: 0, tasksFailed: 0, totalTime: 0 },
  },
  reporter: {
    id: "reporter",
    name: "Report Agent",
    description: "Generates detailed reports and buying recommendations",
    icon: "reporter",
    status: "idle",
    currentTask: null,
    tasks: [],
    logs: [],
    metrics: { tasksCompleted: 0, tasksFailed: 0, totalTime: 0 },
  },
  fixer: {
    id: "fixer",
    name: "Fixer Agent",
    description: "Monitors workflow health and recovers from failures",
    icon: "fixer",
    status: "idle",
    currentTask: null,
    tasks: [],
    logs: [],
    metrics: { tasksCompleted: 0, tasksFailed: 0, totalTime: 0 },
  },
};

const DEFAULT_SETTINGS: AppSettings = {
  aiProvider: "openai",
  apiKeys: { openai: "", claude: "", gemini: "" },
  amazonCredentials: { email: "", password: "" },
  searchPreferences: {
    maxProducts: 20,
    minRating: 3.5,
    maxPrice: null,
    primeOnly: false,
    sortBy: "relevance",
  },
  workflowPreferences: {
    autoRetry: true,
    maxRetries: 3,
    enableShopping: false,
    notifyOnCompletion: true,
  },
};

// ============================================================
// STORE INTERFACE
// ============================================================

interface AppStore {
  // Settings
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  updateApiKey: (provider: keyof AppSettings["apiKeys"], key: string) => void;

  // Agents
  agents: Record<AgentId, AgentState>;
  updateAgentStatus: (agentId: AgentId, status: AgentStatus) => void;
  updateAgentTask: (agentId: AgentId, task: string | null) => void;
  addAgentLog: (agentId: AgentId, log: AgentLog) => void;
  addAgentTask: (agentId: AgentId, task: AgentTask) => void;
  updateAgentTaskStatus: (
    agentId: AgentId,
    taskId: string,
    status: AgentTask["status"],
    result?: Record<string, unknown>,
    error?: string
  ) => void;
  resetAgents: () => void;

  // Messages
  messages: AgentMessage[];
  addMessage: (message: AgentMessage) => void;
  clearMessages: () => void;

  // Workflow Session
  currentSession: WorkflowSession | null;
  sessions: WorkflowSession[];
  startSession: (query: string, category: string) => WorkflowSession;
  updateSession: (updates: Partial<WorkflowSession>) => void;
  completeSession: () => void;
  clearSession: () => void;

  // Results
  searchResults: SearchResult | null;
  setSearchResults: (results: SearchResult) => void;
  analysis: ProductComparison | null;
  setAnalysis: (analysis: ProductComparison) => void;
  report: ResearchReport | null;
  setReport: (report: ResearchReport) => void;

  // User Input
  userInputRequest: UserInputRequest | null;
  setUserInputRequest: (request: UserInputRequest | null) => void;
  resolveUserInput: (data: Record<string, string>) => void;
  resolvedInputs: Record<string, Record<string, string>>;

  // UI State
  activeView: "dashboard" | "workflow" | "reports" | "settings";
  setActiveView: (view: AppStore["activeView"]) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isWorkflowRunning: boolean;
  setWorkflowRunning: (running: boolean) => void;
}

// ============================================================
// STORE IMPLEMENTATION
// ============================================================

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Settings
      settings: DEFAULT_SETTINGS,
      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),
      updateApiKey: (provider, key) =>
        set((state) => ({
          settings: {
            ...state.settings,
            apiKeys: { ...state.settings.apiKeys, [provider]: key },
          },
        })),

      // Agents
      agents: DEFAULT_AGENTS,
      updateAgentStatus: (agentId, status) =>
        set((state) => ({
          agents: {
            ...state.agents,
            [agentId]: { ...state.agents[agentId], status },
          },
        })),
      updateAgentTask: (agentId, task) =>
        set((state) => ({
          agents: {
            ...state.agents,
            [agentId]: { ...state.agents[agentId], currentTask: task },
          },
        })),
      addAgentLog: (agentId, log) =>
        set((state) => {
          const agent = state.agents[agentId];
          const logs = [...agent.logs, log].slice(-100); // Keep last 100 logs
          return {
            agents: {
              ...state.agents,
              [agentId]: { ...agent, logs },
            },
          };
        }),
      addAgentTask: (agentId, task) =>
        set((state) => ({
          agents: {
            ...state.agents,
            [agentId]: {
              ...state.agents[agentId],
              tasks: [...state.agents[agentId].tasks, task],
            },
          },
        })),
      updateAgentTaskStatus: (agentId, taskId, status, result, error) =>
        set((state) => {
          const agent = state.agents[agentId];
          const tasks = agent.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status,
                  result: result ?? t.result,
                  error: error ?? t.error,
                  completedAt:
                    status === "completed" || status === "failed"
                      ? new Date().toISOString()
                      : t.completedAt,
                }
              : t
          );
          const metrics = {
            ...agent.metrics,
            tasksCompleted:
              status === "completed"
                ? agent.metrics.tasksCompleted + 1
                : agent.metrics.tasksCompleted,
            tasksFailed:
              status === "failed"
                ? agent.metrics.tasksFailed + 1
                : agent.metrics.tasksFailed,
          };
          return {
            agents: { ...state.agents, [agentId]: { ...agent, tasks, metrics } },
          };
        }),
      resetAgents: () =>
        set({
          agents: DEFAULT_AGENTS,
          messages: [],
          searchResults: null,
          analysis: null,
          report: null,
          userInputRequest: null,
          resolvedInputs: {},
        }),

      // Messages
      messages: [],
      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message].slice(-200), // Keep last 200
        })),
      clearMessages: () => set({ messages: [] }),

      // Sessions
      currentSession: null,
      sessions: [],
      startSession: (query, category) => {
        const session: WorkflowSession = {
          id: `session_${Date.now()}`,
          userQuery: query,
          category,
          status: "running",
          steps: [],
          messages: [],
          searchResults: null,
          analysis: null,
          report: null,
          startedAt: new Date().toISOString(),
          completedAt: null,
          requiresUserInput: null,
        };
        set({ currentSession: session, isWorkflowRunning: true });
        return session;
      },
      updateSession: (updates) =>
        set((state) => ({
          currentSession: state.currentSession
            ? { ...state.currentSession, ...updates }
            : null,
        })),
      completeSession: () =>
        set((state) => {
          if (!state.currentSession) return state;
          const completed = {
            ...state.currentSession,
            status: "completed" as const,
            completedAt: new Date().toISOString(),
          };
          return {
            currentSession: completed,
            sessions: [completed, ...state.sessions].slice(0, 50),
            isWorkflowRunning: false,
          };
        }),
      clearSession: () =>
        set({ currentSession: null, isWorkflowRunning: false }),

      // Results
      searchResults: null,
      setSearchResults: (results) => set({ searchResults: results }),
      analysis: null,
      setAnalysis: (analysis) => set({ analysis }),
      report: null,
      setReport: (report) => set({ report }),

      // User Input
      userInputRequest: null,
      setUserInputRequest: (request) => set({ userInputRequest: request }),
      resolvedInputs: {},
      resolveUserInput: (data) =>
        set((state) => {
          if (!state.userInputRequest) return state;
          return {
            resolvedInputs: {
              ...state.resolvedInputs,
              [state.userInputRequest.id]: data,
            },
            userInputRequest: null,
          };
        }),

      // UI State
      activeView: "dashboard",
      setActiveView: (view) => set({ activeView: view }),
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      isWorkflowRunning: false,
      setWorkflowRunning: (running) => set({ isWorkflowRunning: running }),
    }),
    {
      name: "amazon-multi-agent-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings,
        sessions: state.sessions,
        activeView: state.activeView,
      }),
    }
  )
);
