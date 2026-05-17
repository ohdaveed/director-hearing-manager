/**
 * SOP Compliance Checking Types
 *
 * Defines the data structures for analyzing draft packets against
 * the Director Hearing Packet Standard Operating Procedure.
 */

/** Severity level for compliance issues */
export type ComplianceSeverity = "critical" | "major" | "minor" | "info";

/** Category of compliance issue */
export type ComplianceCategory =
  | "missing_section"
  | "incorrect_sequence"
  | "formatting"
  | "content"
  | "missing_element";

/** A single compliance issue found in the draft */
export interface ComplianceIssue {
  id: string;
  category: ComplianceCategory;
  severity: ComplianceSeverity;
  description: string;
  location?: string;
  suggestion: string;
  reference?: string;
}

/** Overall compliance result */
export interface ComplianceResult {
  isCompliant: boolean;
  score: number;
  issues: ComplianceIssue[];
  summary: string;
  missingSections: string[];
  recommendations: string[];
}

/** Input for compliance analysis */
export interface ComplianceAnalysisInput {
  extractedText: string;
  fileName: string;
  fileType: "pdf" | "docx";
}

/** AI analysis request */
export interface AnalyzePacketRequest {
  text: string;
  fileName: string;
  fileType: "pdf" | "docx";
}
