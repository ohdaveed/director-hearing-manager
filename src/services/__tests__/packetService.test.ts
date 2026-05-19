import { describe, it, expect, vi, beforeEach } from "vite-plus/test";
import { packetService } from "../packetService";
import { supabase } from "@/lib/supabase";
import type { ComplianceResult } from "@/types/compliance";
import type { PacketData } from "../packetMapperService";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id: "123" }, error: null }),
  },
}));

describe("packetService.saveComplianceAnalysis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves mapped data correctly", async () => {
    const mockData = {
      extractedText: "test",
      complianceResult: {
        score: 100,
        isCompliant: true,
        issues: [],
        summary: "test summary",
        missingSections: [],
        recommendations: [],
      } as ComplianceResult,
      mappedData: {
        caseNumber: "CASE-123",
        enforcementSummary: "test summary",
        violations: [],
        chronology: [],
        exhibits: [],
      } as PacketData,
      analyzedAt: "2026-05-17T12:00:00Z",
    };

    await packetService.saveComplianceAnalysis("packet-1", mockData);

    expect((supabase as any).update).toHaveBeenCalledWith(
      expect.objectContaining({
        case_number: "CASE-123",
        packet_status: "In Progress",
      }),
    );

    const callArgs = ((supabase as any).update as any).mock.calls[0][0];
    expect(callArgs.notes).toContain("Score: 100");
    expect(callArgs.notes).toContain("Status: Compliant");
    expect(callArgs.notes).toContain("Issues: 0");
    expect(callArgs.notes).toContain("test summary");
  });

  it("sets status to Under Review when not compliant", async () => {
    const mockData = {
      extractedText: "test",
      complianceResult: {
        score: 70,
        isCompliant: false,
        issues: [
          {
            id: "1",
            description: "Missing section",
            category: "missing_section",
            severity: "critical",
            suggestion: "Add section",
          },
        ],
        summary: "failed summary",
        missingSections: ["Section A"],
        recommendations: [],
      } as ComplianceResult,
      mappedData: {
        caseNumber: "CASE-456",
        enforcementSummary: "failed summary",
        violations: [],
        chronology: [],
        exhibits: [],
      } as PacketData,
      analyzedAt: "2026-05-17T12:00:00Z",
    };

    await packetService.saveComplianceAnalysis("packet-2", mockData);

    expect((supabase as any).update).toHaveBeenCalledWith(
      expect.objectContaining({
        case_number: "CASE-456",
        packet_status: "Under Review",
      }),
    );

    const callArgs = ((supabase as any).update as any).mock.calls[0][0];
    expect(callArgs.notes).toContain("Score: 70");
    expect(callArgs.notes).toContain("Status: Non-Compliant");
    expect(callArgs.notes).toContain("Issues: 1");
    expect(callArgs.notes).toContain("failed summary");
  });
});

describe("packetService.generateAndStorePdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock storage and other necessary parts of supabase
    (supabase as any).storage = {
      from: vi.fn().mockReturnThis(),
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: "https://test.com/packet.pdf" },
      }),
    };
  });

  it("uploads PDF and updates packet notes", async () => {
    const mockBlob = new Blob(["test pdf content"], {
      type: "application/pdf",
    });
    const packetId = "packet-123";

    // Mock single() response for current notes
    (supabase as any).single.mockResolvedValueOnce({
      data: { notes: "Existing notes" },
      error: null,
    });

    const url = await packetService.generateAndStorePdf(packetId, mockBlob);

    expect(url).toBe("https://test.com/packet.pdf");
    expect((supabase as any).storage.from).toHaveBeenCalledWith("documents");
    expect((supabase as any).storage.upload).toHaveBeenCalledWith(
      expect.stringContaining(`packets/${packetId}/final_packet_`),
      mockBlob,
      expect.any(Object),
    );

    expect((supabase as any).from).toHaveBeenCalledWith("hearing_packets");
    expect((supabase as any).update).toHaveBeenCalledWith(
      expect.objectContaining({
        notes: expect.stringContaining("[FINAL_PDF_URL]"),
      }),
    );
  });
});
