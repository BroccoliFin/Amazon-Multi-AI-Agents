import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return "N/A";
  return `$${price.toFixed(2)}`;
}

export function formatNumber(num: number | null): string {
  if (num === null || num === undefined) return "N/A";
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + "...";
}

export function getAgentColor(agentId: string): string {
  const colors: Record<string, string> = {
    orchestrator: "#6366f1",
    researcher: "#3b82f6",
    analyzer: "#8b5cf6",
    shopper: "#10b981",
    reporter: "#f59e0b",
    fixer: "#ef4444",
  };
  return colors[agentId] || "#6b7280";
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    idle: "#6b7280",
    thinking: "#f59e0b",
    working: "#3b82f6",
    waiting: "#8b5cf6",
    success: "#10b981",
    error: "#ef4444",
    paused: "#f97316",
  };
  return colors[status] || "#6b7280";
}

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
