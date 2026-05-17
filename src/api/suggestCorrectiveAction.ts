import { z } from 'zod';
import { createEndpoint } from 'zite-integrations-backend-sdk';
import Anthropic from '@anthropic-ai/sdk';
import { AI_EXCLUSION_DIRECTIVES } from '../utils/validationRules';
import {
  getStandardsForViolationCode,
  buildStandardsPromptBlock,
} from '../utils/directorsRulesStandards';

export default createEndpoint({
  description:
    'Suggests a corrective action for a given inspection violation, guided by pre-authorized ' +
    'regulatory metrics from the Director\'s Rules and Regulations.',
  inputSchema: z.object({
    violation: z.string(),
    /** Optional SFHC code string (e.g. "Article 11 § 581(b)(13)") used to look up matched standards. */
    violationCode: z.string().optional(),
  }),
  outputSchema: z.object({
    correctiveAction: z.string(),
  }),
  execute: async ({ input }) => {
    const client = new Anthropic({ apiKey: process.env.ZITE_ANTHROPIC_ACCESS_TOKEN });

    // Resolve the violation code: prefer explicit field, fall back to searching the violation text
    const codeSource = input.violationCode ?? input.violation;
    const matchedStandards = getStandardsForViolationCode(codeSource);
    const standardsBlock = buildStandardsPromptBlock(matchedStandards);

    const systemPrompt = [
      'You are an expert environmental health inspector for the San Francisco Department of Public Health.',
      'When given a violation, respond with ONLY a concise corrective action (2-4 sentences).',
      'Be specific, actionable, and professional — include exact measurements and approved materials',
      'wherever the regulatory standards below require them. Do not include any explanation or preamble.',
      '',
      AI_EXCLUSION_DIRECTIVES,
      standardsBlock ? `\n${standardsBlock}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Violation: ${input.violation}` }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    return { correctiveAction: text.trim() };
  },
});
