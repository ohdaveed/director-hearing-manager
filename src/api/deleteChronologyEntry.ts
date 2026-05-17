import { z } from 'zod';
import { createEndpoint, Chronology } from 'zite-integrations-backend-sdk';

export default createEndpoint({
  description: 'Delete a chronology entry',
  inputSchema: z.object({ entryId: z.string() }),
  outputSchema: z.object({ success: z.boolean() }),
  execute: async ({ input }) => {
    await Chronology.delete({ id: input.entryId });
    return { success: true };
  },
});
