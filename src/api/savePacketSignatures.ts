import { z } from 'zod';
import { createEndpoint, HearingPackets } from 'zite-integrations-backend-sdk';

export default createEndpoint({
  description: 'Persist inspector and/or manager signatures on a hearing packet record',
  inputSchema: z.object({
    packetId: z.string(),
    inspectorSignature: z.string().optional(),
    managerSignature: z.string().optional(),
  }),
  outputSchema: z.object({ success: z.boolean() }),
  execute: async ({ input }) => {
    const record: Record<string, string> = {};
    if (input.inspectorSignature !== undefined) record.inspectorSignature = input.inspectorSignature;
    if (input.managerSignature !== undefined) record.managerSignature = input.managerSignature;
    await HearingPackets.update({ id: input.packetId, record });
    return { success: true };
  },
});
