import { describe, it, expect } from "vite-plus/test";
import { packetMapperService } from "../packetMapperService";
import type { ComplianceResult } from "@/types/compliance";

const mockCompliantResult: ComplianceResult = {
  isCompliant: true,
  score: 95,
  issues: [],
  summary: "Packet is compliant",
  missingSections: [],
  recommendations: [],
};

const mockNonCompliantResult: ComplianceResult = {
  isCompliant: false,
  score: 45,
  issues: [
    {
      id: "1",
      category: "missing_section",
      severity: "critical",
      description: "Chronology section not found",
      suggestion: "Add Chronology section",
      reference: "SOP Section 3",
    },
    {
      id: "2",
      category: "missing_element",
      severity: "major",
      description: "Proof of Service missing",
      suggestion: "Add Proof of Service",
      reference: "SOP Section 5",
    },
  ],
  summary: "Missing critical sections",
  missingSections: ["Chronology", "Proof of Service"],
  recommendations: ["Add Chronology", "Add Proof of Service"],
};

describe("packetMapperService", () => {
  describe("extractPacketData", () => {
    it("should extract data from compliant result", () => {
      const result = packetMapperService.extractPacketData(
        mockCompliantResult,
        "Case_123_draft.pdf",
      );

      expect(result.caseNumber).toBe("CASE-123");
      expect(result.enforcementSummary).toBe(
        "Packet is compliant with SOP requirements",
      );
      expect(result.violations).toEqual([]);
    });

    it("should handle file name without case number", () => {
      const result = packetMapperService.extractPacketData(
        mockCompliantResult,
        "draft_packet.pdf",
      );

      expect(result.caseNumber).toBeUndefined();
    });

    it("should add chronology entry for non-compliant packets", () => {
      const result = packetMapperService.extractPacketData(
        mockNonCompliantResult,
        "case_456.pdf",
      );

      expect(result.caseNumber).toBe("CASE-456");
      expect(result.chronology).toHaveLength(1);
      expect(result.chronology?.[0].entryType).toBe("upload");
    });

    it("should extract missing exhibits from issues", () => {
      const result = packetMapperService.extractPacketData(
        mockNonCompliantResult,
        "case_789.pdf",
      );

      expect(result.exhibits).toHaveLength(1);
      expect(result.exhibits?.[0].label).toBe("Service Proof");
    });

    it("should set appropriate summary for non-compliant packets", () => {
      const result = packetMapperService.extractPacketData(
        mockNonCompliantResult,
        "test.pdf",
      );

      expect(result.enforcementSummary).toContain("requires attention");
      expect(result.enforcementSummary).toContain("2 issues found");
    });
  });

  describe("generateMissingSectionReport", () => {
    it("should generate report for missing sections", () => {
      const report = packetMapperService.generateMissingSectionReport([
        "Chronology",
        "Proof of Service",
      ]);

      expect(report.chronology).toBe("Missing required section: Chronology");
      expect(report.proof_of_service).toBe(
        "Missing required section: Proof of Service",
      );
    });

    it("should handle empty missing sections", () => {
      const report = packetMapperService.generateMissingSectionReport([]);

      expect(Object.keys(report)).toHaveLength(0);
    });
  });
});
