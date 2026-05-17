import { z } from 'zod';
import { createEndpoint, ImportedReports, Violations } from 'zite-integrations-backend-sdk';

const violationSchema = z.object({
  id: z.string(),
  violationLabel: z.string().optional(),
  violationCode: z.string().optional(),
  locationInProperty: z.string().optional(),
  correctiveAction: z.string().optional(),
  dueDate: z.string().optional(),
});

const reportSchema = z.object({
  id: z.string(),
  reportTitle: z.string().optional(),
  inspectionDate: z.string().optional(),
  inspectionType: z.string().optional(),
  inspectionRating: z.string().optional(),
  inspectorName: z.string().optional(),
  violationCount: z.number().optional(),
  parsingStatus: z.string().optional(),
  uploadedBy: z.string().optional(),
  uploadedAt: z.string().optional(),
  pdfUrl: z.string().optional(),
  linkedInspectionId: z.string().optional(),
  violations: z.array(violationSchema),
});

export default createEndpoint({
  description: 'Get all imported PDF reports for a location',
  inputSchema: z.object({ locationId: z.string() }),
  outputSchema: z.object({ reports: z.array(reportSchema) }),
  execute: async ({ input }) => {
    const { records } = await ImportedReports.findAll({
      filters: { location: input.locationId },
      limit: 200,
    });

    const linkedInspectionIds = records
      .map(r => typeof r.linkedInspection === 'string' ? r.linkedInspection
        : (r.linkedInspection as string[] | undefined)?.[0])
      .filter((id): id is string => Boolean(id));

    let violationsByInspection = new Map<string, any[]>();

    if (linkedInspectionIds.length > 0) {
      for (const inspId of linkedInspectionIds) {
        const { records: viols } = await Violations.findAll({
          filters: { inspection: inspId },
          limit: 100,
        });
        violationsByInspection.set(inspId, viols);
      }
    }

    const reports = records
      .sort((a, b) => (b.uploadedAt ?? '').localeCompare(a.uploadedAt ?? ''))
      .map(r => {
        const inspId = typeof r.linkedInspection === 'string' ? r.linkedInspection
          : (r.linkedInspection as string[] | undefined)?.[0];
        const violations = (inspId ? violationsByInspection.get(inspId) ?? [] : []).map(v => ({
          id: v.id,
          violationLabel: v.violationLabel,
          violationCode: v.violationCode,
          locationInProperty: v.locationInProperty,
          correctiveAction: v.correctiveAction,
          dueDate: v.dueDate,
        }));
        return {
          id: r.id,
          reportTitle: r.reportTitle,
          inspectionDate: r.inspectionDate,
          inspectionType: r.inspectionType,
          inspectionRating: r.inspectionRating,
          inspectorName: r.inspectorName,
          violationCount: r.violationCount,
          parsingStatus: r.parsingStatus,
          uploadedBy: r.uploadedBy,
          uploadedAt: r.uploadedAt,
          pdfUrl: r.pdfFile?.[0]?.url,
          linkedInspectionId: inspId,
          violations,
        };
      });

    return { reports };
  },
});
