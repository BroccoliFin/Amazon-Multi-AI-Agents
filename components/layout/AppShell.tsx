"use client";

import { useAppStore } from "@/store/useAppStore";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { DashboardView } from "@/components/views/DashboardView";
import { WorkflowView } from "@/components/views/WorkflowView";
import { ReportsView } from "@/components/views/ReportsView";
import { SettingsView } from "@/components/views/SettingsView";
import { AnimatePresence, motion } from "framer-motion";

export function AppShell() {
  const { activeView } = useAppStore();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#f8fafc" }}>
      {/* Subtle background pattern */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(rgba(79,70,229,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(79,70,229,0.8) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header />

        <main className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeView === "dashboard" && <DashboardView />}
              {activeView === "workflow" && <WorkflowView />}
              {activeView === "reports" && <ReportsView />}
              {activeView === "settings" && <SettingsView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
