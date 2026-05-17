import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DraftUploadPanel from "@/components/packet/DraftUploadPanel";
import ParallelReviewView from "@/components/packet/ParallelReviewView";
import AnalysisProgress from "@/components/packet/AnalysisProgress";
import { aiService } from "@/services/aiService";
import type { ComplianceResult } from "@/types/compliance";

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
  const [elapsedTime, setElapsedTime] = useState(0);
  const [result, setResult] = useState<ComplianceResult | undefined>();

  const handleUpload = async (file: File, text: string) => {
    setExtractedText(text);
    setFileName(file.name);
    setViewState("analyzing");
    setAnalyzingSubState("queuing");
    setElapsedTime(0);

    const timer = setInterval(() => setElapsedTime((t) => t + 1), 1000);

    try {
      setAnalyzingSubState("processing");
      const complianceResult = await aiService.analyzePacketCompliance(
        text,
        file.name,
      );
      setResult(complianceResult);
      setViewState("review");
    } catch (err) {
      console.error("Failed to analyze packet:", err);
      toast.error("Analysis failed. Please try again.");
      setViewState("upload");
    } finally {
      clearInterval(timer);
    }
  };

  const handleBack = () => {
    setViewState("upload");
    setExtractedText("");
    setFileName("");
    setElapsedTime(0);
    setResult(undefined);
  };

  const handleEdit = () => {
    setViewState("upload");
  };

  const handleApprove = () => {
    toast.success("Packet approved!");
    navigate("/enforcement/hearings");
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

  if (viewState === "analyzing") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AnalysisProgress
          stage={analyzingSubState}
          progress={0}
          elapsedTime={elapsedTime}
        />
      </div>
    );
  }

  if (viewState === "review" && result !== undefined) {
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
