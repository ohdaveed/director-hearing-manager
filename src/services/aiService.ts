import Anthropic from '@anthropic-ai/sdk';
import { SFHC_ARTICLE_11_CODES, isValidArticle11Code } from '@/utils/sfhcArticle11';
import { getStandardsForViolationCode, buildStandardsPromptBlock } from '@/utils/directorsRulesStandards';

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || 'mock_key',
});

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
${SFHC_ARTICLE_11_CODES.map(c => `- ${c.code}: ${c.label}`).join('\n')}

RESPONSE FORMAT:
Return a JSON array of objects:
[{ "code": "§ 581(b)(13)", "observation": "...", "correctiveAction": "..." }]
`;

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: reportText }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      try {
        // Find JSON in the response
        const jsonMatch = content.text.match(/\[.*\]/s);
        if (jsonMatch) {
          const rawViolations = JSON.parse(jsonMatch[0]);
          
          // Filter for valid Article 11 codes only
          const validViolations = rawViolations.filter((v: any) => isValidArticle11Code(v.code));
          
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
        console.error('Failed to parse AI response', e);
      }
    }

    return [];
  }
};