import { z } from 'zod';
import { createEndpoint, InspectionPhotos, ArrizonOpenComplaintInspectionsList1 } from 'zite-integrations-backend-sdk';

export default createEndpoint({
  description: 'Save an inspection photo to the database',
  inputSchema: z.object({
    photoUrl: z.string(),
    photoType: z.enum(['Violation', 'Abatement', 'Memo of Visit', 'General']),
    caption: z.string().optional(),
    violationLabel: z.string().optional(),
    complaintId: z.string().optional(),
    complaintRecordId: z.string().optional(),
    inspector: z.string().optional(),
    // Direct link to the inspection record — eliminates date-window grouping when provided
    inspectionRecordId: z.string().optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    id: z.string().optional(),
  }),
  execute: async ({ input }) => {
    const record = await InspectionPhotos.create({
      record: {
        photoUrl: input.photoUrl,
        photoType: input.photoType,
        caption: input.caption,
        violationLabel: input.violationLabel,
        complaintId: input.complaintId,
        inspector: input.inspector,
        uploadedAt: new Date().toISOString(),
        ...(input.complaintRecordId ? { complaint: input.complaintRecordId } : {}),
        // Link directly to the inspection record when available
        ...(input.inspectionRecordId ? { inspection: input.inspectionRecordId } : {}),
      },
    });

    // Mark attachments = true on the complaint record if we have a complaintId string
    if (input.complaintId?.trim()) {
      const complaint = await ArrizonOpenComplaintInspectionsList1.findOne({
        filters: { complaintId: input.complaintId.trim() },
      });
      if (complaint && !complaint.attachments) {
        await ArrizonOpenComplaintInspectionsList1.update({
          id: complaint.id,
          record: { attachments: true },
        });
      }
    }

    return { success: true, id: record.id };
  },
});
