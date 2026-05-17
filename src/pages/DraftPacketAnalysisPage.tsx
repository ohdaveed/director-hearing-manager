import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DraftUploadPanel from "@/components/packet/DraftUploadPanel";
import ParallelReviewView from "@/components/packet/ParallelReviewView";
import AnalysisProgress from "@/components/packet/AnalysisProgress";
import { startAnalysis } from "@/services/packetAnalysisService";
import { usePacketReviewStatus } from "@/hooks/usePacketReviewStatus";
import {
  saveTaskState,
  getIncompleteTasks,
  deleteTaskState,
} from "@/lib/packetStateBuffer";

import { toast } from "sonner";

type ViewState = "upload" | "analyzing" | "review";
type AnalyzingSubState = "queuing" | "polling" | "processing";

export default function DraftPacketAnalysisPage() {
  const navigate = useNavigate();
  const [viewState, setViewState] = useState<ViewState>("upload");
  const [analyzingSubState, setAnalyzingSubState] =
    useState<AnalyzingSubState>("queuing");
  const [extractedText, setExtractedText] = useState("");
  const [fileName, setFileName] = useState("");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  const { status, progress, result, error } = usePacketReviewStatus(taskId);

  // Track elapsed time during analysis
  useEffect(() => {
    if (viewState !== "analyzing") {
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [viewState]);

  const checkForIncompleteTasks = async () => {
    const incompleteTasks = await getIncompleteTasks();
    if (incompleteTasks.length > 0) {
      setShowResumePrompt(true);
    }
  };

  // Handle online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      checkForIncompleteTasks();
    };

    const handleOffline = () => {
      setIsOffline(true);
      if (taskId && viewState === "analyzing") {
        saveTaskState({
          taskId,
          status: "processing",
          progress,
          fileName,
          textLength: extractedText.length,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        toast.warning("You are offline. Analysis will resume when connected.");
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check initial state
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [taskId, viewState, progress, fileName, extractedText]);

  // Check for incomplete tasks on mount
  useEffect(() => {
    checkForIncompleteTasks();
  }, []);

  // Handle status transitions
  useEffect(() => {
    if (status === "processing") {
      setAnalyzingSubState("processing");
    } else if (status === "pending") {
      setAnalyzingSubState("polling");
    }

    if (status === "completed" && result) {
      setViewState("review");
      if (taskId) {
        deleteTaskState(taskId);
      }
    } else if (status === "failed" && error) {
      toast.error(`Analysis failed: ${error}`);
      setViewState("upload");
    }
  }, [status, result, error, taskId]);

  const handleUpload = async (file: File, text: string) => {
    setExtractedText(text);
    setFileName(file.name);
    setViewState("analyzing");
    setAnalyzingSubState("queuing");

    try {
      const newTaskId = await startAnalysis(
        text,
        file.name,
        file.type === "application/pdf" ? "pdf" : "docx",
      );
      setTaskId(newTaskId);
      setAnalyzingSubState("polling");
    } catch (err) {
      console.error("Failed to start analysis:", err);
      toast.error("Failed to start analysis. Please try again.");
      setViewState("upload");
    }
  };

  const handleBack = () => {
    setViewState("upload");
    setTaskId(null);
    setExtractedText("");
    setFileName("");
    setElapsedTime(0);
  };

  const handleEdit = () => {
    setViewState("upload");
    setTaskId(null);
  };

  const handleApprove = () => {
    toast.success("Packet approved!");
    navigate("/hearing-packets");
  };

  const handleDownload = () => {
    if (!result) return;

    const report = `
DIRECTOR HEARING PACKET COMPLIANCE ANALYSIS
============================================
File: ${fileName}
Analyzed: ${new Date().toISOString()}

COMPLIANCE STATUS: ${result.isCompliant ? "COMPLIANT" : "NON-COMPLIANT"}
Score: ${result.score}/100

SUMMARY
-------
${result.summary}

MISSING SECTIONS
----------------
${result.missingSections.length > 0 ? result.missingSections.join(", ") : "None"}

ISSUES FOUND (${result.issues.length})
-----------------------------------------
${result.issues
  .map(
    (issue, i) => `
${i + 1}. [${issue.severity.toUpperCase()}] ${issue.category}
   Description: ${issue.description}
   Suggestion: ${issue.suggestion}
   ${issue.reference ? `Reference: ${issue.reference}` : ""}
`,
  )
  .join("\n")}

RECOMMENDATIONS
---------------
${result.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join("\n")}

--- 
Original Document Text (first 5000 chars):
${extractedText.substring(0, 5000)}
    `.trim();

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compliance-report-${fileName.replace(/\.[^/.]+$/, "")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleResume = async (resumeTaskId: string) => {
    setTaskId(resumeTaskId);
    setViewState("analyzing");
    setShowResumePrompt(false);
    toast.info("Resuming analysis...");
  };

  if (viewState === "analyzing") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AnalysisProgress
          stage={analyzingSubState}
          progress={progress}
          elapsedTime={elapsedTime}
        />
        {isOffline && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
            <p className="font-medium">You are offline</p>
            <p className="text-sm">Analysis will resume when you reconnect.</p>
          </div>
        )}
        {taskId && (
          <p className="text-sm text-muted-foreground">Task ID: {taskId}</p>
        )}
      </div>
    );
  }

  if (viewState === "review" && result) {
    return (
      <ParallelReviewView
        complianceResult={result}
        extractedText={extractedText}
        fileName={fileName}
        onApprove={handleApprove}
        onEdit={handleEdit}
        onBack={handleBack}
        onDownload={handleDownload}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {showResumePrompt && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="font-medium text-blue-900">
            Resume incomplete analysis?
          </p>
          <p className="text-sm text-blue-700 mb-3">
            You have an incomplete analysis task. Would you like to resume it?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleResume(taskId || "")}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Resume
            </button>
            <button
              onClick={() => setShowResumePrompt(false)}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold">Draft Packet Compliance Analysis</h1>
        <p className="text-muted-foreground">
          Upload a draft hearing packet to analyze it for SOP compliance
        </p>
      </div>

      <DraftUploadPanel onUpload={handleUpload} isUploading={false} />

      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <h3 className="font-medium mb-2">How it works</h3>
        <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
          <li>
            Upload a PDF or Word document containing your draft hearing packet
          </li>
          <li>
            Our AI will extract the text and analyze it against the SOP
            requirements
          </li>
          <li>Review any compliance issues and recommendations</li>
          <li>Approve the draft to continue with the workflow</li>
        </ol>
      </div>
    </div>
  );
}
