import { z } from 'zod';
import { createEndpoint, Chronology } from 'zite-integrations-backend-sdk';

function entryLetter(idx: number): string {
  return idx < 26 ? String.fromCharCode(65 + idx) : `(${idx + 1})`;
}

export default createEndpoint({
  description: 'Add a manual chronology entry for a case (SFHC Article 11 codes only)',
  inputSchema: z.object({
    complaintId: z.string(),
    entryDate: z.string(),
    entryType: z.string().optional(),
    citationCode: z.string().optional(),
    summary: z.string(),
    visibility: z.string().optional(),
    attachmentPageRef: z.string().optional(),
  }),
  outputSchema: z.object({
    entry: z.object({
      id: z.string(),
      entryDate: z.string().optional(),
      entryType: z.string().optional(),
      citationCode: z.string().optional(),
      summary: z.string().optional(),
      exhibitRefs: z.string().optional(),
      attachmentPageRef: z.string().optional(),
      chronologyOrder: z.number().optional(),
      createdBy: z.string().optional(),
      visibility: z.string().optional(),
    }),
  }),
  execute: async ({ input, context }) => {
    // Get current count to determine next order + exhibit letter
    const existing = await Chronology.findAll({
      filters: { complaint: input.complaintId },
      limit: 200,
      fields: ['id', 'chronologyOrder'],
    });

    const maxOrder = existing.records.reduce((max, r) => Math.max(max, r.chronologyOrder ?? 0), 0);
    const newOrder = maxOrder + 1;
    const exhibitRef = entryLetter(newOrder - 1); // 0-indexed for letter

    const displayName =
      [context.user.firstName, context.user.lastName].filter(Boolean).join(' ') ||
      context.user.email;

    const recordData: Record<string, unknown> = {
      summary: input.summary,
      entryDate: input.entryDate,
      entryType: input.entryType ?? 'Other',
      complaint: input.complaintId,
      chronologyOrder: newOrder,
      createdBy: displayName,
      visibility: input.visibility ?? 'Public',
      exhibitRefs: exhibitRef,
    };
    if (input.attachmentPageRef) recordData.attachmentPageRef = input.attachmentPageRef;
    if (input.citationCode) recordData.citationCode = input.citationCode;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const record = await Chronology.create({ record: recordData as any });

    return {
      entry: {
        id: record.id,
        entryDate: record.entryDate,
        entryType: record.entryType,
        citationCode: (record as Record<string, unknown>).citationCode as string | undefined,
        summary: record.summary,
        exhibitRefs: record.exhibitRefs,
        attachmentPageRef: record.attachmentPageRef,
        chronologyOrder: record.chronologyOrder,
        createdBy: record.createdBy,
        visibility: record.visibility,
      },
    };
  },
});
