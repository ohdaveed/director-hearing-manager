import { z } from 'zod';
import { createEndpoint, ArrizonOpenComplaintInspectionsList1 } from 'zite-integrations-backend-sdk';

export default createEndpoint({
  description: 'Update complaint fields such as assignedTo or linked location — Admin only. Status changes must go through updateComplaintStatus.',
  inputSchema: z.object({
    complaintRecordId: z.string(),
    assignedTo: z.string().optional(),
    locationRecordId: z.string().optional(),
  }),
  outputSchema: z.object({ success: z.boolean() }),
  execute: async ({ input }) => {
    const record: Record<string, string> = {};
    if (input.assignedTo !== undefined) record.assignedTo = input.assignedTo;
    if (input.locationRecordId !== undefined) record.location = input.locationRecordId;
    await ArrizonOpenComplaintInspectionsList1.update({ id: input.complaintRecordId, record });
    return { success: true };
  },
});
