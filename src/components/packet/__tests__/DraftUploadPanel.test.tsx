import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vite-plus/test";
import DraftUploadPanel from "../DraftUploadPanel";

vi.mock("@/services/pdfService", () => ({
  pdfService: { extractText: vi.fn().mockResolvedValue("Extracted PDF text") },
}));

vi.mock("@/services/wordService", () => ({
  wordService: {
    extractText: vi.fn().mockResolvedValue("Extracted Word text"),
  },
}));

describe("DraftUploadPanel", () => {
  it("renders a file input that accepts .pdf and .docx", () => {
    render(<DraftUploadPanel onUpload={vi.fn()} isUploading={false} />);
    const fileInput = screen.getByLabelText(/Upload Draft Packet/i);
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute("accept", ".pdf,.docx");
    expect(fileInput).toHaveAttribute("type", "file");
  });

  it("calls onUpload with the selected file and extracted text", async () => {
    const mockOnUpload = vi.fn();
    render(<DraftUploadPanel onUpload={mockOnUpload} isUploading={false} />);

    const file = new File(["dummy content"], "draft.pdf", {
      type: "application/pdf",
    });
    const fileInput = screen.getByLabelText(/Upload Draft Packet/i);

    fireEvent.change(fileInput, { target: { files: [file] } });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockOnUpload).toHaveBeenCalledTimes(1);
    expect(mockOnUpload).toHaveBeenCalledWith(file, "Extracted PDF text");
  });

  it("shows loading state when isUploading is true", () => {
    render(<DraftUploadPanel onUpload={vi.fn()} isUploading={true} />);
    expect(screen.getByText("Uploading...")).toBeInTheDocument();

    const selectButton = screen.getByRole("button", { name: /Select File/i });
    expect(selectButton).toBeDisabled();
  });

  it("shows extracting state when extracting text", async () => {
    const mockOnUpload = vi.fn();
    render(<DraftUploadPanel onUpload={mockOnUpload} isUploading={false} />);

    const file = new File(["dummy content"], "draft.pdf", {
      type: "application/pdf",
    });
    const fileInput = screen.getByLabelText(/Upload Draft Packet/i);

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByText("Extracting...")).toBeInTheDocument();
  });
});
