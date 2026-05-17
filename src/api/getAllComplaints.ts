/**
 * getAllComplaints.ts
 *
 * Fetches all complaints from the database with optional server-side filters.
 * Called by AllComplaintsPage (Admin/PM view) and DashboardPage for aggregate metrics.
 *
 * Filters applied server-side: status, hearingStatus, assignedTo.
 * Text search (address / complaintId) is applied client-side after the fetch
 * because the database does not support partial-match queries.
 *
 * Soft-deleted records (deletedAt is set) are excluded from the results.
 */

import { z } from 'zod';
import { createEndpoint, ArrizonOpenComplaintInspectionsList1 } from 'zite-integrations-backend-sdk';

export default createEndpoint({
  description: 'Get all complaints with optional filters for Admin and Program Manager views',
  inputSchema: z.object({
    status: z.string().optional(),
    hearingStatus: z.string().optional(),
    assignedTo: z.string().optional(),
    search: z.string().optional(),
  }),
  outputSchema: z.object({
    complaints: z.array(z.object({
      id: z.string(),
      complaintId: z.string().optional(),
      address: z.string().optional(),
      description: z.string().optional(),
      status: z.string().optional(),
      category: z.array(z.string()).optional(),
      reinspectionDueOnAfter: z.string().optional(),
      locationRecordId: z.string().optional(),
      locationId: z.string().optional(),
      hearingStatus: z.string().optional(),
      hearingDate: z.string().optional(),
      assignedTo: z.string().optional(),
      dateEntered: z.string().optional(),
      hearingPacketId: z.string().optional(),
    })),
  }),
  execute: async ({ input }) => {
    // Build server-side filter object from provided inputs
    const filters: Record<string, string> = {};
    if (input.status) filters.status = input.status;
    if (input.hearingStatus) filters.hearingStatus = input.hearingStatus;
    if (input.assignedTo) filters.assignedTo = input.assignedTo;

    const { records } = await ArrizonOpenComplaintInspectionsList1.findAll({ filters, limit: 500 });

    // Map raw DB records to the summary shape, excluding soft-deleted records.
    // NOTE: Linked-record fields (location, hearingPackets) can be a string or
    // string[] depending on how many records are linked — normalise to a single ID.
    let complaints = records.filter(c => !c.deletedAt).map(c => ({
      id: c.id,
      complaintId: c.complaintId,
      address: c.address,
      description: c.description,
      status: c.status,
      category: (c.category as string[] | undefined) ?? [],
      reinspectionDueOnAfter: c.reinspectionDueOnAfter,
      locationRecordId: typeof c.location === 'string' ? c.location : (c.location as string[] | undefined)?.[0],
      locationId: c.locationId,
      hearingStatus: c.hearingStatus,
      hearingDate: c.hearingDate,
      assignedTo: c.assignedTo,
      dateEntered: c.dateEntered,
      hearingPacketId: typeof c.hearingPackets === 'string' ? c.hearingPackets : (c.hearingPackets as string[] | undefined)?.[0],
    }));

    // Apply client-side text search (partial match on address or complaintId)
    if (input.search) {
      const q = input.search.toLowerCase();
      complaints = complaints.filter(c =>
        c.address?.toLowerCase().includes(q) || c.complaintId?.includes(q)
      );
    }

    return { complaints };
  },
});
