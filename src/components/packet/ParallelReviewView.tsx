import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ComplianceReviewView from "./ComplianceReviewView";
import type { ComplianceResult } from "@/types/compliance";

// Set worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.js`;

interface ParallelReviewViewProps {
  complianceResult: ComplianceResult;
  extractedText: string;
  fileName: string;
  onApprove: () => void;
  onEdit: () => void;
  onBack: () => void;
  onDownload?: () => void;
  onGenerateCorrected?: () => void;
}

export default function ParallelReviewView({
  complianceResult,
  extractedText,
  fileName,
  onApprove,
  onEdit,
  onBack,
  onDownload,
  onGenerateCorrected,
}: ParallelReviewViewProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pdfError, setPdfError] = useState<string | null>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPdfError(null);
  }

  function onDocumentLoadError(error: Error) {
    console.error("PDF load error:", error);
    setPdfError("Failed to load PDF. Displaying text view instead.");
  }

  function goToPrevPage() {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  }

  function goToNextPage() {
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  }

  const isPdf = fileName.toLowerCase().endsWith(".pdf");

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-6 h-screen">
      {/* Left Panel - PDF/Text Viewer */}
      <div className="flex flex-col border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b bg-muted/50">
          <h3 className="font-semibold">Document Preview</h3>
          <span className="text-sm text-muted-foreground">{fileName}</span>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {isPdf && !pdfError ? (
            <div className="flex flex-col items-center">
              <Document
                file={extractedText} // Note: In real implementation, this would be the actual PDF URL
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="text-muted-foreground">Loading PDF...</div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="shadow-lg"
                />
              </Document>

              {numPages > 0 && (
                <div className="flex items-center gap-4 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPrevPage}
                    disabled={pageNumber <= 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm">
                    Page {pageNumber} of {numPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={pageNumber >= numPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="whitespace-pre-wrap text-sm font-mono bg-muted p-4 rounded">
              {extractedText}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Analysis Results */}
      <div className="flex flex-col overflow-hidden">
        <ComplianceReviewView
          complianceResult={complianceResult}
          extractedText={extractedText}
          fileName={fileName}
          onApprove={onApprove}
          onEdit={onEdit}
          onBack={onBack}
          onDownload={onDownload}
          onGenerateCorrected={onGenerateCorrected}
        />
      </div>
    </div>
  );
}
