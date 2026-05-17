import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DraftUploadPanel from "@/components/packet/DraftUploadPanel";
import ComplianceReviewView from "@/components/packet/ComplianceReviewView";
import { aiService } from "@/services/aiService";
import type { ComplianceResult } from "@/types/compliance";

type ViewState = "upload" | "analyzing" | "review";

export default function DraftPacketAnalysisPage() {
  const navigate = useNavigate();
  const [viewState, setViewState] = useState<ViewState>("upload");
  const [extractedText, setExtractedText] = useState("");
  const [fileName, setFileName] = useState("");
  const [complianceResult, setComplianceResult] =
    useState<ComplianceResult | null>(null);

  const isAnalyzing = viewState === "analyzing";

  const handleUpload = async (file: File, text: string) => {
    setExtractedText(text);
    setFileName(file.name);
    setViewState("analyzing");

    try {
      const result = await aiService.analyzePacketCompliance(text, file.name);
      setComplianceResult(result);
      setViewState("review");
    } catch (error) {
      console.error("Analysis failed:", error);
      setViewState("upload");
    }
  };

  const handleBack = () => {
    setViewState("upload");
    setExtractedText("");
    setFileName("");
    setComplianceResult(null);
  };

  const handleEdit = () => {
    setViewState("upload");
  };

  const handleApprove = () => {
    alert(
      "Approved! In a full implementation, this would save to the database and transition to the next workflow step.",
    );
    navigate("/hearing-packets");
  };

  const handleDownload = () => {
    if (!complianceResult) return;

    const report = `
DIRECTOR HEARING PACKET COMPLIANCE ANALYSIS
============================================
File: ${fileName}
Analyzed: ${new Date().toISOString()}

COMPLIANCE STATUS: ${complianceResult.isCompliant ? "COMPLIANT" : "NON-COMPLIANT"}
Score: ${complianceResult.score}/100

SUMMARY
-------
${complianceResult.summary}

MISSING SECTIONS
----------------
${
  complianceResult.missingSections.length > 0
    ? complianceResult.missingSections.join(", ")
    : "None"
}

ISSUES FOUND (${complianceResult.issues.length})
-----------------------------------------
${complianceResult.issues
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
${complianceResult.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join("\n")}

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
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        <p className="text-lg font-medium">
          Analyzing document for compliance...
        </p>
        <p className="text-sm text-muted-foreground">This may take a moment</p>
      </div>
    );
  }

  if (viewState === "review" && complianceResult) {
    return (
      <ComplianceReviewView
        complianceResult={complianceResult}
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

      <DraftUploadPanel onUpload={handleUpload} isUploading={isAnalyzing} />

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
