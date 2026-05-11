import { FiTarget, FiSearch, FiBarChart2, FiShoppingCart, FiFileText, FiTool, FiCpu } from "react-icons/fi";
import type { IconType } from "react-icons";

export const AGENT_ICONS: Record<string, IconType> = {
  orchestrator: FiTarget,
  researcher: FiSearch,
  analyzer: FiBarChart2,
  shopper: FiShoppingCart,
  reporter: FiFileText,
  fixer: FiTool,
};

export function getAgentIcon(agentId: string): IconType {
  return AGENT_ICONS[agentId] ?? FiCpu;
}
