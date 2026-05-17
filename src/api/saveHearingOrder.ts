import { z } from 'zod';
import { createEndpoint, HearingPackets, ArrizonOpenComplaintInspectionsList1 } from 'zite-integrations-backend-sdk';

export default createEndpoint({
  description: 'Save hearing order determination data to the hearing packet record',
  inputSchema: z.object({
    packetId: z.string(),
    hearingOrderData: z.string(), // JSON string of HearingOrderData
    hearingOrderDate: z.string().optional(),
    complaintId: z.string().optional(), // DB record ID to update hearingOrderDate
  }),
  outputSchema: z.object({ success: z.boolean() }),
  execute: async ({ input }) => {
    await HearingPackets.update({
      id: input.packetId,
      record: {
        hearingOrderData: input.hearingOrderData,
      },
    });
    if (input.complaintId && input.hearingOrderDate) {
      await ArrizonOpenComplaintInspectionsList1.update({
        id: input.complaintId,
        record: { hearingOrderDate: input.hearingOrderDate },
      });
    }
    return { success: true };
  },
});
