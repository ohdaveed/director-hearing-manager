import { z } from 'zod';
import { createEndpoint, ArrizonOpenComplaintInspectionsList1, Inspections, InspectionPhotos, Locations, Chronology, ZiteError } from 'zite-integrations-backend-sdk';

export default createEndpoint({
  description: 'Get full detail for a complaint including inspection history, photos, responsible party info, and chronology',
  inputSchema: z.object({ complaintRecordId: z.string() }),
  outputSchema: z.object({
    complaint: z.object({
      id: z.string(),
      complaintId: z.string().optional(),
      address: z.string().optional(),
      description: z.string().optional(),
      status: z.string().optional(),
      category: z.array(z.string()).optional(),
      assignedTo: z.string().optional(),
      reinspectionDueOnAfter: z.string().optional(),
      dateEntered: z.string().optional(),
      dateLastReportSent: z.string().optional(),
      complainantName: z.string().optional(),
      complainantPhone: z.string().optional(),
      complainantEmail: z.string().optional(),
    }),
    inspections: z.array(z.object({
      id: z.string(),
      inspectionDate: z.string().optional(),
      inspector: z.string().optional(),
      inspectionType: z.string().optional(),
      inspectionRating: z.string().optional(),
      status: z.string().optional(),
      violationCount: z.number().optional(),
    })),
    photos: z.array(z.object({
      id: z.string(),
      photoUrl: z.string().optional(),
      photoType: z.string().optional(),
      caption: z.string().optional(),
      uploadedAt: z.string().optional(),
    })),
    responsibleParty: z.object({
      ownerName: z.string().optional(),
      ownerAddress: z.string().optional(),
      ownerPhone: z.string().optional(),
      ownerEmail: z.string().optional(),
    }).optional(),
    draftInspectionId: z.string().optional(),
    locationRecordId: z.string().optional(),
    chronology: z.array(z.object({
      id: z.string(),
      entryDate: z.string().optional(),
      entryType: z.string().optional(),
      summary: z.string().optional(),
      violationsObserved: z.string().optional(),
      exhibitRefs: z.string().optional(),
      attachmentPageRef: z.string().optional(),
      createdBy: z.string().optional(),
      visibility: z.string().optional(),
      chronologyOrder: z.number().optional(),
    })),
  }),
  execute: async ({ input }) => {
    const complaint = await ArrizonOpenComplaintInspectionsList1.findOne({ id: input.complaintRecordId });
    if (!complaint) throw new ZiteError({ code: 'NOT_FOUND', message: 'Complaint not found' });

    const locationRecordId = typeof complaint.location === 'string'
      ? complaint.location
      : (complaint.location as string[] | undefined)?.[0];

    const [inspectionsResult, photosResult, locationRecord, chronologyResult] = await Promise.all([
      Inspections.findAll({ filters: { complaint: input.complaintRecordId }, limit: 50 }),
      complaint.complaintId
        ? InspectionPhotos.findAll({ filters: { complaintId: complaint.complaintId }, limit: 100 })
        : Promise.resolve({ records: [] }),
      locationRecordId
        ? Locations.findOne({ id: locationRecordId })
        : Promise.resolve(undefined),
      Chronology.findAll({ filters: { complaint: input.complaintRecordId }, limit: 200 }),
    ]);

    const inspections = [...inspectionsResult.records].filter(i => !i.deletedAt).sort(
      (a, b) => (b.inspectionDate ?? '').localeCompare(a.inspectionDate ?? '')
    );

    const draftInspection = inspections.find(i => i.status === 'Draft');

    // Sort chronology by chronologyOrder then entryDate
    const sortedChronology = [...chronologyResult.records].sort((a, b) => {
      if (a.chronologyOrder != null && b.chronologyOrder != null) {
        return a.chronologyOrder - b.chronologyOrder;
      }
      return (a.entryDate ?? '').localeCompare(b.entryDate ?? '');
    });

    return {
      complaint: {
        id: complaint.id,
        complaintId: complaint.complaintId,
        address: complaint.address,
        description: complaint.description,
        status: complaint.status,
        category: complaint.category ?? [],
        assignedTo: complaint.assignedTo,
        reinspectionDueOnAfter: complaint.reinspectionDueOnAfter,
        dateEntered: complaint.dateEntered,
        dateLastReportSent: complaint.dateLastReportSent,
        complainantName: complaint.complainantName,
        complainantPhone: complaint.complainantPhone,
        complainantEmail: complaint.complainantEmail,
      },
      inspections: inspections.map(i => ({
        id: i.id,
        inspectionDate: i.inspectionDate,
        inspector: i.inspector,
        inspectionType: i.inspectionType,
        inspectionRating: i.inspectionRating,
        status: i.status,
        violationCount: i.violationCount,
      })),
      photos: photosResult.records.map(p => ({
        id: p.id,
        photoUrl: p.photoUrl,
        photoType: p.photoType,
        caption: p.caption,
        uploadedAt: p.uploadedAt,
      })),
      responsibleParty: locationRecord ? {
        ownerName: locationRecord.ownerName,
        ownerAddress: locationRecord.ownerAddress,
        ownerPhone: locationRecord.ownerPhone,
        ownerEmail: locationRecord.ownerEmail,
      } : undefined,
      draftInspectionId: draftInspection?.id,
      locationRecordId,
      chronology: sortedChronology
        .filter(c => c.visibility !== 'Internal')
        .map(c => ({
          id: c.id,
          entryDate: c.entryDate,
          entryType: c.entryType,
          summary: c.summary,
          violationsObserved: c.violationsObserved,
          exhibitRefs: c.exhibitRefs,
          attachmentPageRef: c.attachmentPageRef,
          createdBy: c.createdBy,
          visibility: c.visibility,
          chronologyOrder: c.chronologyOrder,
        })),
    };
  },
});
