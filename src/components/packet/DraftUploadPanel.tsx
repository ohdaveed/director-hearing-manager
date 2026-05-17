import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UploadCloud } from "lucide-react";
import { pdfService } from "@/services/pdfService";
import { wordService } from "@/services/wordService";

interface DraftUploadPanelProps {
  onUpload: (file: File, extractedText: string) => void;
  isUploading: boolean;
}

export default function DraftUploadPanel({
  onUpload,
  isUploading,
}: DraftUploadPanelProps) {
  const [extracting, setExtracting] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtracting(true);
    try {
      let extractedText = "";

      if (
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
      ) {
        extractedText = await pdfService.extractText(file);
      } else if (
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.name.toLowerCase().endsWith(".docx")
      ) {
        extractedText = await wordService.extractText(file);
      } else {
        throw new Error(
          "Unsupported file type. Please upload a PDF or Word document.",
        );
      }

      onUpload(file, extractedText);
    } catch (error) {
      console.error("Error extracting text:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to extract text from file",
      );
    } finally {
      setExtracting(false);
    }
  };

  const isProcessing = isUploading || extracting;

  return (
    <div className="flex flex-col gap-4 p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/10 items-center justify-center text-center">
      <div className="flex flex-col items-center gap-2">
        <div className="p-3 bg-primary/10 rounded-full text-primary">
          {isProcessing ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <UploadCloud className="w-6 h-6" />
          )}
        </div>
        <div className="space-y-1">
          <Label
            htmlFor="draft-upload"
            className="text-base font-semibold cursor-pointer"
          >
            {isProcessing
              ? extracting
                ? "Extracting text..."
                : "Uploading..."
              : "Upload Draft Packet"}
          </Label>
          <p className="text-sm text-muted-foreground">
            Select a PDF or Word Document (.docx)
          </p>
        </div>
      </div>

      <Input
        id="draft-upload"
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={handleFileChange}
        disabled={isProcessing}
      />

      <Button
        variant="outline"
        onClick={() => document.getElementById("draft-upload")?.click()}
        disabled={isProcessing}
      >
        {extracting ? "Extracting..." : "Select File"}
      </Button>
    </div>
  );
}
