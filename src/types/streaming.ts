export type StreamingChunkType = "progress" | "partial_result" | "complete" | "error";

export interface StreamingChunk {
  type: StreamingChunkType;
  data: unknown;
  timestamp: number;
}

export type AnalysisStage = "extracting" | "analyzing" | "finalizing";

export interface ProgressUpdate {
  progress: number;
  message: string;
  stage: AnalysisStage;
}

export type AnalysisStream = AsyncGenerator<StreamingChunk, void, unknown>;
