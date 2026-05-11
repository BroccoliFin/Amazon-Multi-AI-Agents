"use client";

import { useMemo } from "react";
import { AgentId, AgentState, WorkflowStatus } from "@/types";
import { getAgentColor, getStatusColor, cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { getAgentIcon } from "@/lib/agentIcons";

interface WorkflowGraphProps {
  agents: Record<AgentId, AgentState>;
  workflowStatus: WorkflowStatus;
  messages: import("@/types").AgentMessage[];
}

const AGENT_POSITIONS = [
  { id: "orchestrator" as AgentId, x: 50, y: 10, label: "Orchestrator" },
  { id: "researcher" as AgentId, x: 15, y: 45, label: "Research" },
  { id: "analyzer" as AgentId, x: 50, y: 45, label: "Analyzer" },
  { id: "shopper" as AgentId, x: 85, y: 45, label: "Shopper" },
  { id: "reporter" as AgentId, x: 50, y: 80, label: "Reporter" },
  { id: "fixer" as AgentId, x: 85, y: 80, label: "Fixer" },
];

const CONNECTIONS = [
  { from: "orchestrator", to: "researcher" },
  { from: "orchestrator", to: "analyzer" },
  { from: "orchestrator", to: "shopper" },
  { from: "researcher", to: "analyzer" },
  { from: "analyzer", to: "reporter" },
  { from: "analyzer", to: "shopper" },
  { from: "fixer", to: "orchestrator" },
];

export function WorkflowGraph({ agents, workflowStatus, messages }: WorkflowGraphProps) {
  const activeConnections = useMemo(() => {
    const recent = messages.slice(-10);
    return recent.map((m) => `${m.fromAgent}-${m.toAgent}`);
  }, [messages]);

  return (
    <div className="relative w-full aspect-square max-w-sm mx-auto">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
        {/* Connection lines */}
        {CONNECTIONS.map((conn) => {
          const from = AGENT_POSITIONS.find((a) => a.id === conn.from)!;
          const to = AGENT_POSITIONS.find((a) => a.id === conn.to)!;
          const key = `${conn.from}-${conn.to}`;
          const isActive = activeConnections.includes(key);

          return (
            <g key={key}>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={isActive ? "#6366f1" : "#e2e8f0"}
                strokeWidth={isActive ? "0.8" : "0.5"}
                strokeDasharray={isActive ? "none" : "2,2"}
                opacity={isActive ? 1 : 0.8}
              />
              {isActive && (
                <circle r="1" fill="#6366f1">
                  <animateMotion
                    dur="1.5s"
                    repeatCount="indefinite"
                    path={`M ${from.x} ${from.y} L ${to.x} ${to.y}`}
                  />
                </circle>
              )}
            </g>
          );
        })}
      </svg>

      {/* Agent Nodes */}
      {AGENT_POSITIONS.map((pos) => {
        const agent = agents[pos.id];
        const color = getAgentColor(pos.id);
        const statusColor = getStatusColor(agent.status);
        const isActive = agent.status === "working" || agent.status === "thinking";
        const AgentIcon = getAgentIcon(pos.id);

        return (
          <div
            key={pos.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            <motion.div
              animate={
                isActive
                  ? { scale: [1, 1.05, 1], opacity: [1, 0.9, 1] }
                  : { scale: 1, opacity: 1 }
              }
              transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
              className="flex flex-col items-center gap-1"
            >
              {/* Node */}
              <div
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-xl",
                  "border-2 transition-all duration-300 shadow-sm"
                )}
                style={{
                  backgroundColor: `${color}12`,
                  borderColor: isActive ? color : `${color}35`,
                  boxShadow: isActive ? `0 0 12px ${color}30` : "0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                <AgentIcon className="h-4 w-4" style={{ color }} />

                {/* Status dot */}
                <div
                  className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: statusColor }}
                >
                  {isActive && (
                    <div
                      className="absolute inset-0 rounded-full animate-ping opacity-75"
                      style={{ backgroundColor: statusColor }}
                    />
                  )}
                </div>
              </div>

              {/* Label */}
              <span className="text-center text-xs font-medium text-slate-500 whitespace-nowrap">
                {pos.label}
              </span>
            </motion.div>
          </div>
        );
      })}

      {/* Status overlay */}
      {workflowStatus === "idle" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-xs text-slate-400 bg-white/90 border border-slate-200 px-3 py-1.5 rounded-full shadow-sm">
            Ready to start
          </p>
        </div>
      )}
    </div>
  );
}
