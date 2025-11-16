
import type React from 'react';

export type View = 
  // Workspace
  | 'projects' 
  // Phase 1-3: Strategy & Research
  | 'problem-framing'
  | 'hypothesis-goals'
  | 'market-research'
  // Phase 4-5: Data & Design
  | 'data-hub'
  | 'design-ideation'
  // Phase 6-7: Build & Develop
  | 'agents' 
  | 'registry' 
  | 'prompt-detail'
  // Phase 8: Validation & Eval
  | 'model-evaluation'
  | 'ab-testing' 
  // Phase 9-10: Deploy & Feedback
  | 'deployments'
  | 'launch-feedback' 
  // Phase 11-12: Growth & Governance
  | 'dashboard' 
  | 'cost' 
  | 'stakeholder-reports'
  | 'governance'
  | 'data-governance'
  | 'responsible-ai'
  // Core Tools
  | 'playground' 
  | 'tools'
  | 'chat';


export type NavItem = {
  name: string;
  icon: React.ReactElement;
  view: View;
  description: string;
};

export interface NavSection {
  name: string;
  items: NavItem[];
}


export interface Metric {
  name: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease' | 'neutral';
  changeDirection: 'positive' | 'negative' | 'neutral';
}

export interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

export type LogSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'UNKNOWN';

export interface LogEntry {
  timestamp: string;
  severity: LogSeverity;
  message: string;
  suggestion?: string;
  details?: string;
}

export interface LogAnalysisResult {
  summary: string;
  events: LogEntry[];
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'model';
  text: string;
  feedback?: 'good' | 'bad';
}

export interface PromptVersion {
  version: number;
  userPrompt: string;
  systemInstruction: string;
  createdAt: string;
  deployed?: boolean;
}

export interface RegisteredPrompt {
  id: string;
  name: string;
  version: number;
  model: AIAgent['model'];
  systemInstruction: string;
  userPrompt: string;
  createdAt: string;
  // New detailed fields
  avgLatency: number;
  costPerKTokens: number;
  usage24h: number;
  errorRate: number;
  versionHistory: PromptVersion[];
}

export interface PlaygroundHistoryItem {
  id: string;
  timestamp: number;
  userPrompt: string;
  systemInstruction: string;
  temperature: number;
  model: AIAgent['model'];
}

export interface Alert {
  id: string;
  timestamp: string;
  severity: 'warning' | 'critical';
  title: string;
  description: string;
  context?: {
    logs?: string[];
    metrics?: Record<string, string | number>;
  }
}

export interface CostBreakdownItem {
  name: string;
  cost: number;
  percentage: number;
}

// New types for AI PM Features

export interface ProblemFrame {
  id: string;
  businessGoal: string;
  userProblem: string;
  successMetrics: string;
  mlProblemStatement: string;
}

export type DatasetSensitivity = 'Public' | 'Internal' | 'Confidential' | 'PII';

export interface DatasetInfo {
  id: string;
  name: string;
  source: string;
  description: string;
  status: 'available' | 'processing' | 'error';
  recordCount: number;
  createdAt: string;
  sensitivity?: DatasetSensitivity;
  qualityScore?: number;
  schema?: { name: string; type: string; }[];
}

export interface ModelEval {
  id: string;
  modelName: string;
  version: string;
  precision: number;
  recall: number;
  f1Score: number;
  accuracy: number;
  dataset: string;
  evaluatedAt: string;
}

export interface BiasFinding {
  id: string;
  demographic: string;
  metric: 'False Positive Rate' | 'False Negative Rate';
  value: number;
  threshold: number;
  isBiased: boolean;
}

export interface SecurityFinding {
  id: string;
  timestamp: string;
  type: 'PII Leak' | 'Prompt Injection' | 'Toxicity' | 'Off-brand';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  prompt: string;
  response: string;
}

export interface StakeholderReport {
  id: string;
  title: string;
  audience: 'Executive' | 'Marketing' | 'Technical';
  createdAt: string;
  summary: string;
  metrics: Metric[];
  notes?: string;
  keyInsights?: string[];
}

