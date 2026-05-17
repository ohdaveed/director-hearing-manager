/**
 * getAssignedComplaints.ts
 *
 * Fetches all complaints assigned to a specific inspector, and enriches each
 * record with the ID of any in-progress (Draft) inspection for that complaint.
 *
 * Called by: InspectorDashboardPage, MyComplaintsPage, AssignedComplaintsPanel,
 *            InspectionFormPage (to let the inspector pick a complaint).
 *
 * Soft-deleted records are excluded. The draftInspectionId field enables the UI
 * to show a "Resume Draft" affordance on complaints with an in-progress inspection.
 */

import { z } from 'zod';
import { createEndpoint, ArrizonOpenComplaintInspectionsList1, Inspections } from 'zite-integrations-backend-sdk';

export default createEndpoint({
  description: 'Get complaints assigned to an inspector, with any draft inspection IDs',
  inputSchema: z.object({ inspector: z.string() }),
  outputSchema: z.object({
    complaints: z.array(z.object({
      id: z.string(),
      complaintId: z.string().optional(),
      address: z.string().optional(),
      description: z.string().optional(),
      status: z.string().optional(),
      category: z.array(z.string()).optional(),
      reinspectionDueOnAfter: z.string().optional(),
      draftInspectionId: z.string().optional(),
      locationRecordId: z.string().optional(),
      locationId: z.string().optional(),
      hearingStatus: z.string().optional(),
    })),
  }),
  execute: async ({ input }) => {
    // The database stores the inspector's name as "First Last" (e.g. "David Arrizon")
    const dbName = input.inspector;

    // Fetch all assigned complaints in one call (avoids N+1 queries)
    const { records } = await ArrizonOpenComplaintInspectionsList1.findAll({
      filters: { assignedTo: dbName },
      limit: 200,
    });

    if (records.length === 0) return { complaints: [] };

    // Fetch all draft inspections for this inspector in one call so we can
    // build a complaintId -> draftInspectionId map without looping
    const { records: draftInspections } = await Inspections.findAll({
      filters: { inspector: input.inspector, status: 'Draft' },
      limit: 500,
    });

    // Build a map of complaint record ID -> draft inspection ID
    const draftMap = new Map<string, string>();
    for (const draft of draftInspections) {
      // complaint is a linked-record field — can be string or string[]
      const complaintId = typeof draft.complaint === 'string'
        ? draft.complaint
        : (draft.complaint as string[] | undefined)?.[0];
      if (complaintId && draft.id) {
        draftMap.set(complaintId, draft.id);
      }
    }

    // Map raw DB records to summary shape. Same pattern as getAllComplaints —
    // exclude soft-deleted and normalise linked-record fields to a single ID.
    const complaints = records.filter(c => !c.deletedAt).map((c) => ({
      id: c.id,
      complaintId: c.complaintId,
      address: c.address,
      description: c.description,
      status: c.status,
      category: (c.category as string[] | undefined) ?? [],
      reinspectionDueOnAfter: c.reinspectionDueOnAfter,
      // Attach the draft inspection ID if one exists for this complaint
      draftInspectionId: draftMap.get(c.id),
      locationRecordId: typeof c.location === 'string' ? c.location : (c.location as string[] | undefined)?.[0],
      locationId: c.locationId,
      hearingStatus: c.hearingStatus,
    }));

    return { complaints };
  },
});
