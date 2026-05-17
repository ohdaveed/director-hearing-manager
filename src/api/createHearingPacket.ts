import { z } from 'zod';
import { createEndpoint, HearingPackets, ArrizonOpenComplaintInspectionsList1 } from 'zite-integrations-backend-sdk';

/** Safely extract an ID from a linked-record field (string or string[]) */
function getLinkedId(field: unknown): string | undefined {
  if (typeof field === 'string') return field;
  if (Array.isArray(field)) return field[0];
  return undefined;
}

export default createEndpoint({
  description: 'Create a hearing packet for a complaint. Returns existing packet ID if one already exists.',
  inputSchema: z.object({
    complaintRecordId: z.string(),
  }),
  outputSchema: z.object({
    packetId: z.string(),
    created: z.boolean(),
  }),
  execute: async ({ input }) => {
    const complaint = await ArrizonOpenComplaintInspectionsList1.findOne({ id: input.complaintRecordId });
    if (!complaint) throw new Error('Complaint not found');

    // Check if a packet already exists
    const existingId = getLinkedId(complaint.hearingPackets);

    if (existingId) {
      return { packetId: existingId, created: false };
    }

    // Create a new packet pre-populated from complaint data
    const packet = await HearingPackets.create({
      record: {
        hearingDate: complaint.hearingDate,
        assignedTo: complaint.assignedTo,
        packetStatus: 'Not Started',
        complaint: complaint.id,
      },
    });

    return { packetId: packet.id, created: true };
  },
});
