import { describe, it, expect, vi, beforeEach } from "vite-plus/test";
import { importService } from "../importService";
import { supabase } from "@/lib/supabase";
import { aiService } from "../aiService";

vi.mock("@/lib/supabase", () => {
  let lastOperation: string | null = null;

  const createThenable = (data: any, error: any = null) => Promise.resolve({ data, error });

  const chain = {
    from: vi.fn(() => {
      lastOperation = null;
      return chain;
    }),
    select: vi.fn(() => {
      if (lastOperation === "insert") {
        return createThenable([{ id: "chrono_1" }], null);
      }
      return chain;
    }),
    insert: vi.fn(() => {
      lastOperation = "insert";
      return chain;
    }),
    eq: vi.fn(() => chain),
    in: vi.fn(() => chain),
    is: vi.fn(() =>
      createThenable(
        [
          {
            inspection_id: "insp_1",
            inspection_date: "2026-04-15",
            inspector: "J. Smith",
            notes: "Rodent issues",
          },
        ],
        null,
      ),
    ),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  };

  return { supabase: chain };
});

vi.mock("../aiService", () => ({
  aiService: {
    extractViolations: vi.fn(),
  },
}));

vi.mock("../pdfService", () => ({
  pdfService: { extractText: vi.fn().mockResolvedValue("") },
}));

vi.mock("../wordService", () => ({
  wordService: { extractText: vi.fn().mockResolvedValue("") },
}));

describe("importService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should import inspection history without AI extraction", async () => {
    const packetId = "packet_123";
    const inspectionIds = ["insp_1"];

    // Mock packet fetch
    vi.mocked((supabase as any).single).mockResolvedValueOnce({
      data: {
        id: packetId,
        complaint_id: "complaint_1",
        legacy_complaint_ref: "legacy_complaint_1",
      },
      error: null,
    } as any);
    // Mock AI extraction
    vi.mocked(aiService.extractViolations).mockResolvedValue([
      {
        code: "§ 581(b)(13)",
        observation: "Rodents observed",
        correctiveAction: "Seal gaps",
      },
    ]);
    // Mock chronology insert
    vi.mocked((supabase as any).single).mockResolvedValueOnce({
      data: { id: "chrono_1" },
      error: null,
    } as any);

    const result = await importService.importInspectionHistory({
      packetId,
      inspectionIds,
    });

    expect(result.chronologyEntriesCreated).toBe(1);
    expect(result.exhibitsCreated).toBe(1);
    expect(aiService.extractViolations).not.toHaveBeenCalled();
    expect((supabase as any).insert).toHaveBeenNthCalledWith(
      1,
      expect.arrayContaining([
        expect.objectContaining({
          complaint_id: "complaint_1",
          legacy_complaint_ref: "legacy_complaint_1",
          legacy_inspection_ref: "insp_1",
          entry_type: "Inspection",
          summary: expect.stringContaining("J. Smith"),
        }),
      ]),
    );
    expect((supabase as any).insert).toHaveBeenNthCalledWith(
      2,
      expect.arrayContaining([
        expect.objectContaining({
          complaint_id: "complaint_1",
          legacy_complaint_ref: "legacy_complaint_1",
          legacy_inspection_ref: "insp_1",
          source_inspection_id: "insp_1",
          exhibit_type: "Inspection Report",
        }),
      ]),
    );
  });
});