export interface ABTestVariant {
  id: 'A' | 'B';
  // Use only the ID for linking, the full prompt object is not needed here.
  promptId: string; 
  promptVersion: number;
  avgLatency?: number;
  costPerResponse?: number;
  qualityScore?: number;
  sampleResponses?: string[];
}

export interface ABTest {
  id:string;
  name: string;
  status: 'running' | 'completed' | 'draft';
  createdAt: string;
  variants: [ABTestVariant, ABTestVariant];
  winner: 'A' | 'B' | null;
}

export interface AgentVersion {
  version: number;
  model: AIAgent['model'];
  systemInstruction: string;
  temperature: number;
  createdAt: string;
}

export interface AIAgent {
  id: string;
  name: string;
  model: 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'imagen-4.0-generate-001' | 'gemini-2.5-flash-image' | 'gemini-1.5-pro-preview-0514' | 'claude-3-sonnet-20240229' | 'llama3-8b-8192';
  systemInstruction: string;
  temperature: number;
  createdAt: string;
  avgResponseTime?: number;
  successRate?: number;
  // New fields for versioning and status
  version: number;
  status: 'development' | 'staging' | 'production';
  versionHistory: AgentVersion[];
}

export type TemplateCategory = 'Content' | 'Code' | 'Data' | 'E-commerce' | 'General';

export interface AgentTemplate {
  id: string;
  name: string;
  model: AIAgent['model'];
  systemInstruction: string;
  temperature: number;
  category: TemplateCategory;
}

export type ProjectPhaseStatus = 'Not Started' | 'In Progress' | 'Completed';

export interface ProjectPhase {
  id: View;
  name: string;
  description: string;
  status: ProjectPhaseStatus;
  content: string; // To store user notes, research, etc.
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  phases: ProjectPhase[];
  agentCount: number;
  promptCount: number;
  testCount: number;
  modelEvalCount: number;
  integrationCount: number;
}

export interface BenchmarkResult {
  agentId: string;
  agentName: string;
  model: AIAgent['model'];
  response: string;
  latency: number;
  qualityScore: number;
  qualityReasoning: string;
  cost: number;
  error?: string;
}

export interface IntegrationProvider {
  id: string;
  name: string;
  description: string;
  logo: React.ReactElement;
  category: 'llm' | 'pm' | 'data-ml';
}

// --- New types for AI Guardrails & Compliance ---
export type PolicyCategory = 'Security' | 'Fairness' | 'Data Privacy' | 'Compliance';
export type ComplianceStatus = 'Pass' | 'Fail' | 'Warning';
export type SensitivityLevel = 'Low' | 'Medium' | 'High';

export interface ComplianceCheckResult {
  policyId: string;
  policyName: string;
  status: ComplianceStatus;
  details: string;
}

export interface GovernancePolicy {
  id: string;
  name: string;
  category: PolicyCategory;
  description: string;
  enabled: boolean;
  sensitivity?: SensitivityLevel;
  // A function that takes a prompt and returns a compliance result
  check: (prompt: RegisteredPrompt | PromptVersion) => Omit<ComplianceCheckResult, 'policyName'>;
}

export interface DeployedArtifact {
    id: string;
    name: string;
    type: 'Agent' | 'Prompt';
    version: number;
    environment: 'Staging' | 'Production';
    deployedAt: string;
    status: 'Active' | 'Monitoring' | 'Degraded' | 'Rolled Back';
}

export interface UserFeedbackTheme {
    theme: string;
    quote: string;
    sentiment: 'Positive' | 'Neutral' | 'Negative';
}

export interface UserFeedbackAnalysis {
    summary: string;
    overallSentiment: 'Positive' | 'Neutral' | 'Negative';
    themes: UserFeedbackTheme[];
}

// --- New types for Data Governance ---
export type UserRole = 'Admin' | 'Developer' | 'Analyst' | 'Guest';
export type Permission = 'Read' | 'Write' | 'Deny';

export interface AccessControlRule {
    id: string;
    role: UserRole;
    datasetId: string;
    permission: Permission;
}

export interface RetentionPolicy {
    id: string;
    datasetSource: string;
    retentionDays: number;
    action: 'Delete' | 'Archive';
}
