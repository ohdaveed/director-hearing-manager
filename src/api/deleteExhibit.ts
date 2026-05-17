import { z } from 'zod';
import { createEndpoint, Exhibits } from 'zite-integrations-backend-sdk';

export default createEndpoint({
  description: 'Delete an exhibit record by ID',
  inputSchema: z.object({
    exhibitId: z.string(),
  }),
  outputSchema: z.object({ success: z.boolean() }),
  execute: async ({ input }) => {
    await Exhibits.delete({ id: input.exhibitId });
    return { success: true };
  },
});
