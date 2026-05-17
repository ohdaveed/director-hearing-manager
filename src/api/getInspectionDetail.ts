import { z } from 'zod';
import { createEndpoint, Inspections, Violations, Locations } from 'zite-integrations-backend-sdk';

export default createEndpoint({
  description: 'Get full inspection detail with violations and location',
  inputSchema: z.object({ inspectionId: z.string() }),
  outputSchema: z.object({
    inspection: z.object({
      id: z.string(),
      inspector: z.string().optional(),
      inspectionDate: z.string().optional(),
      timeIn: z.string().optional(),
      timeOut: z.string().optional(),
      facilityAddress: z.string().optional(),
      locationId: z.string().optional(),
      complaintId: z.string().optional(),
      dba: z.string().optional(),
      contactPhone: z.string().optional(),
      contactEmail: z.string().optional(),
      inspectionType: z.string().optional(),
      inspectionRating: z.string().optional(),
      accessGrantedBy: z.string().optional(),
      notes: z.string().optional(),
      completedReport: z.string().optional(),
      status: z.string().optional(),
      submittedAt: z.string().optional(),
      violationCount: z.number().optional(),
      locationRecordId: z.string().optional(),
      complaintRecordId: z.string().optional(),
    }),
    violations: z.array(z.object({
      id: z.string(),
      violationLabel: z.string().optional(),
      violationCode: z.string().optional(),
      category: z.string().optional(),
      locationInProperty: z.string().optional(),
      correctiveAction: z.string().optional(),
      dueDate: z.string().optional(),
      responsibleParty: z.string().optional(),
      status: z.string().optional(),
    })),
    location: z.object({
      ownerName: z.string().optional(),
      ownerAddress: z.string().optional(),
      facilityType: z.string().optional(),
      numberOfUnits: z.number().optional(),
      numberOfRooms: z.number().optional(),
      healthyHousing: z.boolean().optional(),
      censusTract: z.string().optional(),
      currentFees: z.number().optional(),
    }).optional(),
  }),
  execute: async ({ input }) => {
    const rec = await Inspections.findOne({ id: input.inspectionId });
    if (!rec) throw new Error('Inspection not found');

    const { records: allVRecs } = await Violations.findAll({
      filters: { inspection: input.inspectionId },
      limit: 100,
    });
    const vRecs = allVRecs.filter(v => !v.deletedAt);

    const locationId = typeof rec.location === 'string' ? rec.location : (rec.location as string[] | undefined)?.[0];
    let location;
    if (locationId) {
      const loc = await Locations.findOne({ id: locationId });
      if (loc) {
        location = {
          ownerName: loc.ownerName,
          ownerAddress: loc.ownerAddress,
          facilityType: loc.facilityType,
          numberOfUnits: loc.numberOfUnits,
          numberOfRooms: loc.numberOfRooms,
          healthyHousing: loc.healthyHousing,
          censusTract: loc.censusTract,
          currentFees: loc.currentFees,
        };
      }
    }

    const complaintId = typeof rec.complaint === 'string' ? rec.complaint : (rec.complaint as string[] | undefined)?.[0];

    return {
      inspection: {
        id: rec.id,
        inspector: rec.inspector,
        inspectionDate: rec.inspectionDate,
        timeIn: rec.timeIn,
        timeOut: rec.timeOut,
        facilityAddress: rec.facilityAddress,
        locationId: rec.locationId,
        complaintId: rec.complaintId,
        dba: rec.dba,
        contactPhone: rec.contactPhone,
        contactEmail: rec.contactEmail,
        inspectionType: rec.inspectionType,
        inspectionRating: rec.inspectionRating,
        accessGrantedBy: rec.accessGrantedBy,
        notes: rec.notes,
        completedReport: rec.completedReport,
        status: rec.status,
        submittedAt: rec.submittedAt,
        violationCount: rec.violationCount,
        locationRecordId: locationId,
        complaintRecordId: complaintId,
      },
      violations: vRecs.map(v => ({
        id: v.id,
        violationLabel: v.violationLabel,
        violationCode: v.violationCode,
        category: v.category,
        locationInProperty: v.locationInProperty,
        correctiveAction: v.correctiveAction,
        dueDate: v.dueDate,
        responsibleParty: v.responsibleParty,
        status: v.status,
      })),
      location,
    };
  },
});
