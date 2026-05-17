import { z } from 'zod';
import { createEndpoint, ImportedReports, Inspections, Violations } from 'zite-integrations-backend-sdk';
import Anthropic from '@anthropic-ai/sdk';

const violationOut = z.object({
  violationLabel: z.string().optional(),
  violationCode: z.string().optional(),
  locationInProperty: z.string().optional(),
  correctiveAction: z.string().optional(),
  dueDate: z.string().optional(),
});

export default createEndpoint({
  description: 'Parse a PDF inspection report with Claude and store structured data',
  inputSchema: z.object({
    locationId: z.string(),
    pdfUrl: z.string().optional(),
    pdfBase64: z.string(),
    fileName: z.string(),
    uploadedBy: z.string(),
  }),
  outputSchema: z.object({
    id: z.string(),
    reportTitle: z.string(),
    parsingStatus: z.string(),
    inspectionDate: z.string().optional(),
    inspectionType: z.string().optional(),
    inspectionRating: z.string().optional(),
    inspectorName: z.string().optional(),
    violationCount: z.number().optional(),
    pdfUrl: z.string().optional(),
    linkedInspectionId: z.string().optional(),
    violations: z.array(violationOut).optional(),
  }),
  execute: async ({ input }) => {
    const reportTitle = input.fileName.replace(/\.pdf$/i, '');

    const report = await ImportedReports.create({
      record: {
        reportTitle,
        location: input.locationId,
        pdfFile: input.pdfUrl ? [{ url: input.pdfUrl }] : undefined,
        parsingStatus: 'Pending',
        uploadedBy: input.uploadedBy,
        uploadedAt: new Date().toISOString(),
      },
    });

    try {
      const client = new Anthropic({ apiKey: process.env.ZITE_ANTHROPIC_ACCESS_TOKEN });

      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: `You are a data extraction assistant for environmental health inspection reports.
Extract structured data from the provided PDF and return ONLY a valid JSON object with no other text:
{
  "inspectionDate": "YYYY-MM-DD or null",
  "inspectionType": "Routine|Complaint|Routine Re-inspection|Complaint Re-inspection|Field Consultation / Survey or null",
  "inspectionRating": "Satisfactory|Unsatisfactory or null",
  "inspectorName": "string or null",
  "violations": [
    {
      "violationLabel": "brief description",
      "violationCode": "code or null",
      "locationInProperty": "location in property or null",
      "correctiveAction": "required action or null",
      "dueDate": "YYYY-MM-DD or null"
    }
  ]
}
Use null for any field not found. Return only the JSON.`,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: input.pdfBase64 },
            } as any,
            { type: 'text', text: 'Extract inspection data from this report as JSON.' },
          ],
        }],
      });

      const text = message.content[0].type === 'text' ? message.content[0].text : '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON returned');
      const parsed = JSON.parse(jsonMatch[0]);

      const violations: any[] = parsed.violations ?? [];

      const inspection = await Inspections.create({
        record: {
          location: input.locationId,
          inspectionDate: parsed.inspectionDate ?? undefined,
          inspectionType: parsed.inspectionType ?? 'Imported',
          inspectionRating: parsed.inspectionRating ?? undefined,
          inspector: parsed.inspectorName ?? undefined,
          status: 'Submitted',
        },
      });

      let createdViolations: any[] = [];
      if (violations.length > 0) {
        const vRecords = violations.map((v: any) => ({
          violationLabel: v.violationLabel ?? 'Violation',
          violationCode: v.violationCode ?? undefined,
          locationInProperty: v.locationInProperty ?? undefined,
          correctiveAction: v.correctiveAction ?? undefined,
          dueDate: v.dueDate ?? undefined,
          inspection: inspection.id,
          status: 'Violation',
        }));
        const result = await Violations.bulkCreate({ records: vRecords.slice(0, 100) });
        createdViolations = result.records.map(r => ({ ...r.fields, id: r.id }));
      }

      const finalTitle = parsed.inspectionDate
        ? `${parsed.inspectionType ?? 'Inspection'} — ${parsed.inspectionDate}`
        : reportTitle;

      await ImportedReports.update({
        id: report.id,
        record: {
          reportTitle: finalTitle,
          inspectionDate: parsed.inspectionDate ?? undefined,
          inspectionType: parsed.inspectionType ?? undefined,
          inspectionRating: parsed.inspectionRating ?? undefined,
          inspectorName: parsed.inspectorName ?? undefined,
          violationCount: violations.length,
          parsingStatus: 'Parsed',
          linkedInspection: inspection.id,
        },
      });

      return {
        id: report.id,
        reportTitle: finalTitle,
        parsingStatus: 'Parsed',
        inspectionDate: parsed.inspectionDate ?? undefined,
        inspectionType: parsed.inspectionType ?? undefined,
        inspectionRating: parsed.inspectionRating ?? undefined,
        inspectorName: parsed.inspectorName ?? undefined,
        violationCount: violations.length,
        pdfUrl: input.pdfUrl,
        linkedInspectionId: inspection.id,
        violations: createdViolations.map((v: any) => ({
          violationLabel: v.violationLabel,
          violationCode: v.violationCode,
          locationInProperty: v.locationInProperty,
          correctiveAction: v.correctiveAction,
          dueDate: v.dueDate,
        })),
      };
    } catch {
      await ImportedReports.update({ id: report.id, record: { parsingStatus: 'Failed' } });
      return { id: report.id, reportTitle, parsingStatus: 'Failed', pdfUrl: input.pdfUrl };
    }
  },
});
