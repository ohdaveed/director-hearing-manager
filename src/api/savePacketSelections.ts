import { z } from 'zod';
import { createEndpoint, HearingPackets } from 'zite-integrations-backend-sdk';

export default createEndpoint({
  description: 'Save selected report IDs and photo IDs for a hearing packet. Writes to linked record fields (primary) and legacy JSON text fields (backward compat).',
  inputSchema: z.object({
    packetId: z.string(),
    selectedReportIds: z.array(z.string()),
    selectedPhotoIds: z.array(z.string()),
  }),
  outputSchema: z.object({ success: z.boolean() }),
  execute: async ({ input }) => {
    await HearingPackets.update({
      id: input.packetId,
      record: {
        // Primary: proper linked record fields — queryable at the database level
        selectedReports: input.selectedReportIds,
        selectedPhotos: input.selectedPhotoIds,
        // Backward compat: keep JSON text fields in sync for any legacy reads
        selectedReportIDs: JSON.stringify(input.selectedReportIds),
        selectedPhotoIDs: JSON.stringify(input.selectedPhotoIds),
      },
    });
    return { success: true };
  },
});
