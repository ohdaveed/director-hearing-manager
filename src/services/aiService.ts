import Anthropic from "@anthropic-ai/sdk";
import {
  SFHC_ARTICLE_11_CODES,
  isValidArticle11Code,
} from "@/utils/sfhcArticle11";
import {
  getStandardsForViolationCode,
  buildStandardsPromptBlock,
} from "@/utils/directorsRulesStandards";
import type { ComplianceResult } from "@/types/compliance";

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || "mock_key",
  dangerouslyAllowBrowser: true,
} as any);

export const aiService = {
  async extractViolations(reportText: string) {
    const systemPrompt = `
You are an expert San Francisco Department of Public Health inspector.
Your task is to analyze inspection report text and extract structured violation data.

RULES:
1. ONLY use San Francisco Health Code Article 11 citation codes.
2. For each violation, identify the code (e.g., § 581(b)(13)), the observation, and a suggested corrective action.
3. Use pre-authorized regulatory language for corrective actions where applicable.

ALLOWED CODES:
${SFHC_ARTICLE_11_CODES.map((c) => `- ${c.code}: ${c.label}`).join("\n")}

RESPONSE FORMAT:
Return a JSON array of objects:
[{ "code": "§ 581(b)(13)", "observation": "...", "correctiveAction": "..." }]
`;

    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: reportText }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      try {
        // Find JSON in the response
        const jsonMatch = content.text.match(/\[.*\]/s);
        if (jsonMatch) {
          const rawViolations = JSON.parse(jsonMatch[0]);

          // Filter for valid Article 11 codes only
          const validViolations = rawViolations.filter((v: any) =>
            isValidArticle11Code(v.code),
          );

          // Post-process to add standards
          return validViolations.map((v: any) => {
            const standards = getStandardsForViolationCode(v.code);
            const standardsPrompt = buildStandardsPromptBlock(standards);
            return {
              ...v,
              regulatoryStandards: standardsPrompt,
            };
          });
        }
      } catch (e) {
        console.error("Failed to parse AI response", e);
      }
    }

    return [];
  },

  async analyzePacketCompliance(
    text: string,
    fileName: string,
  ): Promise<ComplianceResult> {
    const systemPrompt = `
You are an expert at analyzing Director Hearing Packets for compliance with SF Health Department Standard Operating Procedures.

Your task is to analyze draft hearing packet documents and identify compliance issues against the SOP requirements.

DIRECTOR HEARING PACKET SOP SEQUENCE:
1. Cover Page - Case identification, respondent info, hearing date/time/location
2. Enforcement Summary - Violation overview, history, recommended action
3. Chronology - Timeline of events with Hearing Order Proposal at bottom
4. Inspection Exhibits (A, B, C...) - Photos, reports, observations
5. Exhibit E Bundle - Notice of Hearing, Notice of Violation, Proof of Service

RULES FOR COMPLIANCE CHECKING:
1. Check for all required sections in the correct sequence
2. Verify each section contains necessary elements
3. Identify missing or incorrect content
4. Flag formatting issues that would affect legal validity

RESPONSE FORMAT:
Return a JSON object with this structure:
{
  "isCompliant": boolean,
  "score": number (0-100),
  "issues": [
    {
      "id": "string",
      "category": "missing_section" | "incorrect_sequence" | "formatting" | "content" | "missing_element",
      "severity": "critical" | "major" | "minor" | "info",
      "description": "string",
      "location": "string (optional - where in document)",
      "suggestion": "string",
      "reference": "string (optional - SOP reference)"
    }
  ],
  "summary": "string",
  "missingSections": ["string array of missing section names"],
  "recommendations": ["string array of suggested fixes"]
}

Be thorough - check every required section and element.
`;

    try {
      const response = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Analyze this draft hearing packet for SOP compliance.\n\nFile: ${fileName}\n\nDocument content:\n${text}`,
          },
        ],
      });

      const content = response.content[0];
      if (content.type === "text") {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]) as ComplianceResult;
          return result;
        }
      }
    } catch (error) {
      console.error("Error analyzing packet compliance:", error);
    }

    return {
      isCompliant: false,
      score: 0,
      issues: [],
      summary: "Failed to analyze document",
      missingSections: [],
      recommendations: ["Please try again or manually verify compliance"],
    };
  },

  async generateCorrectedPacket(
    text: string,
    complianceResult: ComplianceResult,
  ): Promise<string> {
    const systemPrompt = `
You are an expert at editing Director Hearing Packets to ensure they comply with SF Health Department Standard Operating Procedures.

You will be provided with the original text of a draft hearing packet and a list of compliance issues and recommendations identified by an auditor.
Your job is to rewrite the hearing packet text, incorporating the recommended changes, fixing formatting, and adding any missing elements or sections as instructed.

Return the fully corrected hearing packet text in clean markdown. 
Do not include conversational preamble. Just the raw, corrected document text.
`;

    try {
      const response = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Original Document Text:\n\n${text}\n\nCompliance Report:\n\n${JSON.stringify(complianceResult, null, 2)}\n\nPlease provide the corrected document text.`,
          },
        ],
      });

      const content = response.content[0];
      if (content.type === "text") {
        return content.text;
      }
    } catch (error) {
      console.error("Error generating corrected packet:", error);
    }

    throw new Error("Failed to generate corrected packet.");
  },
};
