import { z } from 'zod';
import { createEndpoint, ArrizonOpenComplaintInspectionsList1, Locations, Chronology, ZiteError } from 'zite-integrations-backend-sdk';

async function generateUniqueComplaintId(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const id = String(Math.floor(100000 + Math.random() * 900000));
    const existing = await ArrizonOpenComplaintInspectionsList1.findOne({ filters: { complaintId: id } });
    if (!existing) return id;
  }
  return String(Date.now()).slice(-6);
}

export default createEndpoint({
  description: 'Create a new complaint with all PDF form fields',
  inputSchema: z.object({
    // Manual Complaint ID (from paper form) — if omitted, auto-generated
    complaintId: z.string().optional(),
    // Location
    locationRecordId: z.string().optional(),
    newLocation: z.object({
      address: z.string(),
      locationId: z.string().optional(),
      blockLot: z.string().optional(),
      ownerName: z.string().optional(),
      ownerAddress: z.string().optional(),
      ownerPhone: z.string().optional(),
      ownerEmail: z.string().optional(),
      facilityType: z.string().optional(),
      numberOfUnits: z.number().optional(),
      numberOfRooms: z.number().optional(),
      healthyHousing: z.boolean().optional(),
      censusTract: z.string().optional(),
      currentFees: z.number().optional(),
    }).optional(),
    // Complaint header
    caseNumber311: z.string().optional(),
    dateReceived: z.string().optional(),
    unitNumber: z.string().optional(),
    facilityName: z.string().optional(),
    facilityOwnership: z.string().optional(),
    // Complaint details
    description: z.string(),
    category: z.array(z.string()).optional(),
    complaintType: z.string().optional(),
    complaintSubtype: z.string().optional(),
    methodReceived: z.string().optional(),
    assignedProgram: z.string().optional(),
    assignedTo: z.string().optional(),
    dateAssigned: z.string().optional(),
    status: z.string().optional(),
    dateClosed: z.string().optional(),
    // Complainant
    complainantAnonymous: z.boolean().optional(),
    complainantName: z.string().optional(),
    complainantPhone: z.string().optional(),
    complainantEmail: z.string().optional(),
    complainantAddress: z.string().optional(),
    complainantContactDates: z.string().optional(),
    // Thread linking
    threadParentId: z.string().optional(),
  }),
  outputSchema: z.object({ id: z.string(), complaintId: z.string(), success: z.boolean() }),
  execute: async ({ input, context }) => {
    // Resolve complaint ID — use provided one (validate uniqueness) or auto-generate
    let complaintId: string;
    if (input.complaintId?.trim()) {
      const trimmed = input.complaintId.trim();
      const existing = await ArrizonOpenComplaintInspectionsList1.findOne({ filters: { complaintId: trimmed } });
      if (existing) {
        throw new ZiteError({ code: 'CONFLICT', message: `Complaint ID ${trimmed} already exists in the system. Please use a different ID or leave blank to auto-generate.` });
      }
      complaintId = trimmed;
    } else {
      complaintId = await generateUniqueComplaintId();
    }

    let locationId: string | undefined = input.locationRecordId;

    if (!locationId && input.newLocation) {
      const loc = await Locations.create({
        record: {
          address: input.newLocation.address,
          locationId: input.newLocation.locationId,
          blockLot: input.newLocation.blockLot,
          ownerName: input.newLocation.ownerName,
          ownerAddress: input.newLocation.ownerAddress,
          ownerPhone: input.newLocation.ownerPhone,
          ownerEmail: input.newLocation.ownerEmail,
          facilityType: input.newLocation.facilityType,
          numberOfUnits: input.newLocation.numberOfUnits,
          numberOfRooms: input.newLocation.numberOfRooms,
          healthyHousing: input.newLocation.healthyHousing,
          censusTract: input.newLocation.censusTract,
          currentFees: input.newLocation.currentFees,
        },
      });
      locationId = loc.id;
    }

    const today = new Date().toISOString().split('T')[0];
    const isLinked = !!input.threadParentId;
    const isAnon = input.complainantAnonymous ?? false;

    const record = await ArrizonOpenComplaintInspectionsList1.create({
      record: {
        complaintId,
        dateEntered: input.dateReceived ?? today,
        address: input.newLocation?.address ?? undefined,
        location: locationId,
        status: input.status ?? 'New',
        description: input.description,
        category: input.category,
        assignedTo: input.assignedTo,
        hearingStatus: 'None',
        threadParent: input.threadParentId ?? undefined,
        // Header fields
        _311CaseNumber: input.caseNumber311,
        unitNumber: input.unitNumber,
        facilityName: input.facilityName,
        facilityOwnership: input.facilityOwnership,
        // Details
        complaintType: input.complaintType,
        complaintSubtype: input.complaintSubtype,
        methodReceived: input.methodReceived,
        assignedProgram: input.assignedProgram,
        dateAssigned: input.dateAssigned,
        dateClosed: input.dateClosed,
        // Complainant
        complainantAnonymous: isAnon,
        complainantName: isAnon ? undefined : input.complainantName,
        complainantPhone: isAnon ? undefined : input.complainantPhone,
        complainantEmail: isAnon ? undefined : input.complainantEmail,
        complainantAddress: isAnon ? undefined : input.complainantAddress,
        complainantContactDates: isAnon ? undefined : input.complainantContactDates,
      },
    });

    const chronologySummary = isLinked
      ? `Additional complaint received — ${input.description.slice(0, 300)}`
      : `Complaint received — ${input.description.slice(0, 300)}`;
    const chronologyComplaintId = isLinked ? input.threadParentId! : record.id;

    await Chronology.create({
      record: {
        summary: chronologySummary,
        entryDate: today,
        entryType: 'Other',
        createdBy: context.user.email,
        complaint: chronologyComplaintId,
        sourceRecord: `Intake — ${today}`,
        visibility: 'Public',
      },
    });

    return { id: record.id, complaintId, success: true };
  },
});
