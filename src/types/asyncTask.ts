import type { ComplianceResult } from "@/types/compliance";

export type TaskStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "idle";

export interface AsyncTask {
  id: string;
  taskType: string;
  status: TaskStatus;
  progress: number;
  result?: unknown;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface PacketAnalysisTask extends AsyncTask {
  taskType: "packet_analysis";
  result?: ComplianceResult;
}

export interface TaskContext {
  status: TaskStatus;
  progress: number;
  result?: ComplianceResult;
  error?: string;
  isPolling: boolean;
}

export interface ModelMetadata {
  modelProvider?: "openai" | "anthropic" | "vertex";
  modelName?: string;
  modelError?: string;
  retryCount?: number;
}
