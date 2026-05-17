import { z } from 'zod';
import { createEndpoint, Users } from 'zite-integrations-backend-sdk';

export default createEndpoint({
  description: 'Get all users with roles (admin use)',
  inputSchema: z.object({}),
  outputSchema: z.object({
    users: z.array(z.object({
      id: z.string(),
      email: z.string(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      role: z.string().optional(),
    })),
  }),
  execute: async () => {
    const { records } = await Users.findAll({ limit: 200 });
    return {
      users: records
        .sort((a, b) => {
          const nameA = [a.firstName, a.lastName].filter(Boolean).join(' ') || a.email || '';
          const nameB = [b.firstName, b.lastName].filter(Boolean).join(' ') || b.email || '';
          return nameA.localeCompare(nameB);
        })
        .map(u => ({
          id: u.id,
          email: u.email ?? '',
          firstName: u.firstName,
          lastName: u.lastName,
          role: u.role,
        })),
    };
  },
});
