"use client";

import { useAppStore } from "@/store/useAppStore";
import { AgentCard } from "@/components/agents/AgentCard";
import { MessageFeed } from "@/components/agents/MessageFeed";
import { WorkflowGraph } from "@/components/workflow/WorkflowGraph";
import { SearchPanel } from "@/components/workflow/SearchPanel";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AgentId } from "@/types";
import { useState, useCallback, useRef } from "react";
import { runOrchestrator } from "@/lib/agents/orchestrator";
import { UserInputModal } from "@/components/workflow/UserInputModal";
import {
  Activity,
  MessageSquare,
  BarChart2,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatDate } from "@/lib/utils";

const AGENT_ORDER: AgentId[] = [
  "orchestrator",
  "researcher",
  "analyzer",
  "shopper",
  "reporter",
  "fixer",
];

export function DashboardView() {
  const {
    agents,
    messages,
    settings,
    isWorkflowRunning,
    currentSession,
    report,
    userInputRequest,
    updateAgentStatus,
    updateAgentTask,
    addAgentLog,
    addMessage,
    setSearchResults,
    setAnalysis,
    setReport,
    setUserInputRequest,
    resolveUserInput,
    resetAgents,
    startSession,
    completeSession,
    updateSession,
    setWorkflowRunning,
    setActiveView,
  } = useAppStore();

  const [expandedAgent, setExpandedAgent] = useState<AgentId | null>(null);
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const inputResolverRef = useRef<((data: Record<string, string>) => void) | null>(null);

  const handleSearch = useCallback(
    async (query: string, category: string) => {
      if (!settings.apiKeys[settings.aiProvider]) {
        setWorkflowError(
          `Please add your ${settings.aiProvider === "openai" ? "OpenAI" : settings.aiProvider === "claude" ? "Claude" : "Gemini"} API key in Settings before running.`
        );
        return;
      }

      // Reset state
      setWorkflowError(null);
      resetAgents();
      const session = startSession(query, category);

      await runOrchestrator(session, settings, {
        onAgentStatusChange: (agentId, status) => {
          updateAgentStatus(agentId, status as never);
        },
        onAgentTaskChange: (agentId, task) => {
          updateAgentTask(agentId, task);
        },
        onAgentLog: (agentId, log) => {
          addAgentLog(agentId, log);
        },
        onMessage: (message) => {
          addMessage(message);
        },
        onSearchResults: (results) => {
          setSearchResults(results);
          updateSession({ searchResults: results });
        },
        onAnalysis: (analysis) => {
          setAnalysis(analysis);
          updateSession({ analysis });
        },
        onReport: (rep) => {
          setReport(rep);
          updateSession({ report: rep });
        },
        onUserInputRequired: (request) => {
          setUserInputRequest(request);
          updateSession({ requiresUserInput: request });
          return new Promise((resolve) => {
            inputResolverRef.current = resolve;
          });
        },
        onWorkflowComplete: () => {
          completeSession();
          setWorkflowError(null);
        },
        onWorkflowError: (error) => {
          setWorkflowError(error);
          setWorkflowRunning(false);
        },
        onSessionUpdate: (updates) => {
          updateSession(updates);
        },
      });
    },
    [
      settings,
      resetAgents,
      startSession,
      updateAgentStatus,
      updateAgentTask,
      addAgentLog,
      addMessage,
      setSearchResults,
      setAnalysis,
      setReport,
      setUserInputRequest,
      resolveUserInput,
      completeSession,
      updateSession,
      setWorkflowRunning,
    ]
  );

  const handleUserInputSubmit = (data: Record<string, string>) => {
    resolveUserInput(data);
    if (inputResolverRef.current) {
      inputResolverRef.current(data);
      inputResolverRef.current = null;
    }
  };

  const handleUserInputDismiss = () => {
    setUserInputRequest(null);
  };

  const workflowStatus = isWorkflowRunning
    ? "running"
    : currentSession?.status === "completed"
    ? "completed"
    : "idle";

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-y-auto bg-slate-50">
      {/* Search Panel */}
      <Card glow="indigo">
        <CardContent className="pt-5">
          <SearchPanel onSearch={handleSearch} isRunning={isWorkflowRunning} />
        </CardContent>
      </Card>

      {/* Error Banner */}
      <AnimatePresence>
        {workflowError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
          >
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-700">Workflow Error</p>
              <p className="text-sm text-red-600 mt-0.5">{workflowError}</p>
            </div>
            <button onClick={() => setWorkflowError(null)} className="text-red-400 hover:text-red-200">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workflow Complete Banner */}
      <AnimatePresence>
        {currentSession?.status === "completed" && !workflowError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4"
          >
            <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-700">Workflow Complete!</p>
              <p className="text-sm text-emerald-600">
                Research report is ready. {currentSession.completedAt && `Completed at ${formatDate(currentSession.completedAt)}`}
              </p>
            </div>
            {report && (
              <Button
                size="sm"
                variant="success"
                onClick={() => setActiveView("reports")}
                icon={<BarChart2 className="h-4 w-4" />}
              >
                View Report
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Agent Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Activity className="h-4 w-4 text-indigo-400" />
              Agent Status
              {isWorkflowRunning && (
                <Badge variant="info" size="sm">Live</Badge>
              )}
            </h2>
            {isWorkflowRunning && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="h-3.5 w-3.5" />
                Running...
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {AGENT_ORDER.map((agentId) => (
              <AgentCard
                key={agentId}
                agent={agents[agentId]}
                isActive={expandedAgent === agentId}
                expanded={expandedAgent === agentId}
                onClick={() =>
                  setExpandedAgent(expandedAgent === agentId ? null : agentId)
                }
              />
            ))}
          </div>
        </div>

        {/* Right: Workflow Graph + Messages */}
        <div className="space-y-4">
          {/* Workflow Visualization */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-slate-700">Workflow</h3>
            </CardHeader>
            <CardContent>
              <WorkflowGraph
                agents={agents}
                workflowStatus={workflowStatus}
                messages={messages}
              />
            </CardContent>
          </Card>

          {/* Message Feed */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <MessageSquare className="h-4 w-4 text-blue-400" />
                  Agent Messages
                </h3>
                <Badge variant="outline" size="sm">{messages.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              {messages.length === 0 ? (
                <div className="py-8 text-center">
                  <MessageSquare className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">
                    Agent messages will appear here during workflow execution
                  </p>
                </div>
              ) : (
                <MessageFeed messages={messages} maxHeight="300px" />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* User Input Modal */}
      <UserInputModal
        request={userInputRequest}
        onSubmit={handleUserInputSubmit}
        onDismiss={handleUserInputDismiss}
      />
    </div>
  );
}
