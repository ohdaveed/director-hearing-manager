import { z } from 'zod';
import { createEndpoint, Chronology } from 'zite-integrations-backend-sdk';

export default createEndpoint({
  description: 'Update an existing chronology entry',
  inputSchema: z.object({
    entryId: z.string(),
    entryDate: z.string().optional(),
    entryType: z.string().optional(),
    citationCode: z.string().optional(),
    summary: z.string().optional(),
    attachmentPageRef: z.string().optional(),
    visibility: z.string().optional(),
  }),
  outputSchema: z.object({ success: z.boolean() }),
  execute: async ({ input }) => {
    const recordData: Record<string, unknown> = {};
    if (input.entryDate !== undefined) recordData.entryDate = input.entryDate;
    if (input.entryType !== undefined) recordData.entryType = input.entryType;
    if (input.citationCode !== undefined) recordData.citationCode = input.citationCode || null;
    if (input.summary !== undefined) recordData.summary = input.summary;
    if (input.attachmentPageRef !== undefined) recordData.attachmentPageRef = input.attachmentPageRef;
    if (input.visibility !== undefined) recordData.visibility = input.visibility;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await Chronology.update({ id: input.entryId, record: recordData as any });
    return { success: true };
  },
});
