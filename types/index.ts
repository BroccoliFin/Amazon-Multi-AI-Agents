// ============================================================
// CORE TYPES FOR AMAZON MULTI-AGENT SYSTEM
// ============================================================

export type AIProvider = "openai" | "claude" | "gemini";

export type AgentId =
  | "orchestrator"
  | "researcher"
  | "analyzer"
  | "shopper"
  | "reporter"
  | "fixer";

export type AgentStatus =
  | "idle"
  | "thinking"
  | "working"
  | "waiting"
  | "success"
  | "error"
  | "paused";

export type WorkflowStatus =
  | "idle"
  | "running"
  | "paused"
  | "completed"
  | "failed";

export type TaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "failed"
  | "skipped";

// ============================================================
// PRODUCT & AMAZON DATA
// ============================================================

export interface ProductReview {
  author: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  verified: boolean;
  helpful: number;
}

export interface AmazonProduct {
  asin: string;
  title: string;
  price: number | null;
  originalPrice: number | null;
  rating: number | null;
  reviewCount: number | null;
  imageUrl: string;
  images: string[];
  productUrl: string;
  category: string;
  brand: string | null;
  isPrime: boolean;
  discount: number | null;
  rank: number | null;
  features: string[];
  description: string | null;
  reviews: ProductReview[];
  availability: string | null;
  soldBy: string | null;
}

export interface ProductComparison {
  products: AmazonProduct[];
  bestValue: AmazonProduct | null;
  highestRated: AmazonProduct | null;
  cheapest: AmazonProduct | null;
  summary: string;
}

export interface SearchResult {
  query: string;
  category: string;
  products: AmazonProduct[];
  totalFound: number;
  searchedAt: string;
}

// ============================================================
// AGENT MESSAGES & COMMUNICATION
// ============================================================

export interface AgentMessage {
  id: string;
  fromAgent: AgentId;
  toAgent: AgentId | "all";
  type:
    | "task"
    | "result"
    | "error"
    | "info"
    | "warning"
    | "user_input_required";
  content: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

export interface AgentLog {
  id: string;
  agentId: AgentId;
  level: "info" | "warning" | "error" | "success" | "debug";
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

export interface AgentTask {
  id: string;
  agentId: AgentId;
  title: string;
  description: string;
  status: TaskStatus;
  startedAt: string | null;
  completedAt: string | null;
  result?: Record<string, unknown>;
  error?: string;
  retryCount: number;
}

// ============================================================
// AGENT STATE
// ============================================================

export interface AgentState {
  id: AgentId;
  name: string;
  description: string;
  icon: string;
  status: AgentStatus;
  currentTask: string | null;
  tasks: AgentTask[];
  logs: AgentLog[];
  metrics: {
    tasksCompleted: number;
    tasksFailed: number;
    totalTime: number;
  };
}

// ============================================================
// WORKFLOW
// ============================================================

export interface WorkflowStep {
  id: string;
  agentId: AgentId;
  name: string;
  status: TaskStatus;
  dependsOn: string[];
  startedAt: string | null;
  completedAt: string | null;
  output?: Record<string, unknown>;
  error?: string;
}

export interface WorkflowSession {
  id: string;
  userQuery: string;
  category: string;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  messages: AgentMessage[];
  searchResults: SearchResult | null;
  analysis: ProductComparison | null;
  report: ResearchReport | null;
  startedAt: string;
  completedAt: string | null;
  requiresUserInput: UserInputRequest | null;
}

// ============================================================
// REPORTS
// ============================================================

export interface ResearchReport {
  id: string;
  query: string;
  category: string;
  generatedAt: string;
  summary: string;
  topProducts: AmazonProduct[];
  comparison: ProductComparison;
  recommendations: Recommendation[];
  marketInsights: string[];
  buyingGuide: string;
  priceHistory?: PricePoint[];
}

export interface Recommendation {
  rank: number;
  product: AmazonProduct;
  reason: string;
  score: number;
  pros: string[];
  cons: string[];
  bestFor: string;
}

export interface PricePoint {
  date: string;
  price: number;
  asin: string;
}

// ============================================================
// USER INPUT REQUESTS
// ============================================================

export interface UserInputRequest {
  id: string;
  type: "amazon_login" | "captcha" | "2fa" | "confirm_purchase" | "address" | "payment";
  message: string;
  fields?: InputField[];
  urgency: "low" | "medium" | "high";
  timestamp: string;
}

export interface InputField {
  name: string;
  label: string;
  type: "text" | "password" | "email" | "number" | "select";
  required: boolean;
  placeholder?: string;
  options?: string[];
}

// ============================================================
// SETTINGS & CONFIGURATION
// ============================================================

export interface AppSettings {
  aiProvider: AIProvider;
  apiKeys: {
    openai: string;
    claude: string;
    gemini: string;
  };
  amazonCredentials: {
    email: string;
    password: string;
  };
  searchPreferences: {
    maxProducts: number;
    minRating: number;
    maxPrice: number | null;
    primeOnly: boolean;
    sortBy: "relevance" | "price_asc" | "price_desc" | "rating" | "reviews";
  };
  workflowPreferences: {
    autoRetry: boolean;
    maxRetries: number;
    enableShopping: boolean;
    notifyOnCompletion: boolean;
  };
}

// ============================================================
// SSE EVENTS
// ============================================================

export interface SSEEvent {
  type:
    | "agent_status"
    | "agent_log"
    | "agent_message"
    | "workflow_update"
    | "user_input_required"
    | "product_found"
    | "analysis_update"
    | "report_ready"
    | "error"
    | "heartbeat";
  data: Record<string, unknown>;
  timestamp: string;
}

// ============================================================
// TOOL DEFINITIONS
// ============================================================

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (params: Record<string, unknown>) => Promise<ToolResult>;
}

export interface ToolResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

// ============================================================
// WORKFLOW GRAPH NODES (for ReactFlow)
// ============================================================

export interface WorkflowNode {
  id: string;
  type: "agent" | "decision" | "data";
  data: {
    label: string;
    agentId?: AgentId;
    status: TaskStatus;
    description?: string;
  };
  position: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  animated: boolean;
  label?: string;
  style?: Record<string, unknown>;
}
