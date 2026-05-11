"use client";

import { useAppStore } from "@/store/useAppStore";
import { getProviderDisplayName } from "@/lib/providers/ai-provider";
import { cn } from "@/lib/utils";
import { Bell, Cpu, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getAgentIcon } from "@/lib/agentIcons";

export function Header() {
  const { settings, isWorkflowRunning, currentSession, agents, activeView } = useAppStore();
  const [showNotif, setShowNotif] = useState(false);

  const hasApiKey = !!settings.apiKeys[settings.aiProvider];
  const activeAgents = Object.values(agents).filter(
    (a) => a.status === "working" || a.status === "thinking"
  );

  const recentLogs = Object.values(agents)
    .flatMap((a) => a.logs)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
      {/* Left: Page title */}
      <div>
        <h1 className="text-lg font-semibold text-slate-800 capitalize">
          {{ dashboard: "Dashboard", workflow: "Workflow", reports: "Reports", settings: "Settings" }[activeView] ?? ""}
        </h1>
        {currentSession && (
          <p className="text-xs text-slate-400 truncate max-w-xs">
            {currentSession.userQuery}
          </p>
        )}
      </div>

      {/* Right: Status indicators */}
      <div className="flex items-center gap-3">
        {/* Active agents */}
        {activeAgents.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              {activeAgents.slice(0, 3).map((agent) => {
                const AgentIcon = getAgentIcon(agent.id);
                return (
                  <div
                    key={agent.id}
                    title={`${agent.name}: ${agent.currentTask}`}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 border-2 border-white shadow-sm"
                  >
                    <AgentIcon className="h-3.5 w-3.5 text-indigo-600" />
                  </div>
                );
              })}
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {activeAgents.length} agent{activeAgents.length !== 1 ? "s" : ""} working
            </span>
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
          </div>
        )}

        {/* AI Provider status */}
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
          <Cpu className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs text-slate-600 font-medium">
            {getProviderDisplayName(settings.aiProvider)}
          </span>
          {hasApiKey ? (
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
          ) : (
            <AlertCircle className="h-3 w-3 text-amber-500" />
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className={cn(
              "relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
              showNotif ? "bg-slate-100 text-slate-700" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            )}
          >
            <Bell className="h-4 w-4" />
            {recentLogs.length > 0 && (
              <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-indigo-500" />
            )}
          </button>

          <AnimatePresence>
            {showNotif && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute right-0 top-10 z-50 w-72 rounded-xl border border-slate-200 bg-white shadow-xl shadow-black/10"
              >
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-700">Recent Activity</p>
                </div>
                <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
                  {recentLogs.length === 0 ? (
                    <p className="px-4 py-6 text-center text-xs text-slate-400">No recent activity</p>
                  ) : (
                    recentLogs.map((log) => (
                      <div key={log.id} className="px-4 py-2.5">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium text-slate-700 capitalize">{log.agentId}</span>
                          <span className={cn(
                            "text-xs font-medium",
                            log.level === "error" ? "text-red-500" :
                            log.level === "success" ? "text-emerald-500" :
                            log.level === "warning" ? "text-amber-500" : "text-slate-400"
                          )}>
                            {log.level}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">{log.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Running indicator */}
        {isWorkflowRunning && (
          <div className="flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-emerald-700 font-semibold">Live</span>
          </div>
        )}
      </div>
    </header>
  );
}
