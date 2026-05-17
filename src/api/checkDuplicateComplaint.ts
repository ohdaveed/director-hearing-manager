import { z } from 'zod';
import { createEndpoint, ArrizonOpenComplaintInspectionsList1 } from 'zite-integrations-backend-sdk';
import { CLOSURE_STATUSES } from '../utils/complaintStatuses';

const CLOSED_STATUSES: readonly string[] = CLOSURE_STATUSES;

export default createEndpoint({
  description: 'Check for existing open complaints at the same address or location',
  inputSchema: z.object({
    address: z.string().optional(),
    locationRecordId: z.string().optional(),
  }),
  outputSchema: z.object({
    found: z.boolean(),
    complaints: z.array(z.object({
      id: z.string(),
      complaintId: z.string().optional(),
      address: z.string().optional(),
      status: z.string().optional(),
      description: z.string().optional(),
      dateEntered: z.string().optional(),
    })),
  }),
  execute: async ({ input }) => {
    if (!input.address && !input.locationRecordId) {
      return { found: false, complaints: [] };
    }

    let records: Awaited<ReturnType<typeof ArrizonOpenComplaintInspectionsList1.findAll>>['records'] = [];

    if (input.locationRecordId) {
      const { records: r } = await ArrizonOpenComplaintInspectionsList1.findAll({
        filters: { location: input.locationRecordId },
        limit: 10,
      });
      records = r;
    } else if (input.address && input.address.trim().length >= 5) {
      const { records: r } = await ArrizonOpenComplaintInspectionsList1.findAll({
        filters: { address: { contains: input.address.trim() } },
        limit: 10,
      });
      records = r;
    }

    const open = records.filter(c => !CLOSED_STATUSES.includes(c.status ?? ''));

    return {
      found: open.length > 0,
      complaints: open.map(c => ({
        id: c.id,
        complaintId: c.complaintId,
        address: c.address,
        status: c.status,
        description: c.description,
        dateEntered: c.dateEntered,
      })),
    };
  },
});
