import { z } from 'zod';
import { createEndpoint, Users, ZiteError } from 'zite-integrations-backend-sdk';

export default createEndpoint({
  description: 'Update a user\'s role — Super Admin only',
  inputSchema: z.object({
    userId: z.string(),
    role: z.enum(['Admin', 'Inspector', 'Program Manager', 'Super Admin']),
  }),
  outputSchema: z.object({ success: z.boolean() }),
  execute: async ({ input, context }) => {
    if (context.user.role !== 'Super Admin') {
      throw new ZiteError({ code: 'FORBIDDEN', message: 'Only Super Admins can assign roles.' });
    }
    await Users.update({ id: input.userId, record: { role: input.role } });
    return { success: true };
  },
});
