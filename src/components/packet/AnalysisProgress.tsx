interface AnalysisProgressProps {
  stage: "queuing" | "polling" | "processing";
  progress: number;
  elapsedTime: number;
}

const stageLabels: Record<AnalysisProgressProps["stage"], string> = {
  queuing: "Queued",
  polling: "Waiting for worker",
  processing: "Analyzing",
};

const stageMessages: Record<AnalysisProgressProps["stage"], string> = {
  queuing: "Waiting to start...",
  polling: "Connecting to analysis service...",
  processing: "Checking compliance against SOP...",
};

function formatElapsedTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function AnalysisProgress({ stage, progress, elapsedTime }: AnalysisProgressProps) {
  return (
    <div className="w-full max-w-md space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-lg font-medium">{stageLabels[stage]}</span>
        <span className="text-sm text-muted-foreground">
          {formatElapsedTime(elapsedTime)} elapsed
        </span>
      </div>

      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="absolute h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{stageMessages[stage]}</span>
        <span className="font-medium">{progress}%</span>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span>Analysis in progress</span>
      </div>
    </div>
  );
}
