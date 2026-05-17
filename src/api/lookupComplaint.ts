import { z } from 'zod';
import { createEndpoint, ArrizonOpenComplaintInspectionsList1 } from 'zite-integrations-backend-sdk';

export default createEndpoint({
  description: 'Lookup complaint details by Complaint ID or Address to auto-populate the inspection form',
  inputSchema: z.object({
    complaintId: z.string().optional(),
    address: z.string().optional(),
  }),
  outputSchema: z.object({
    found: z.boolean(),
    matches: z.array(z.object({
      complaintId: z.string().optional(),
      address: z.string().optional(),
      locationId: z.string().optional(),
      description: z.string().optional(),
      assignedTo: z.string().optional(),
      category: z.array(z.string()).optional(),
      reinspectionDueOnAfter: z.string().optional(),
      status: z.string().optional(),
    })),
  }),
  execute: async ({ input }) => {
    let record;

    if (input.complaintId?.trim()) {
      record = await ArrizonOpenComplaintInspectionsList1.findOne({
        filters: { complaintId: input.complaintId.trim() },
      });
      if (record) {
        return {
          found: true,
          matches: [{
            complaintId: record.complaintId,
            address: record.address,
            locationId: record.locationId,
            description: record.description,
            assignedTo: record.assignedTo,
            category: record.category,
            reinspectionDueOnAfter: record.reinspectionDueOnAfter,
            status: record.status,
          }],
        };
      }
    }

    if (input.address?.trim()) {
      const { records } = await ArrizonOpenComplaintInspectionsList1.findAll({
        filters: { address: { contains: input.address.trim() } },
        limit: 10,
      });
      if (records.length > 0) {
        return {
          found: true,
          matches: records.map(r => ({
            complaintId: r.complaintId,
            address: r.address,
            locationId: r.locationId,
            description: r.description,
            assignedTo: r.assignedTo,
            category: r.category,
            reinspectionDueOnAfter: r.reinspectionDueOnAfter,
            status: r.status,
          })),
        };
      }
    }

    return { found: false, matches: [] };
  },
});
