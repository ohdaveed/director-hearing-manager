import { z } from 'zod';
import { createEndpoint, HearingPackets, ArrizonOpenComplaintInspectionsList1 } from 'zite-integrations-backend-sdk';

/** Safely extract an ID from a linked-record field (string or string[]) */
function getLinkedId(field: unknown): string | undefined {
  if (typeof field === 'string') return field;
  if (Array.isArray(field)) return field[0];
  return undefined;
}

export default createEndpoint({
  description: 'Get all hearing packets with linked complaint info',
  inputSchema: z.object({
    statusFilter: z.string().optional(),
    assignedToFilter: z.string().optional(),
  }),
  outputSchema: z.object({
    packets: z.array(z.object({
      id: z.string(),
      hearingDate: z.string().optional(),
      packetStatus: z.string().optional(),
      assignedTo: z.string().optional(),
      notes: z.string().optional(),
      generatedAt: z.string().optional(),
      caseNumber: z.string().optional(),
      programCode: z.string().optional(),
      proposedActions: z.array(z.string()).optional(),
      hearingTime: z.string().optional(),
      hearingLocation: z.string().optional(),
      adminFee: z.string().optional(),
      checklistData: z.string().optional(),
      enforcementFlags: z.string().optional(),
      complaintRecordId: z.string().optional(),
      complaintId: z.string().optional(),
      address: z.string().optional(),
      hearingStatus: z.string().optional(),
      revisionNotes: z.string().optional(),
      statusHistory: z.string().optional(),
    })),
  }),
  execute: async ({ input }) => {
    const filters: Record<string, string> = {};
    if (input.statusFilter) filters.packetStatus = input.statusFilter;
    if (input.assignedToFilter) filters.assignedTo = input.assignedToFilter;

    // Step 1: fetch packets — only those linked to a complaint (excludes orphaned/sample records)
    const packetsResult = await HearingPackets.findAll({ filters, limit: 200 });
    // Filter out orphaned packets with no complaint link
    packetsResult.records = packetsResult.records.filter(r => {
      const cId = getLinkedId(r.complaint);
      return !!cId;
    });

    // Step 2: collect only the complaint IDs actually referenced by these packets
    const complaintIds = [
      ...new Set(
        packetsResult.records
          .map(r => getLinkedId(r.complaint))
          .filter((id): id is string => !!id)
      ),
    ];

    // Step 3: fetch only those specific complaints (avoids loading all 500+)
    const complaintsResult = complaintIds.length > 0
      ? await ArrizonOpenComplaintInspectionsList1.findAll({
          filters: { id: { in: complaintIds } },
          fields: ['complaintId', 'address', 'hearingStatus'],
          limit: complaintIds.length,
        })
      : { records: [] as Awaited<ReturnType<typeof ArrizonOpenComplaintInspectionsList1.findAll>>['records'] };

    const complaintMap = new Map(
      complaintsResult.records.map(c => [
        c.id,
        { complaintId: c.complaintId, address: c.address, hearingStatus: c.hearingStatus },
      ])
    );

    return {
      packets: packetsResult.records.map(r => {
        const cId = getLinkedId(r.complaint);
        const comp = cId ? complaintMap.get(cId) : undefined;
        return {
          id: r.id,
          hearingDate: r.hearingDate,
          packetStatus: r.packetStatus,
          assignedTo: r.assignedTo,
          notes: r.notes,
          generatedAt: r.generatedAt,
          caseNumber: r.caseNumber,
          programCode: r.programCode,
          proposedActions: r.proposedActions as string[] | undefined,
          hearingTime: r.hearingTime,
          hearingLocation: r.hearingLocation,
          adminFee: r.adminFee,
          checklistData: r.checklistData,
          enforcementFlags: r.enforcementFlags,
          complaintRecordId: cId,
          complaintId: comp?.complaintId,
          address: comp?.address,
          hearingStatus: comp?.hearingStatus,
          revisionNotes: r.revisionNotes,
          statusHistory: r.statusHistory,
        };
      }),
    };
  },
});
