import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Download,
} from "lucide-react";
import type { ComplianceResult } from "@/types/compliance";

interface ComplianceReviewViewProps {
  complianceResult: ComplianceResult;
  extractedText: string;
  fileName: string;
  onApprove: () => void;
  onEdit: () => void;
  onBack: () => void;
  onDownload?: () => void;
  isLoading?: boolean;
  partial?: boolean;
}

const severityColors = {
  critical: "bg-red-100 text-red-800 border-red-200",
  major: "bg-orange-100 text-orange-800 border-orange-200",
  minor: "bg-yellow-100 text-yellow-800 border-yellow-200",
  info: "bg-blue-100 text-blue-800 border-blue-200",
};

const categoryLabels = {
  missing_section: "Missing Section",
  incorrect_sequence: "Incorrect Sequence",
  formatting: "Formatting",
  content: "Content Issue",
  missing_element: "Missing Element",
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded ${className}`} />;
}

export default function ComplianceReviewView({
  complianceResult,
  extractedText,
  fileName,
  onApprove,
  onEdit,
  onBack,
  onDownload,
  isLoading = false,
  partial = false,
}: ComplianceReviewViewProps) {
  const [showOriginalText, setShowOriginalText] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Compliance Review</h2>
          <p className="text-muted-foreground">File: {fileName}</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="border rounded-lg p-4">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Compliance Score
          </p>
          <div
            className={`text-4xl font-bold ${getScoreColor(complianceResult.score)}`}
          >
            {partial ? (
              <Skeleton className="h-10 w-20" />
            ) : (
              complianceResult.score
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">out of 100</p>
        </div>

        <div className="border rounded-lg p-4">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Status
          </p>
          {partial ? (
            <Skeleton className="h-10 w-32" />
          ) : complianceResult.isCompliant ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Compliant</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-semibold">Non-Compliant</span>
            </div>
          )}
        </div>

        <div className="border rounded-lg p-4">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Issues Found
          </p>
          <div className="text-4xl font-bold">
            {partial ? (
              <Skeleton className="h-10 w-20" />
            ) : (
              complianceResult.issues.length
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {partial ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              `${complianceResult.missingSections.length} missing sections`
            )}
          </p>
        </div>
      </div>

      {complianceResult.missingSections.length > 0 && (
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Missing Sections</h3>
          <div className="flex flex-wrap gap-2">
            {complianceResult.missingSections.map((section, index) => (
              <Badge key={index} variant="destructive">
                {section}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {complianceResult.issues.length > 0 && (
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Compliance Issues</h3>
          <div className="space-y-4">
            {complianceResult.issues.map((issue) => (
              <div
                key={issue.id}
                className={`p-4 rounded-lg border ${severityColors[issue.severity]}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {categoryLabels[issue.category]}
                      </Badge>
                      <span className="font-medium">{issue.description}</span>
                    </div>
                    {issue.location && (
                      <p className="text-sm text-muted-foreground mb-1">
                        Location: {issue.location}
                      </p>
                    )}
                    <p className="text-sm font-medium mt-2">
                      Suggestion: {issue.suggestion}
                    </p>
                    {issue.reference && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Reference: {issue.reference}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border rounded-lg p-4">
        <Button
          variant="ghost"
          className="w-full justify-between font-normal"
          onClick={() => setShowOriginalText(!showOriginalText)}
        >
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            View Original Text
          </span>
          {showOriginalText ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
        {showOriginalText && (
          <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg mt-2 max-h-96 overflow-y-auto">
            {extractedText}
          </pre>
        )}
      </div>

      {complianceResult.recommendations.length > 0 && (
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Recommendations</h3>
          <ul className="list-disc list-inside space-y-1">
            {complianceResult.recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-4 justify-between">
        <div>
          {onDownload && (
            <Button variant="outline" onClick={onDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download Analysis
            </Button>
          )}
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={onEdit}>
            Edit Draft
          </Button>
          <Button onClick={onApprove}>Approve & Continue</Button>
        </div>
      </div>
    </div>
  );
}
