import type { ComplianceResult } from "@/types/compliance";

export interface PacketData {
  caseNumber?: string;
  respondentName?: string;
  hearingDate?: string;
  hearingTime?: string;
  hearingLocation?: string;
  violations: ViolationData[];
  chronology: ChronologyEntryData[];
  exhibits: ExhibitData[];
  enforcementSummary?: string;
}

export interface ViolationData {
  code: string;
  observation: string;
  correctiveAction: string;
}

export interface ChronologyEntryData {
  date: string;
  summary: string;
  entryType: string;
}

export interface ExhibitData {
  label: string;
  type: "photo" | "report" | "notice" | "proof";
  description: string;
}

export const packetMapperService = {
  extractPacketData(complianceResult: ComplianceResult, fileName: string): PacketData {
    const violations: ViolationData[] = [];
    const chronology: ChronologyEntryData[] = [];
    const exhibits: ExhibitData[] = [];

    const hasChronology = !complianceResult.missingSections.includes("Chronology");

    if (!hasChronology) {
      chronology.push({
        date: new Date().toISOString().split("T")[0],
        summary: "Draft packet uploaded and analyzed for compliance",
        entryType: "upload",
      });
    }

    for (const issue of complianceResult.issues) {
      if (issue.category === "missing_section" || issue.category === "missing_element") {
        if (
          issue.description.toLowerCase().includes("notice of violation") ||
          issue.description.toLowerCase().includes("notice of hearing")
        ) {
          exhibits.push({
            label: "NOH",
            type: "notice",
            description: "Notice of Hearing - required for hearing packet",
          });
        }
        if (issue.description.toLowerCase().includes("proof of service")) {
          exhibits.push({
            label: "Service Proof",
            type: "proof",
            description: "Proof of Service - required for hearing packet",
          });
        }
      }
    }

    const caseMatch = fileName.match(/case[_\s-]*(\d+)/i);
    const caseNumber = caseMatch ? `CASE-${caseMatch[1]}` : undefined;

    return {
      caseNumber,
      violations,
      chronology,
      exhibits,
      enforcementSummary: complianceResult.isCompliant
        ? "Packet is compliant with SOP requirements"
        : `Packet requires attention: ${complianceResult.issues.length} issues found`,
    };
  },

  generateMissingSectionReport(missingSections: string[]): Record<string, string> {
    const report: Record<string, string> = {};

    for (const section of missingSections) {
      const sectionKey = section.toLowerCase().replace(/\s+/g, "_");
      report[sectionKey] = `Missing required section: ${section}`;
    }

    return report;
  },
};
