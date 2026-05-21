import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DraftUploadPanel from "@/components/packet/DraftUploadPanel";
import ParallelReviewView from "@/components/packet/ParallelReviewView";
import AnalysisProgress from "@/components/packet/AnalysisProgress";
import { aiService } from "@/services/aiService";
import { packetService } from "@/services/packetService";
import { packetMapperService } from "@/services/packetMapperService";
import { documentService } from "@/services/documentService";
import type { ComplianceResult } from "@/types/compliance";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type ViewState = "upload" | "analyzing" | "review" | "generating" | "corrected";
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
  const [correctedText, setCorrectedText] = useState("");
  const [documentId, setDocumentId] = useState<string | null>(null);

  const handleUpload = async (file: File, text: string) => {
    setExtractedText(text);
    setFileName(file.name);
    setViewState("analyzing");
    setAnalyzingSubState("queuing");
    setElapsedTime(0);

    const timer = setInterval(() => setElapsedTime((t) => t + 1), 1000);

    try {
      setAnalyzingSubState("polling");
      const doc = await documentService.uploadDocument(
        file,
        "Draft Hearing Packet",
      );
      setDocumentId(doc.id);

      setAnalyzingSubState("processing");
      const complianceResult = await aiService.analyzePacketCompliance(
        text,
        file.name,
      );

      await documentService.saveParsedContent(doc.id, {
        rawText: text,
        structuredData: complianceResult,
        aiModel: "claude-3-haiku-20240307",
      });

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

  const handleGenerateCorrected = async () => {
    if (!result || !documentId) return;
    setViewState("generating");
    try {
      const newText = await aiService.generateCorrectedPacket(
        extractedText,
        result,
      );

      await documentService.saveParsedContent(documentId, {
        rawText: newText,
        structuredData: { ...result, type: "corrected_version" },
        aiModel: "claude-3-haiku-20240307",
      });

      setCorrectedText(newText);
      setViewState("corrected");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate corrected packet.");
      setViewState("review");
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

  const handleApprove = async () => {
    if (!result) return;

    try {
      toast.loading("Creating packet from analysis...", {
        id: "approve-packet",
      });

      const mappedData = packetMapperService.extractPacketData(
        result,
        fileName,
      );

      let complaintId = "";
      if (mappedData.caseNumber) {
        const cleanCase = mappedData.caseNumber.replace("CASE-", "");
        const { data: complaints } = await supabase
          .from("complaints")
          .select("id")
          .ilike("legacy_complaint_id", `%${cleanCase}%`)
          .limit(1);

        if (complaints && complaints.length > 0) {
          complaintId = complaints[0].id;
        }
      }

      if (!complaintId) {
        toast.error("Could not find a linked complaint for this case number.", {
          id: "approve-packet",
        });
        navigate("/hearings");
        return;
      }

      const packet = await packetService.create(complaintId);

      if (packet && packet.id) {
        await packetService.saveComplianceAnalysis(packet.id, {
          extractedText,
          complianceResult: result,
          mappedData,
          analyzedAt: new Date().toISOString(),
        });

        toast.success("Packet created and analysis saved!", {
          id: "approve-packet",
        });
        navigate(`/hearings/${packet.id}`);
      } else {
        throw new Error("Failed to create packet");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save approved packet.", { id: "approve-packet" });
    }
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
        onGenerateCorrected={handleGenerateCorrected}
      />
    );
  }

  if (viewState === "generating") {
    return (
      <div className="max-w-2xl mx-auto p-12 text-center">
        <h2 className="text-2xl font-bold mb-4">
          Generating Corrected Packet...
        </h2>
        <p className="text-muted-foreground">
          The AI is applying the recommended changes to your draft packet.
        </p>
        <div className="mt-8 flex justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (viewState === "corrected") {
    return (
      <div className="max-w-6xl mx-auto p-6 flex flex-col h-screen">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold">Compliance-Corrected Draft</h2>
            <p className="text-muted-foreground text-sm">
              The AI has applied corrections based on the SOP compliance
              analysis.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewState("review")}
            >
              Back to Review
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const blob = new Blob([correctedText], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `corrected-${fileName.replace(/\.[^/.]+$/, "")}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="gap-2"
            >
              <Download className="w-4 h-4" /> Download Text
            </Button>
            <Button size="sm" onClick={handleApprove} className="gap-2">
              <CheckCircle className="w-4 h-4" /> Approve & Create Packet
            </Button>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
          <div className="lg:col-span-1 flex flex-col h-full overflow-hidden">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Applied Corrections
            </h3>
            <div className="flex-1 border rounded-lg bg-muted/30 p-4 overflow-y-auto">
              <ul className="space-y-4">
                {result?.issues.map((issue, i) => (
                  <li key={i} className="text-sm border-b pb-3 last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          issue.severity === "critical"
                            ? "bg-red-100 text-red-700"
                            : issue.severity === "major"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {issue.severity}
                      </span>
                      <span className="font-medium">{issue.category}</span>
                    </div>
                    <p className="text-muted-foreground mb-1 text-xs">
                      {issue.description}
                    </p>
                    <p className="text-emerald-600 text-xs font-medium">
                      ✓ Suggestion applied: {issue.suggestion}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col h-full overflow-hidden">
            <h3 className="text-sm font-semibold mb-2">
              Corrected Document Preview
            </h3>
            <div className="flex-1 bg-white border rounded-lg shadow-inner p-8 overflow-y-auto font-serif text-sm leading-relaxed">
              <pre className="whitespace-pre-wrap font-serif">
                {correctedText}
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/hearings")}
            className="p-0 h-auto hover:bg-transparent text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Hearings
          </Button>
        </div>
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
