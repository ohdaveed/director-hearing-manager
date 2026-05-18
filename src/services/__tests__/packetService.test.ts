import { describe, it, expect, vi, beforeEach } from "vite-plus/test";
import { packetService } from "../packetService";
import { supabase } from "@/lib/supabase";

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
        summary: "test",
        missingSections: [],
        recommendations: [],
      },
      mappedData: {
        caseNumber: "CASE-123",
        enforcementSummary: "test summary",
      },
      analyzedAt: new Date().toISOString(),
    };

    await packetService.saveComplianceAnalysis("packet-1", mockData);

    expect((supabase as any).update).toHaveBeenCalledWith(
      expect.objectContaining({
        case_number: "CASE-123",
      }),
    );
  });
});
