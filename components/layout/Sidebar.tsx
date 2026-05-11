"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  GitBranch,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "workflow", label: "Workflow", icon: GitBranch },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar() {
  const { activeView, setActiveView, sidebarOpen, setSidebarOpen, sessions, isWorkflowRunning } =
    useAppStore();

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 220 : 64 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="relative flex flex-col bg-white border-r border-slate-200 shrink-0 overflow-hidden shadow-sm"
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-slate-100 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 shadow-md shadow-indigo-200">
          <ShoppingBag className="h-4.5 w-4.5 text-white" style={{ width: 18, height: 18 }} />
        </div>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="ml-3 min-w-0"
            >
              <p className="text-sm font-bold text-slate-800 whitespace-nowrap">Amazon</p>
              <p className="text-xs text-slate-400 whitespace-nowrap">Multi-Agent AI</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={cn(
                "group flex w-full items-center rounded-xl px-3 py-2.5 transition-all duration-200",
                isActive
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                )}
              />
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                      "ml-3 text-sm font-medium whitespace-nowrap",
                      isActive ? "text-indigo-700" : "text-slate-600"
                    )}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Running indicator */}
              {item.id === "workflow" && isWorkflowRunning && (
                <div className="ml-auto h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              )}

              {/* Sessions badge */}
              {item.id === "reports" && sessions.length > 0 && (
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-100 border border-indigo-200 px-1.5 text-xs font-semibold text-indigo-700"
                    >
                      {sessions.length}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </button>
          );
        })}
      </nav>

      {/* Status indicator */}
      <div className="border-t border-slate-100 p-3">
        <div className={cn("flex items-center gap-2 rounded-xl px-3 py-2.5",
          isWorkflowRunning ? "bg-emerald-50 border border-emerald-100" : "bg-slate-50 border border-slate-100"
        )}>
          <div className={cn(
            "h-2 w-2 shrink-0 rounded-full",
            isWorkflowRunning ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
          )} />
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "text-xs font-medium whitespace-nowrap",
                  isWorkflowRunning ? "text-emerald-700" : "text-slate-400"
                )}
              >
                {isWorkflowRunning ? "Agents Running" : "System Ready"}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-700 transition-colors shadow-md"
      >
        {sidebarOpen ? (
          <ChevronLeft className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
      </button>
    </motion.aside>
  );
}
