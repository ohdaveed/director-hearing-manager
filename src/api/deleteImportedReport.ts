import { z } from 'zod';
import { createEndpoint, ImportedReports, Inspections, Violations } from 'zite-integrations-backend-sdk';

export default createEndpoint({
  description: 'Delete an imported report and all its associated inspection and violation records',
  inputSchema: z.object({ reportId: z.string() }),
  outputSchema: z.object({ success: z.boolean() }),
  execute: async ({ input }) => {
    const report = await ImportedReports.findOne({ id: input.reportId });
    if (!report) return { success: true };

    const inspectionId = typeof report.linkedInspection === 'string'
      ? report.linkedInspection
      : (report.linkedInspection as string[] | undefined)?.[0];

    if (inspectionId) {
      const { records: violations } = await Violations.findAll({
        filters: { inspection: inspectionId },
        limit: 200,
      });
      await Promise.all(violations.map(v => Violations.delete({ id: v.id })));
      await Inspections.delete({ id: inspectionId });
    }

    await ImportedReports.delete({ id: input.reportId });
    return { success: true };
  },
});
