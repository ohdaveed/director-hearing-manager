import { useState } from "react";
import { Document, Page } from "react-pdf";
import { Button } from "@/components/ui/button";
import { X, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

interface PdfViewerModalProps {
  url: string;
  onClose: () => void;
}

export function PdfViewerModal({ url, onClose }: PdfViewerModalProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }

  function onDocumentLoadError(err: Error) {
    setLoading(false);
    setError(err.message);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-lg w-full max-w-4xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-foreground">PDF Viewer</h3>
          <div className="flex items-center gap-2">
            {numPages > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                  disabled={pageNumber <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span>
                  {pageNumber} / {numPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
                  disabled={pageNumber >= numPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading PDF...</span>
            </div>
          )}
          {error && (
            <div className="text-destructive text-center">
              <p className="font-semibold mb-1">Failed to load PDF</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={null}
          >
            <Page
              pageNumber={pageNumber}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="shadow-lg"
            />
          </Document>
        </div>
      </div>
    </div>
  );
}
