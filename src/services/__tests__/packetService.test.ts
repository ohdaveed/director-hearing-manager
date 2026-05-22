import { describe, it, expect, vi, beforeEach } from "vite-plus/test";
import { packetService } from "../packetService";
import { supabase } from "@/lib/supabase";
import type { ComplianceResult } from "@/types/compliance";
import type { PacketData } from "../packetMapperService";

type MockFn = ReturnType<typeof vi.fn>;
type MockSupabase = {
  from: MockFn;
  update: MockFn;
  insert: MockFn;
  eq: MockFn;
  is: MockFn;
  order: MockFn;
  limit: MockFn;
  maybeSingle: MockFn;
  select: MockFn;
  single: MockFn;
  storage?: {
    from: MockFn;
    upload: MockFn;
    getPublicUrl: MockFn;
  };
};

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id: "123" }, error: null }),
  },
}));

// Supabase is mocked above with the chainable subset this service exercises.
const mockSupabase = supabase as unknown as MockSupabase;

describe("packetService.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null });
    mockSupabase.single.mockResolvedValue({
      data: { id: "packet-1", packet_status: "Not Started" },
      error: null,
    });
  });

  it("creates a draft packet with complaint context", async () => {
    await packetService.create("complaint-1", {
      hearingDate: "2026-06-01",
      assignedTo: "Inspector One",
      caseNumber: "HHP-26-001",
    });

    expect(mockSupabase.insert).toHaveBeenCalledWith([
      expect.objectContaining({
        legacy_complaint_ref: "complaint-1",
        complaint_id: "complaint-1",
        packet_status: "Not Started",
        packet_type: "Draft",
        hearing_date: "2026-06-01",
        assigned_to: "Inspector One",
        case_number: "HHP-26-001",
      }),
    ]);
  });

  it("returns an existing packet instead of creating a duplicate", async () => {
    mockSupabase.maybeSingle.mockResolvedValueOnce({
      data: { id: "existing-packet", packet_status: "In Progress" },
      error: null,
    });

    const result = await packetService.create("complaint-1");

    expect(result.id).toBe("existing-packet");
    expect(mockSupabase.insert).not.toHaveBeenCalled();
  });
});

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

    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        case_number: "CASE-123",
        packet_status: "In Progress",
      }),
    );

    const callArgs = mockSupabase.update.mock.calls[0][0];
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

    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        case_number: "CASE-456",
        packet_status: "Under Review",
      }),
    );

    const callArgs = mockSupabase.update.mock.calls[0][0];
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
    mockSupabase.storage = {
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
    mockSupabase.single.mockResolvedValueOnce({
      data: { notes: "Existing notes" },
      error: null,
    });

    const url = await packetService.generateAndStorePdf(packetId, mockBlob);

    expect(url).toBe("https://test.com/packet.pdf");
    expect(mockSupabase.storage?.from).toHaveBeenCalledWith("documents");
    expect(mockSupabase.storage?.upload).toHaveBeenCalledWith(
      expect.stringContaining(`packets/${packetId}/final_packet_`),
      mockBlob,
      expect.any(Object),
    );

    expect(mockSupabase.from).toHaveBeenCalledWith("hearing_packets");
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        notes: expect.stringContaining("[FINAL_PDF_URL]"),
      }),
    );
  });
});
