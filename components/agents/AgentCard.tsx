"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AgentState, AgentLog } from "@/types";
import { cn, getAgentColor, getStatusColor, timeAgo, truncate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Loader2, Zap, Coffee, Wrench } from "lucide-react";
import { getAgentIcon } from "@/lib/agentIcons";

interface AgentCardProps {
  agent: AgentState;
  isActive?: boolean;
  onClick?: () => void;
  expanded?: boolean;
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  idle: <Coffee className="h-3.5 w-3.5" />,
  thinking: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
  working: <Zap className="h-3.5 w-3.5" />,
  waiting: <Clock className="h-3.5 w-3.5" />,
  success: <CheckCircle className="h-3.5 w-3.5" />,
  error: <XCircle className="h-3.5 w-3.5" />,
  paused: <Clock className="h-3.5 w-3.5" />,
};

const STATUS_BADGE: Record<string, "default" | "success" | "error" | "warning" | "info"> = {
  idle: "default",
  thinking: "warning",
  working: "info",
  waiting: "warning",
  success: "success",
  error: "error",
  paused: "warning",
};

export function AgentCard({ agent, isActive, onClick, expanded }: AgentCardProps) {
  const agentColor = getAgentColor(agent.id);
  const recentLogs = agent.logs.slice(-5).reverse();
  const AgentIcon = getAgentIcon(agent.id);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className={cn(
        "relative rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden bg-white",
        isActive ? "shadow-md" : "shadow-sm hover:shadow-md",
        agent.status === "working" && "border-blue-200",
        agent.status === "success" && "border-emerald-200",
        agent.status === "error" && "border-red-200",
        agent.status === "thinking" && "border-amber-200",
        agent.status === "idle" && "border-slate-200",
      )}
      style={{
        borderColor:
          agent.status !== "idle"
            ? `${getStatusColor(agent.status)}50`
            : undefined,
        boxShadow:
          agent.status !== "idle"
            ? `0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px ${getStatusColor(agent.status)}20`
            : undefined,
      }}
    >
      {/* Active pulse indicator */}
      {(agent.status === "working" || agent.status === "thinking") && (
        <div
          className="absolute inset-0 rounded-xl opacity-[0.03] animate-pulse"
          style={{ background: agentColor }}
        />
      )}

      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Agent Icon */}
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: `${agentColor}15`, border: `1.5px solid ${agentColor}30` }}
            >
              <AgentIcon className="h-5 w-5" style={{ color: agentColor }} />
            </div>

            <div className="min-w-0">
              <h3 className="font-semibold text-slate-800 text-sm">{agent.name}</h3>
              <p className="text-xs text-slate-400 truncate">{agent.description}</p>
            </div>
          </div>

          {/* Status Badge */}
          <Badge variant={STATUS_BADGE[agent.status]} size="sm">
            <span className="flex items-center gap-1">
              {STATUS_ICONS[agent.status]}
              <span className="capitalize">{agent.status}</span>
            </span>
          </Badge>
        </div>

        {/* Current Task */}
        <AnimatePresence>
          {agent.currentTask && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3"
            >
              <div className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                {agent.status === "working" && (
                  <Loader2 className="h-3 w-3 shrink-0 animate-spin text-blue-500" />
                )}
                <p className="text-xs text-slate-600 truncate">{agent.currentTask}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Metrics Row */}
        <div className="mt-3 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="h-3 w-3 text-emerald-500" />
            <span className="text-xs text-slate-500">
              {agent.metrics.tasksCompleted} done
            </span>
          </div>
          {agent.metrics.tasksFailed > 0 && (
            <div className="flex items-center gap-1.5">
              <XCircle className="h-3 w-3 text-red-500" />
              <span className="text-xs text-slate-500">
                {agent.metrics.tasksFailed} failed
              </span>
            </div>
          )}
          {agent.tasks.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Wrench className="h-3 w-3 text-slate-400" />
              <span className="text-xs text-slate-500">{agent.tasks.length} tasks</span>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Logs */}
      {expanded && recentLogs.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border-t border-slate-100 p-4"
        >
          <p className="mb-2 text-xs font-semibold text-slate-500">Recent Activity</p>
          <div className="space-y-1.5">
            {recentLogs.map((log) => (
              <LogEntry key={log.id} log={log} />
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function LogEntry({ log }: { log: AgentLog }) {
  const levelColors: Record<string, string> = {
    info: "text-slate-500",
    warning: "text-amber-600",
    error: "text-red-500",
    success: "text-emerald-600",
    debug: "text-slate-400",
  };

  const levelDots: Record<string, string> = {
    info: "bg-slate-400",
    warning: "bg-amber-400",
    error: "bg-red-500",
    success: "bg-emerald-500",
    debug: "bg-slate-300",
  };

  return (
    <div className="flex items-start gap-2">
      <div
        className={cn(
          "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
          levelDots[log.level]
        )}
      />
      <div className="min-w-0 flex-1">
        <p className={cn("text-xs leading-relaxed", levelColors[log.level])}>
          {truncate(log.message, 80)}
        </p>
        <p className="text-xs text-slate-300">{timeAgo(log.timestamp)}</p>
      </div>
    </div>
  );
}
