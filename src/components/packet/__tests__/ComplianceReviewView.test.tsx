import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach } from "vite-plus/test";
import { render, screen, fireEvent } from "@testing-library/react";
import ComplianceReviewView from "../ComplianceReviewView";
import type { ComplianceResult } from "@/types/compliance";

const mockComplianceResult: ComplianceResult = {
  isCompliant: false,
  score: 65,
  issues: [
    {
      id: "issue_1",
      category: "missing_section",
      severity: "major",
      description: "Chronology section not found",
      location: "After Enforcement Summary",
      suggestion: "Add Chronology section with timeline",
      reference: "SOP Section 3",
    },
    {
      id: "issue_2",
      category: "missing_element",
      severity: "critical",
      description: "Proof of Service missing",
      location: "Exhibit E Bundle",
      suggestion: "Add Proof of Service document",
      reference: "SOP Section 5",
    },
  ],
  summary: "Missing critical sections",
  missingSections: ["Chronology", "Proof of Service"],
  recommendations: ["Add Chronology section", "Include Proof of Service"],
};

describe("ComplianceReviewView", () => {
  const mockOnApprove = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render compliance score and summary", () => {
    render(
      <ComplianceReviewView
        complianceResult={mockComplianceResult}
        extractedText="Draft packet content..."
        fileName="draft.pdf"
        onApprove={mockOnApprove}
        onEdit={mockOnEdit}
        onBack={mockOnBack}
      />,
    );

    expect(screen.getByText(/Compliance Score/i)).toBeInTheDocument();
    expect(screen.getByText("65")).toBeInTheDocument();
    expect(screen.getByText("Non-Compliant")).toBeInTheDocument();
  });

  it("should render missing sections list", () => {
    render(
      <ComplianceReviewView
        complianceResult={mockComplianceResult}
        extractedText="Draft packet content..."
        fileName="draft.pdf"
        onApprove={mockOnApprove}
        onEdit={mockOnEdit}
        onBack={mockOnBack}
      />,
    );

    expect(screen.getByText("Chronology")).toBeInTheDocument();
    expect(screen.getByText("Proof of Service")).toBeInTheDocument();
  });

  it("should render compliance issues with severity indicators", () => {
    render(
      <ComplianceReviewView
        complianceResult={mockComplianceResult}
        extractedText="Draft packet content..."
        fileName="draft.pdf"
        onApprove={mockOnApprove}
        onEdit={mockOnEdit}
        onBack={mockOnBack}
      />,
    );

    expect(
      screen.getByText("Chronology section not found"),
    ).toBeInTheDocument();
    expect(screen.getByText("Proof of Service missing")).toBeInTheDocument();
  });

  it("should call onBack when back button is clicked", () => {
    render(
      <ComplianceReviewView
        complianceResult={mockComplianceResult}
        extractedText="Draft packet content..."
        fileName="draft.pdf"
        onApprove={mockOnApprove}
        onEdit={mockOnEdit}
        onBack={mockOnBack}
      />,
    );

    fireEvent.click(screen.getByText(/Back/i));
    expect(mockOnBack).toHaveBeenCalled();
  });

  it("should call onEdit when edit button is clicked", () => {
    render(
      <ComplianceReviewView
        complianceResult={mockComplianceResult}
        extractedText="Draft packet content..."
        fileName="draft.pdf"
        onApprove={mockOnApprove}
        onEdit={mockOnEdit}
        onBack={mockOnBack}
      />,
    );

    fireEvent.click(screen.getByText(/Edit Draft/i));
    expect(mockOnEdit).toHaveBeenCalled();
  });

  it("should call onApprove when approve button is clicked", () => {
    render(
      <ComplianceReviewView
        complianceResult={mockComplianceResult}
        extractedText="Draft packet content..."
        fileName="draft.pdf"
        onApprove={mockOnApprove}
        onEdit={mockOnEdit}
        onBack={mockOnBack}
      />,
    );

    fireEvent.click(screen.getByText(/Approve & Continue/i));
    expect(mockOnApprove).toHaveBeenCalled();
  });

  it("should show original text in expandable section", () => {
    render(
      <ComplianceReviewView
        complianceResult={mockComplianceResult}
        extractedText="Draft packet content..."
        fileName="draft.pdf"
        onApprove={mockOnApprove}
        onEdit={mockOnEdit}
        onBack={mockOnBack}
      />,
    );

    expect(screen.getByText(/View Original Text/i)).toBeInTheDocument();
  });
});
