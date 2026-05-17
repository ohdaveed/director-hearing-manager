import { z } from 'zod';
import { createEndpoint, Inspections, Locations } from 'zite-integrations-backend-sdk';

export default createEndpoint({
  description: 'List inspections for the history page with optional filters',
  inputSchema: z.object({
    inspector: z.string().optional(),
    rating: z.string().optional(),
    status: z.string().optional(),
    addressSearch: z.string().optional(),
    limit: z.number().optional(),
    offset: z.number().optional(),
  }),
  outputSchema: z.object({
    inspections: z.array(z.object({
      id: z.string(),
      inspector: z.string().optional(),
      inspectionDate: z.string().optional(),
      facilityAddress: z.string().optional(),
      complaintId: z.string().optional(),
      inspectionType: z.string().optional(),
      inspectionRating: z.string().optional(),
      status: z.string().optional(),
      violationCount: z.number().optional(),
      submittedAt: z.string().optional(),
    })),
    hasMore: z.boolean(),
  }),
  execute: async ({ input }) => {
    const filters: Record<string, unknown> = {};
    if (input.inspector) filters.inspector = input.inspector;
    if (input.rating) filters.inspectionRating = input.rating;
    if (input.status) filters.status = input.status;

    // Fetch inspections and all locations in parallel so we can resolve
    // the human-readable street address for each inspection record.
    const [inspectionsResult, locationsResult] = await Promise.all([
      Inspections.findAll({
        filters,
        limit: input.limit ?? 100,
        offset: input.offset ?? 0,
      }),
      Locations.findAll({ limit: 500 }),
    ]);

    // Build a map from location record ID → street address
    const locationAddressMap = new Map<string, string>();
    for (const loc of locationsResult.records) {
      if (loc.address) locationAddressMap.set(loc.id, loc.address);
    }

    let inspections = inspectionsResult.records.filter(r => !r.deletedAt).map(r => {
      // Resolve the linked location record ID to get the authoritative address
      const linkedLocId = typeof r.location === 'string'
        ? r.location
        : (r.location as string[] | undefined)?.[0];
      const resolvedAddress = linkedLocId ? locationAddressMap.get(linkedLocId) : undefined;

      return {
        id: r.id,
        inspector: r.inspector,
        inspectionDate: r.inspectionDate,
        facilityAddress: resolvedAddress ?? r.facilityAddress,
        complaintId: r.complaintId,
        inspectionType: r.inspectionType,
        inspectionRating: r.inspectionRating,
        status: r.status,
        violationCount: r.violationCount,
        submittedAt: r.submittedAt,
      };
    });

    // Client-side address filter if needed
    if (input.addressSearch) {
      const q = input.addressSearch.toLowerCase();
      inspections = inspections.filter(i => i.facilityAddress?.toLowerCase().includes(q));
    }

    // Sort newest first
    inspections.sort((a, b) => {
      const da = a.inspectionDate ?? '';
      const db = b.inspectionDate ?? '';
      return db.localeCompare(da);
    });

    return { inspections, hasMore: inspectionsResult.hasMore };
  },
});
