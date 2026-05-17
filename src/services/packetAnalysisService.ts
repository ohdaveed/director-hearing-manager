import { supabase } from "@/lib/supabase";
import type { ComplianceResult } from "@/types/compliance";

export type TaskStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "idle";

export interface AnalysisStatus {
  status: TaskStatus;
  progress: number;
  result?: ComplianceResult;
  error?: string;
}

const EDGE_FUNCTION_URL =
  import.meta.env.VITE_SUPABASE_URL + "/functions/v1/packet-review-trigger";

export async function startAnalysis(
  text: string,
  fileName: string,
  fileType: "pdf" | "docx",
): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("No active session");
  }

  const response = await fetch(EDGE_FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      text,
      fileName,
      fileType,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to start analysis");
  }

  const data = await response.json();
  return data.taskId;
}

export async function getAnalysisStatus(
  taskId: string,
): Promise<AnalysisStatus> {
  const { data, error } = await supabase
    .from("packet_analysis_tasks")
    .select("status, progress, result, error")
    .eq("id", taskId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch task status: ${error.message}`);
  }

  if (!data) {
    throw new Error("Task not found");
  }

  return {
    status: (data.status as TaskStatus) || "pending",
    progress: data.progress || 0,
    result: data.result as ComplianceResult | undefined,
    error: data.error || undefined,
  };
}
