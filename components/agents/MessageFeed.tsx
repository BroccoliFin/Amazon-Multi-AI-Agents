"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AgentMessage } from "@/types";
import { getAgentColor, timeAgo, truncate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ArrowRight, AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";
import { getAgentIcon } from "@/lib/agentIcons";

interface MessageFeedProps {
  messages: AgentMessage[];
  maxHeight?: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  task: <ArrowRight className="h-3 w-3" />,
  result: <CheckCircle className="h-3 w-3" />,
  error: <XCircle className="h-3 w-3" />,
  info: <Info className="h-3 w-3" />,
  warning: <AlertTriangle className="h-3 w-3" />,
  user_input_required: <AlertTriangle className="h-3 w-3" />,
};

const TYPE_COLORS: Record<string, string> = {
  task: "text-blue-600",
  result: "text-emerald-600",
  error: "text-red-600",
  info: "text-slate-400",
  warning: "text-amber-600",
  user_input_required: "text-amber-600",
};

export function MessageFeed({ messages, maxHeight = "400px" }: MessageFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div
      className="overflow-y-auto space-y-2 pr-1"
      style={{ maxHeight }}
    >
      <AnimatePresence initial={false}>
        {messages.map((msg) => (
          <MessageItem key={msg.id} message={msg} />
        ))}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  );
}

function MessageItem({ message }: { message: AgentMessage }) {
  const fromColor = getAgentColor(message.fromAgent);
  const toColor =
    message.toAgent !== "all" ? getAgentColor(message.toAgent) : "#94a3b8";
  const FromIcon = getAgentIcon(message.fromAgent);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-3 rounded-lg bg-slate-50 border border-slate-100 p-3"
    >
      {/* From Agent Icon */}
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
        style={{ background: `${fromColor}15`, border: `1px solid ${fromColor}30` }}
        title={message.fromAgent}
      >
        <FromIcon className="h-3.5 w-3.5" style={{ color: fromColor }} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold capitalize" style={{ color: fromColor }}>
            {message.fromAgent}
          </span>

          <span className="text-xs text-slate-300">→</span>

          <span
            className="text-xs font-semibold capitalize"
            style={{ color: message.toAgent === "all" ? "#94a3b8" : toColor }}
          >
            {message.toAgent === "all" ? "Everyone" : message.toAgent}
          </span>

          <span
            className={cn(
              "ml-auto flex items-center gap-1 text-xs font-medium",
              TYPE_COLORS[message.type]
            )}
          >
            {TYPE_ICONS[message.type]}
            <span className="hidden sm:inline capitalize">{message.type.replace("_", " ")}</span>
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {truncate(message.content, 120)}
        </p>

        <p className="mt-1 text-xs text-slate-300">{timeAgo(message.timestamp)}</p>
      </div>
    </motion.div>
  );
}
