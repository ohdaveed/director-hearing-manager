import { z } from 'zod';
import { createEndpoint, ArrizonOpenComplaintInspectionsList1, Inspections, Violations, Chronology } from 'zite-integrations-backend-sdk';

export default createEndpoint({
  description: 'Update the status of a complaint. Enforces that "Closed — Compliant" requires all violations to be abated.',
  inputSchema: z.object({
    complaintRecordId: z.string(),
    status: z.string(),
    previousStatus: z.string().optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    blocked: z.boolean().optional(),
    unresolvedViolations: z.array(z.string()).optional(),
  }),
  execute: async ({ input, context }) => {
    // Enforce closure rule: all violations must be abated before marking Closed — Compliant
    if (input.status === 'Closed — Compliant') {
      const { records: inspections } = await Inspections.findAll({
        filters: { complaint: input.complaintRecordId },
        limit: 50,
        fields: ['id'],
      });

      if (inspections.length > 0) {
        const violationResults = await Promise.all(
          inspections.map(ins =>
            Violations.findAll({
              filters: { inspection: ins.id, status: 'Violation' },
              limit: 50,
              fields: ['violationLabel', 'deletedAt'],
            })
          )
        );

        const unresolvedViolations = violationResults
          .flatMap(r => r.records)
          .filter(v => !v.deletedAt) // exclude soft-deleted violations
          .map(v => v.violationLabel ?? 'Unknown violation');

        if (unresolvedViolations.length > 0) {
          return { success: false, blocked: true, unresolvedViolations };
        }
      }
    }

    await ArrizonOpenComplaintInspectionsList1.update({
      id: input.complaintRecordId,
      record: { status: input.status },
    });

    // Phase 1: auto-create a chronology entry for this status change
    const today = new Date().toISOString().split('T')[0];
    const fromStatus = input.previousStatus ? ` from "${input.previousStatus}"` : '';
    await Chronology.create({
      record: {
        summary: `Status changed${fromStatus} to "${input.status}".`,
        entryDate: today,
        entryType: 'Other',
        createdBy: context.user.email,
        complaint: input.complaintRecordId,
        sourceRecord: `Status Update — ${today}`,
        visibility: 'Internal',
      },
    });

    return { success: true, blocked: false };
  },
});
