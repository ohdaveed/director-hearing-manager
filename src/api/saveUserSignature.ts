import { z } from 'zod';
import { createEndpoint, Users } from 'zite-integrations-backend-sdk';

export default createEndpoint({
  description: 'Save the current user\'s digital signature text and style',
  inputSchema: z.object({
    signatureText: z.string(),
    signatureStyle: z.string(),
  }),
  outputSchema: z.object({ success: z.boolean() }),
  execute: async ({ input, context }) => {
    await Users.update({
      id: context.user.id,
      record: {
        signatureText: input.signatureText,
        signatureStyle: input.signatureStyle,
      },
    });
    return { success: true };
  },
});
