import { describe, it, expect, vi } from "vite-plus/test";
import { aiService } from "../aiService";

// Mock Anthropic
const { mockMessagesCreate } = vi.hoisted(() => ({
  mockMessagesCreate: vi.fn(),
}));

vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class {
      messages = {
        create: mockMessagesCreate,
      };
    },
  };
});

describe("aiService", () => {
  it("should extract violations from inspection report text", async () => {
    const reportText =
      "INSPECTION REPORT\nFound rodent droppings. Citation: § 581(b)(13).";

    // Setup mock response
    mockMessagesCreate.mockResolvedValue({
      id: "msg_123",
      type: "message",
      role: "assistant",
      model: "claude-3-haiku-20240307",
      content: [
        {
          type: "text",
          text: '[{ "code": "§ 581(b)(13)", "observation": "Found rodent droppings", "correctiveAction": "Seal all holes" }]',
        },
      ],
      stop_reason: "end_turn",
      stop_sequence: null,
      usage: { input_tokens: 10, output_tokens: 20 },
    } as any);

    const violations = await aiService.extractViolations(reportText);

    expect(violations).toContainEqual(
      expect.objectContaining({
        code: "§ 581(b)(13)",
      }),
    );
    // Check if standards were added via post-processing
    expect(violations[0].regulatoryStandards).toContain(
      "STRUCTURAL GAPS & SEALING",
    );
  });

  it("should filter out non-Article 11 codes", async () => {
    const reportText = "Found state code violation: HSC 17920.";

    mockMessagesCreate.mockResolvedValue({
      id: "msg_456",
      type: "message",
      role: "assistant",
      model: "claude-3-haiku-20240307",
      content: [
        {
          type: "text",
          text: '[{ "code": "HSC 17920", "observation": "State code violation", "correctiveAction": "Fix it" }]',
        },
      ],
      stop_reason: "end_turn",
      stop_sequence: null,
      usage: { input_tokens: 10, output_tokens: 20 },
    } as any);

    const violations = await aiService.extractViolations(reportText);

    expect(violations).toHaveLength(0);
  });

  describe("analyzePacketCompliance", () => {
    it("should return compliance result from AI response", async () => {
      const draftText =
        "Director Hearing Packet\nCover Page: Case #123\nNotice of Violation";

      mockMessagesCreate.mockResolvedValue({
        id: "msg_compliance_123",
        type: "message",
        role: "assistant",
        model: "claude-3-haiku-20240307",
        content: [
          {
            type: "text",
            text: JSON.stringify({
              isCompliant: false,
              score: 75,
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
              ],
              summary: "Missing Chronology section",
              missingSections: ["Chronology", "Inspection Exhibits"],
              recommendations: ["Add Chronology section", "Include Exhibit A"],
            }),
          },
        ],
        stop_reason: "end_turn",
        stop_sequence: null,
        usage: { input_tokens: 100, output_tokens: 200 },
      } as any);

      const result = await aiService.analyzePacketCompliance(
        draftText,
        "draft_packet.pdf",
      );

      expect(result.isCompliant).toBe(false);
      expect(result.score).toBe(75);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].category).toBe("missing_section");
      expect(result.missingSections).toContain("Chronology");
      expect(result.recommendations).toHaveLength(2);
    });

    it("should return compliant result for complete packet", async () => {
      const completePacketText = `
        Cover Page: Case #123, Respondent: ABC Corp
        Enforcement Summary: Violation found, recommended fine
        Chronology: 2024-01-01 Initial inspection, 2024-01-15 Notice issued
        Exhibit A: Inspection photos
        Exhibit B: Inspection report
        Exhibit E: Notice of Hearing, Notice of Violation, Proof of Service
      `;

      mockMessagesCreate.mockResolvedValue({
        id: "msg_compliance_456",
        type: "message",
        role: "assistant",
        model: "claude-3-haiku-20240307",
        content: [
          {
            type: "text",
            text: JSON.stringify({
              isCompliant: true,
              score: 95,
              issues: [
                {
                  id: "issue_minor",
                  category: "formatting",
                  severity: "minor",
                  description: "Page numbering could be more consistent",
                  suggestion: "Add page numbers to all pages",
                  reference: "SOP Section 5",
                },
              ],
              summary: "Packet is compliant with minor suggestions",
              missingSections: [],
              recommendations: ["Consider adding page numbers"],
            }),
          },
        ],
        stop_reason: "end_turn",
        stop_sequence: null,
        usage: { input_tokens: 150, output_tokens: 100 },
      } as any);

      const result = await aiService.analyzePacketCompliance(
        completePacketText,
        "complete_packet.pdf",
      );

      expect(result.isCompliant).toBe(true);
      expect(result.score).toBe(95);
      expect(result.missingSections).toHaveLength(0);
    });

    it("should handle API errors gracefully", async () => {
      mockMessagesCreate.mockRejectedValue(new Error("API Error"));

      const result = await aiService.analyzePacketCompliance(
        "test content",
        "test.pdf",
      );

      expect(result.isCompliant).toBe(false);
      expect(result.score).toBe(0);
      expect(result.summary).toBe("Failed to analyze document");
      expect(result.recommendations).toContain(
        "Please try again or manually verify compliance",
      );
    });
  });
});

describe("generateCorrectedPacket", () => {
  it("should return the corrected packet text", async () => {
    const mockResult = {
      isCompliant: false,
      score: 50,
      issues: [],
      summary: "Needs work",
      missingSections: [],
      recommendations: ["Fix the cover page"],
    };

    mockMessagesCreate.mockResolvedValue({
      id: "msg_789",
      type: "message",
      role: "assistant",
      model: "claude-3-haiku-20240307",
      content: [
        {
          type: "text",
          text: "This is the corrected packet text.",
        },
      ],
      stop_reason: "end_turn",
      stop_sequence: null,
      usage: { input_tokens: 10, output_tokens: 20 },
    } as any);

    const result = await aiService.generateCorrectedPacket(
      "original text",
      mockResult,
    );
    expect(result).toBe("This is the corrected packet text.");
  });
});
