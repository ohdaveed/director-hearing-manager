/**
 * getLocationHistory.ts
 *
 * Fetches a location record by ID along with all inspections and complaints
 * associated with that location (matched via locationId).
 *
 * Called by: LocationPage to display the full site history.
 *
 * Results are sorted newest-first and soft-deleted records are excluded.
 */

import { z } from 'zod';
import { createEndpoint, Locations, Inspections, ArrizonOpenComplaintInspectionsList1, ZiteError } from 'zite-integrations-backend-sdk';

export default createEndpoint({
  description: 'Get location info with all past inspections and complaints',
  inputSchema: z.object({ locationRecordId: z.string() }),
  outputSchema: z.object({
    location: z.object({
      id: z.string(),
      address: z.string().optional(),
      locationId: z.string().optional(),
      blockLot: z.string().optional(),
      dba: z.string().optional(),
      ownerName: z.string().optional(),
      ownerAddress: z.string().optional(),
      ownerPhone: z.string().optional(),
      ownerEmail: z.string().optional(),
      managementName: z.string().optional(),
      responsibleParty: z.string().optional(),
      responsiblePartyPhone: z.string().optional(),
      responsiblePartyEmail: z.string().optional(),
      facilityType: z.string().optional(),
      numberOfUnits: z.number().optional(),
      numberOfRooms: z.number().optional(),
      currentFees: z.number().optional(),
      healthyHousing: z.boolean().optional(),
      censusTract: z.string().optional(),
      verificationDate: z.string().optional(),
      buildingFeatures: z.array(z.string()).optional(),
    }),
    inspections: z.array(z.object({
      id: z.string(),
      inspectionDate: z.string().optional(),
      inspector: z.string().optional(),
      inspectionType: z.string().optional(),
      inspectionRating: z.string().optional(),
      status: z.string().optional(),
      violationCount: z.number().optional(),
      complaintId: z.string().optional(),
      notes: z.string().optional(),
    })),
    complaints: z.array(z.object({
      id: z.string(),
      complaintId: z.string().optional(),
      dateEntered: z.string().optional(),
      status: z.string().optional(),
      category: z.array(z.string()).optional(),
      assignedTo: z.string().optional(),
      description: z.string().optional(),
      complaintType: z.string().optional(),
      dateClosed: z.string().optional(),
    })),
  }),
  execute: async ({ input }) => {
    // Resolve the location record — throw 404 if not found
    const loc = await Locations.findOne({ id: input.locationRecordId });
    if (!loc) throw new ZiteError({ code: 'NOT_FOUND', message: 'Location not found' });

    // Fetch inspections and complaints in parallel to reduce latency
    const [inspectionsResult, complaintsResult] = await Promise.all([
      Inspections.findAll({
        filters: { locationId: loc.locationId },
        limit: 200,
      }),
      ArrizonOpenComplaintInspectionsList1.findAll({
        filters: { locationId: loc.locationId },
        limit: 200,
      }),
    ]);

    // Exclude soft-deleted inspections and sort newest-first
    const inspections = inspectionsResult.records
      .filter(i => !i.deletedAt)
      .sort((a, b) => (b.inspectionDate ?? '').localeCompare(a.inspectionDate ?? ''))
      .map(i => ({
        id: i.id,
        inspectionDate: i.inspectionDate,
        inspector: i.inspector,
        inspectionType: i.inspectionType,
        inspectionRating: i.inspectionRating,
        status: i.status,
        violationCount: i.violationCount ?? undefined,
        complaintId: i.complaintId,
        notes: i.notes,
      }));

    // Exclude soft-deleted complaints and sort newest-first.
    // Same exclude+map pattern as getAllComplaints / getAssignedComplaints,
    // but only the fields relevant to the location history view are returned.
    const complaints = complaintsResult.records
      .filter(c => !c.deletedAt)
      .sort((a, b) => (b.dateEntered ?? '').localeCompare(a.dateEntered ?? ''))
      .map(c => ({
        id: c.id,
        complaintId: c.complaintId,
        dateEntered: c.dateEntered,
        status: c.status,
        category: c.category as string[] | undefined,
        assignedTo: c.assignedTo,
        description: c.description,
        complaintType: c.complaintType,
        dateClosed: c.dateClosed,
      }));

    return {
      location: {
        id: loc.id,
        address: loc.address,
        locationId: loc.locationId,
        blockLot: loc.blockLot,
        dba: loc.dba,
        ownerName: loc.ownerName,
        ownerAddress: loc.ownerAddress,
        ownerPhone: loc.ownerPhone,
        ownerEmail: loc.ownerEmail,
        managementName: loc.managementName,
        responsibleParty: loc.responsibleParty,
        responsiblePartyPhone: loc.responsiblePartyPhone,
        responsiblePartyEmail: loc.responsiblePartyEmail,
        facilityType: loc.facilityType,
        numberOfUnits: loc.numberOfUnits ?? undefined,
        numberOfRooms: loc.numberOfRooms ?? undefined,
        currentFees: loc.currentFees ?? undefined,
        healthyHousing: loc.healthyHousing ?? undefined,
        censusTract: loc.censusTract,
        verificationDate: loc.verificationDate,
        buildingFeatures: loc.buildingFeatures as string[] | undefined,
      },
      inspections,
      complaints,
    };
  },
});
