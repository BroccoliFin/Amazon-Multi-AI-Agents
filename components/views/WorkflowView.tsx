"use client";

import { useAppStore } from "@/store/useAppStore";
import { AgentCard } from "@/components/agents/AgentCard";
import { MessageFeed } from "@/components/agents/MessageFeed";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AgentId } from "@/types";
import { getAgentColor, timeAgo } from "@/lib/utils";
import {
  Activity,
  MessageSquare,
  ListTodo,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { getAgentIcon } from "@/lib/agentIcons";
import { useState } from "react";

const AGENT_ORDER: AgentId[] = [
  "orchestrator",
  "researcher",
  "analyzer",
  "shopper",
  "reporter",
  "fixer",
];

export function WorkflowView() {
  const { agents, messages, currentSession, isWorkflowRunning } = useAppStore();
  const [selectedAgent, setSelectedAgent] = useState<AgentId>("orchestrator");

  const selected = agents[selectedAgent];
  const allTasks = AGENT_ORDER.flatMap((id) =>
    agents[id].tasks.map((t) => ({ ...t, agentId: id, agentName: agents[id].name }))
  );

  return (
    <div className="flex h-full overflow-hidden bg-slate-50">
      {/* Left Panel: Agent List */}
      <div className="w-64 shrink-0 border-r border-slate-200 overflow-y-auto p-4 space-y-1 bg-white">
        <p className="text-xs font-bold text-slate-400 px-2 mb-3 tracking-wider">AGENTS</p>
        {AGENT_ORDER.map((agentId) => {
          const agent = agents[agentId];
          const isSelected = selectedAgent === agentId;
          const color = getAgentColor(agentId);
          const AgentIcon = getAgentIcon(agentId);
          return (
            <button
              key={agentId}
              onClick={() => setSelectedAgent(agentId)}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${
                isSelected
                  ? "bg-indigo-50 border border-indigo-100 shadow-sm"
                  : "hover:bg-slate-50 border border-transparent"
              }`}
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `${color}15`, border: `1px solid ${color}30` }}
              >
                <AgentIcon className="h-4 w-4" style={{ color }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium truncate ${isSelected ? "text-indigo-700" : "text-slate-700"}`}>{agent.name}</p>
                <p className="text-xs text-slate-400 truncate capitalize">{agent.status}</p>
              </div>
              <div
                className="h-2 w-2 shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    agent.status === "working" || agent.status === "thinking"
                      ? "#3b82f6"
                      : agent.status === "success"
                      ? "#10b981"
                      : agent.status === "error"
                      ? "#ef4444"
                      : "#cbd5e1",
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Center: Selected Agent Detail */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <AgentCard agent={selected} expanded />

        {/* Tasks */}
        {selected.tasks.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <ListTodo className="h-4 w-4 text-indigo-500" />
                Task History
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {selected.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 rounded-lg bg-slate-50 border border-slate-100 p-3"
                  >
                    <div className="mt-0.5">
                      {task.status === "completed" && (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      )}
                      {task.status === "failed" && (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      {task.status === "in_progress" && (
                        <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                      )}
                      {task.status === "pending" && (
                        <Clock className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-700">{task.title}</p>
                      <p className="text-xs text-slate-400">{task.description}</p>
                      {task.startedAt && (
                        <p className="text-xs text-slate-300 mt-1">
                          {timeAgo(task.startedAt)}
                        </p>
                      )}
                      {task.error && (
                        <p className="text-xs text-red-500 mt-1">{task.error}</p>
                      )}
                    </div>
                    <Badge
                      variant={
                        task.status === "completed"
                          ? "success"
                          : task.status === "failed"
                          ? "error"
                          : task.status === "in_progress"
                          ? "info"
                          : "default"
                      }
                      size="sm"
                    >
                      {task.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Logs */}
        {selected.logs.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Activity className="h-4 w-4 text-blue-500" />
                Full Activity Log
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {[...selected.logs].reverse().map((log) => (
                  <div key={log.id} className="flex items-start gap-2 text-xs">
                    <span
                      className={`mt-0.5 shrink-0 font-semibold w-12 ${
                        log.level === "error"
                          ? "text-red-500"
                          : log.level === "success"
                          ? "text-emerald-500"
                          : log.level === "warning"
                          ? "text-amber-500"
                          : "text-slate-400"
                      }`}
                    >
                      [{log.level.toUpperCase().slice(0, 4)}]
                    </span>
                    <span className="text-slate-600 flex-1">{log.message}</span>
                    <span className="text-slate-300 shrink-0">{timeAgo(log.timestamp)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Panel: Messages + Timeline */}
      <div className="w-80 shrink-0 border-l border-slate-200 overflow-y-auto p-4 space-y-4 bg-white">
        {/* Session info */}
        {currentSession && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={isWorkflowRunning ? "info" : "success"} size="sm">
                  {isWorkflowRunning ? "Running" : currentSession.status}
                </Badge>
                <span className="text-xs text-slate-400">{timeAgo(currentSession.startedAt)}</span>
              </div>
              <p className="text-sm font-semibold text-slate-700">{currentSession.userQuery}</p>
              <p className="text-xs text-slate-400 mt-0.5">{currentSession.category}</p>
            </CardContent>
          </Card>
        )}

        {/* Messages */}
        <div>
          <h3 className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-3 tracking-wider">
            <MessageSquare className="h-3.5 w-3.5" />
            AGENT COMMUNICATIONS
            <Badge variant="outline" size="sm">{messages.length}</Badge>
          </h3>
          {messages.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              No messages yet
            </div>
          ) : (
            <MessageFeed messages={messages} maxHeight="500px" />
          )}
        </div>

        {/* All Tasks Timeline */}
        {allTasks.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-slate-500 mb-3 tracking-wider">TASK TIMELINE</h3>
            <div className="relative space-y-2">
              <div className="absolute left-3.5 top-0 bottom-0 w-px bg-slate-200" />
              {allTasks.slice(-10).map((task) => {
                const AgentIcon = getAgentIcon(task.agentId);
                const color = getAgentColor(task.agentId);
                return (
                  <div key={task.id} className="flex items-start gap-3 pl-2">
                    <div
                      className={`mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-white z-10 shadow-sm ${
                        task.status === "completed"
                          ? "bg-emerald-500"
                          : task.status === "failed"
                          ? "bg-red-500"
                          : task.status === "in_progress"
                          ? "bg-blue-500 animate-pulse"
                          : "bg-slate-300"
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <AgentIcon className="h-3 w-3 shrink-0" style={{ color }} />
                        <span className="text-xs font-medium text-slate-700 truncate">{task.title}</span>
                      </div>
                      <span className="text-xs text-slate-400">{task.agentName}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
