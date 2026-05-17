import { useState, useEffect, useCallback } from "react";
import {
  getAnalysisStatus,
  type TaskStatus,
} from "@/services/packetAnalysisService";
import type { ComplianceResult } from "@/types/compliance";

interface UsePacketReviewStatusReturn {
  status: TaskStatus;
  progress: number;
  result?: ComplianceResult;
  error?: string;
  isPolling: boolean;
}

const INITIAL_INTERVAL = 1500; // 1.5 seconds (Doherty Threshold)
const MAX_INTERVAL = 30000; // 30 seconds max

export function usePacketReviewStatus(
  taskId: string | null,
): UsePacketReviewStatusReturn {
  const [status, setStatus] = useState<TaskStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ComplianceResult | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [isPolling, setIsPolling] = useState(false);
  const [intervalMs, setIntervalMs] = useState(INITIAL_INTERVAL);

  const pollStatus = useCallback(async () => {
    if (!taskId) return;

    try {
      const data = await getAnalysisStatus(taskId);

      setStatus(data.status);
      setProgress(data.progress);

      if (data.result) {
        setResult(data.result);
      }

      if (data.error) {
        setError(data.error);
      }

      // Reset interval on successful poll
      setIntervalMs(INITIAL_INTERVAL);

      // Stop polling if completed or failed
      if (data.status === "completed" || data.status === "failed") {
        setIsPolling(false);
      }
    } catch (err) {
      console.error("Polling error:", err);

      // Exponential backoff on error
      setIntervalMs((prev) => Math.min(prev * 2, MAX_INTERVAL));

      if (err instanceof Error) {
        setError(err.message);
      }

      // Don't stop polling on error, just back off
    }
  }, [taskId]);

  useEffect(() => {
    if (!taskId) {
      setStatus("idle");
      setIsPolling(false);
      setProgress(0);
      setResult(undefined);
      setError(undefined);
      setIntervalMs(INITIAL_INTERVAL);
      return;
    }

    // Start polling
    setIsPolling(true);
    setStatus("pending");

    // Initial poll
    pollStatus();

    // Set up interval
    const intervalId = setInterval(pollStatus, intervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [taskId, pollStatus, intervalMs]);

  // Cleanup when component unmounts or task completes/fails
  useEffect(() => {
    if (status === "completed" || status === "failed") {
      setIsPolling(false);
    }
  }, [status]);

  return {
    status,
    progress,
    result,
    error,
    isPolling,
  };
}
