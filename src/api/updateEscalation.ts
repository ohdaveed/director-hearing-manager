import { z } from 'zod';
import { createEndpoint, ArrizonOpenComplaintInspectionsList1, Chronology } from 'zite-integrations-backend-sdk';

export default createEndpoint({
  description: 'Update hearing status/date and optionally add a chronology entry — Program Manager only',
  inputSchema: z.object({
    complaintRecordId: z.string(),
    hearingStatus: z.string().optional(),
    hearingDate: z.string().optional(),
    chronologySummary: z.string().optional(),
    chronologyEntryType: z.string().optional(),
  }),
  outputSchema: z.object({ success: z.boolean() }),
  execute: async ({ input, context }) => {
    const record: Record<string, string> = {};
    if (input.hearingStatus !== undefined) record.hearingStatus = input.hearingStatus;
    if (input.hearingDate !== undefined) record.hearingDate = input.hearingDate;

    const ops: Promise<unknown>[] = [
      ArrizonOpenComplaintInspectionsList1.update({ id: input.complaintRecordId, record }),
    ];

    if (input.chronologySummary?.trim()) {
      const displayName = [context.user.firstName, context.user.lastName].filter(Boolean).join(' ') || context.user.email;
      ops.push(Chronology.create({
        record: {
          summary: input.chronologySummary,
          entryType: input.chronologyEntryType ?? 'Hearing Referral',
          entryDate: new Date().toISOString().split('T')[0],
          createdBy: displayName,
          complaint: input.complaintRecordId,
          sourceRecord: `Escalation — ${new Date().toISOString().split('T')[0]}`,
          visibility: 'Public',
        },
      }));
    }

    await Promise.all(ops);
    return { success: true };
  },
});
