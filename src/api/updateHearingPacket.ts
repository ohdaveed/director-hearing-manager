import { z } from 'zod';
import { createEndpoint, ZiteError, HearingPackets, Chronology } from 'zite-integrations-backend-sdk';

const FINALIZING_STATUSES = ['Complete', 'Submitted'];

function getLinkedId(field: unknown): string | undefined {
  if (typeof field === 'string') return field;
  if (Array.isArray(field)) return field[0];
  return undefined;
}

interface StatusHistoryEntry {
  timestamp: string;
  userName: string;
  fromStatus: string;
  toStatus: string;
  action: string;
  notes?: string;
}

function parseStatusHistory(raw: string | undefined): StatusHistoryEntry[] {
  if (!raw) return [];
  try { return JSON.parse(raw) as StatusHistoryEntry[]; } catch { return []; }
}

export default createEndpoint({
  description: 'Update hearing packet fields. When finalizing, validates required fields and writes a frozen chronology snapshot. All status changes are recorded in the immutable status history audit trail.',
  inputSchema: z.object({
    packetId: z.string(),
    packetStatus: z.string().optional(),
    notes: z.string().optional(),
    caseNumber: z.string().optional(),
    programCode: z.string().optional(),
    proposedActions: z.array(z.string()).optional(),
    hearingTime: z.string().optional(),
    hearingLocation: z.string().optional(),
    adminFee: z.string().optional(),
    checklistData: z.string().optional(),
    enforcementFlags: z.string().optional(),
    // Return-for-revision flow
    returnForRevision: z.boolean().optional(),
    revisionNotes: z.string().optional(),
  }),
  outputSchema: z.object({ success: z.boolean(), snapshotFrozen: z.boolean().optional() }),
  execute: async ({ input, context }) => {
    const userName = [context.user.firstName, context.user.lastName].filter(Boolean).join(' ') || context.user.email;
    const record: Record<string, unknown> = {};

    // ── Return for Revision (PM/Super Admin action) ──────────────────────────
    if (input.returnForRevision) {
      const existingPacket = await HearingPackets.findOne({ id: input.packetId });
      if (!existingPacket) throw new ZiteError({ code: 'NOT_FOUND', message: 'Packet not found' });

      const history = parseStatusHistory(existingPacket.statusHistory);
      const entry: StatusHistoryEntry = {
        timestamp: new Date().toISOString(),
        userName,
        fromStatus: existingPacket.packetStatus ?? 'Unknown',
        toStatus: 'In Progress',
        action: 'returned_for_revision',
        notes: input.revisionNotes || undefined,
      };
      await HearingPackets.update({
        id: input.packetId,
        record: {
          packetStatus: 'In Progress',
          revisionNotes: input.revisionNotes ?? '',
          statusHistory: JSON.stringify([...history, entry]),
        } as never,
      });
      return { success: true };
    }

    // ── Regular field updates ────────────────────────────────────────────────
    if (input.notes !== undefined) record.notes = input.notes;
    if (input.caseNumber !== undefined) record.caseNumber = input.caseNumber;
    if (input.programCode !== undefined) record.programCode = input.programCode;
    if (input.proposedActions !== undefined) record.proposedActions = input.proposedActions;
    if (input.hearingTime !== undefined) record.hearingTime = input.hearingTime;
    if (input.hearingLocation !== undefined) record.hearingLocation = input.hearingLocation;
    if (input.adminFee !== undefined) record.adminFee = input.adminFee;
    if (input.checklistData !== undefined) record.checklistData = input.checklistData;
    if (input.enforcementFlags !== undefined) record.enforcementFlags = input.enforcementFlags;

    let snapshotFrozen = false;

    // ── Status change handling (audit trail + optional finalization) ─────────
    if (input.packetStatus !== undefined) {
      record.packetStatus = input.packetStatus;

      const existingPacket = await HearingPackets.findOne({ id: input.packetId });
      if (!existingPacket) throw new ZiteError({ code: 'NOT_FOUND', message: 'Packet not found' });

      // Append audit entry whenever status actually changes
      if (input.packetStatus !== existingPacket.packetStatus) {
        const history = parseStatusHistory(existingPacket.statusHistory);
        let action = 'status_change';
        if (input.packetStatus === 'Under Review') action = 'sent_to_review';
        else if (input.packetStatus === 'Complete') action = 'marked_complete';
        else if (input.packetStatus === 'Submitted') action = 'submitted';
        else if (input.packetStatus === 'In Progress') action = 'in_progress';

        const entry: StatusHistoryEntry = {
          timestamp: new Date().toISOString(),
          userName,
          fromStatus: existingPacket.packetStatus ?? 'Not Started',
          toStatus: input.packetStatus,
          action,
        };
        record.statusHistory = JSON.stringify([...history, entry]);
      }

      // Sending to review clears revision notes
      if (input.packetStatus === 'Under Review') {
        record.revisionNotes = '';
      }

      // Finalization: validate required fields + freeze chronology snapshot
      if (FINALIZING_STATUSES.includes(input.packetStatus)) {
        const effectiveCaseNumber = (input.caseNumber ?? existingPacket.caseNumber)?.trim();
        const effectiveHearingLocation = (input.hearingLocation ?? existingPacket.hearingLocation)?.trim();
        const effectiveProposedActions = input.proposedActions ?? (existingPacket.proposedActions as string[] | undefined);

        const missing: string[] = [];
        if (!effectiveCaseNumber) missing.push('Case Number');
        if (!existingPacket.hearingDate) missing.push('Hearing Date');
        if (!effectiveHearingLocation) missing.push('Hearing Location');
        if (!effectiveProposedActions || effectiveProposedActions.length === 0) {
          missing.push('at least one Proposed Action');
        }

        if (missing.length > 0) {
          throw new ZiteError({
            code: 'BAD_REQUEST',
            message: `Cannot finalize packet — please fill in: ${missing.join(', ')}.`,
          });
        }

        // Generate a frozen chronology snapshot once (idempotent)
        if (!existingPacket.chronologySnapshot) {
          const complaintId = getLinkedId(existingPacket.complaint);
          if (complaintId) {
            const { records: chronoRecords } = await Chronology.findAll({
              filters: { complaint: complaintId, visibility: 'Public' },
              limit: 200,
            });

            const sorted = chronoRecords.sort((a, b) =>
              (a.entryDate ?? '').localeCompare(b.entryDate ?? '')
            );

            const snapshot = sorted
              .map(c => `${c.entryDate ?? '—'}  |  ${c.entryType ?? 'Event'}  |  ${c.sourceRecord ? `[${c.sourceRecord}]  ` : ''}${c.summary ?? ''}`)
              .join('\n');

            record.chronologySnapshot = snapshot;

            const now = new Date().toISOString();
            const toFreeze = sorted.filter(c => !c.frozenAt);
            if (toFreeze.length > 0) {
              const chunkSize = 100;
              for (let i = 0; i < toFreeze.length; i += chunkSize) {
                const chunk = toFreeze.slice(i, i + chunkSize);
                await Chronology.bulkCreate({
                  records: chunk.map(c => ({ id: c.id, frozenAt: now })),
                  matchOn: ['id'],
                });
              }
            }
            snapshotFrozen = true;
          }
        }
      }
    }

    await HearingPackets.update({ id: input.packetId, record: record as never });
    return { success: true, snapshotFrozen };
  },
});
