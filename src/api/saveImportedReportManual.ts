import { z } from 'zod';
import { createEndpoint, ImportedReports, Inspections, Violations } from 'zite-integrations-backend-sdk';

const manualViolationSchema = z.object({
  violationLabel: z.string().optional(),
  violationCode: z.string().optional(),
  locationInProperty: z.string().optional(),
  correctiveAction: z.string().optional(),
  dueDate: z.string().optional(),
});

export default createEndpoint({
  description: 'Manually complete an imported report that failed auto-parsing',
  inputSchema: z.object({
    reportId: z.string(),
    locationId: z.string(),
    inspectionDate: z.string(),
    inspectorName: z.string(),
    inspectionType: z.string(),
    inspectionRating: z.string(),
    violations: z.array(manualViolationSchema),
  }),
  outputSchema: z.object({ success: z.boolean(), linkedInspectionId: z.string() }),
  execute: async ({ input }) => {
    const inspection = await Inspections.create({
      record: {
        location: input.locationId,
        inspectionDate: input.inspectionDate,
        inspectionType: input.inspectionType,
        inspectionRating: input.inspectionRating,
        inspector: input.inspectorName,
        status: 'Submitted',
      },
    });

    if (input.violations.length > 0) {
      const vRecords = input.violations.map(v => ({
        violationLabel: v.violationLabel ?? 'Violation',
        violationCode: v.violationCode ?? undefined,
        locationInProperty: v.locationInProperty ?? undefined,
        correctiveAction: v.correctiveAction ?? undefined,
        dueDate: v.dueDate ?? undefined,
        inspection: inspection.id,
        status: 'Violation',
      }));
      await Violations.bulkCreate({ records: vRecords.slice(0, 100) });
    }

    const finalTitle = `${input.inspectionType} — ${input.inspectionDate}`;

    await ImportedReports.update({
      id: input.reportId,
      record: {
        reportTitle: finalTitle,
        inspectionDate: input.inspectionDate,
        inspectionType: input.inspectionType,
        inspectionRating: input.inspectionRating,
        inspectorName: input.inspectorName,
        violationCount: input.violations.length,
        parsingStatus: 'Manual',
        linkedInspection: inspection.id,
      },
    });

    return { success: true, linkedInspectionId: inspection.id };
  },
});
