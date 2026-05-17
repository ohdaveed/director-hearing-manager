/**
 * listInspectionsForImport.ts
 *
 * Returns all submitted inspections for the complaint linked to a hearing packet,
 * along with their violations, photo thumbnails, and whether each has already been
 * imported into the chronology (via a relatedInspection link).
 */

import { z } from 'zod';
import {
  createEndpoint,
  HearingPackets,
  Inspections,
  Violations,
  InspectionPhotos,
  Chronology,
} from 'zite-integrations-backend-sdk';

function getLinkedId(field: unknown): string | undefined {
  if (typeof field === 'string') return field;
  if (Array.isArray(field)) return field[0];
  return undefined;
}

export default createEndpoint({
  description: 'List submitted inspections available for import into a hearing packet chronology',
  inputSchema: z.object({ packetId: z.string() }),
  outputSchema: z.object({
    inspections: z.array(z.object({
      id: z.string(),
      inspectionDate: z.string().optional(),
      inspector: z.string().optional(),
      inspectionType: z.string().optional(),
      inspectionRating: z.string().optional(),
      violationCount: z.number(),
      photoCount: z.number(),
      violations: z.array(z.object({
        id: z.string(),
        label: z.string().optional(),
        category: z.string().optional(),
        violationCode: z.string().optional(),
        observation: z.string().optional(),
      })),
      photoThumbnails: z.array(z.string()),
      alreadyImported: z.boolean(),
    })),
  }),
  execute: async ({ input }) => {
    const packet = await HearingPackets.findOne({ id: input.packetId });
    if (!packet) throw new Error('Packet not found');

    const complaintId = getLinkedId(packet.complaint);
    if (!complaintId) return { inspections: [] };

    // Fetch all data in parallel to minimise round-trips
    const [inspRes, violRes, photoRes, chronoRes] = await Promise.all([
      Inspections.findAll({
        filters: { complaint: complaintId, status: 'Submitted' },
        limit: 200,
      }),
      Violations.findAll({
        filters: { complaint: complaintId },
        limit: 500,
      }),
      InspectionPhotos.findAll({
        filters: { complaint: complaintId },
        limit: 500,
        fields: ['id', 'photoUrl', 'inspection', 'photoType'],
      }),
      Chronology.findAll({
        filters: { complaint: complaintId },
        limit: 500,
        fields: ['relatedInspection'],
      }),
    ]);

    // Build set of already-imported inspection IDs
    const importedInspectionIds = new Set<string>();
    for (const entry of chronoRes.records) {
      const id = getLinkedId(entry.relatedInspection);
      if (id) importedInspectionIds.add(id);
    }

    // Group violations by inspection ID
    const violsByInspection = new Map<string, typeof violRes.records>();
    for (const v of violRes.records) {
      const inspId = getLinkedId(v.inspection);
      if (!inspId) continue;
      if (!violsByInspection.has(inspId)) violsByInspection.set(inspId, []);
      violsByInspection.get(inspId)!.push(v);
    }

    // Group photos by inspection ID
    const photosByInspection = new Map<string, typeof photoRes.records>();
    for (const p of photoRes.records) {
      const inspId = getLinkedId(p.inspection);
      if (!inspId) continue;
      if (!photosByInspection.has(inspId)) photosByInspection.set(inspId, []);
      photosByInspection.get(inspId)!.push(p);
    }

    const inspections = inspRes.records.map(insp => {
      const violations = violsByInspection.get(insp.id) ?? [];
      const photos = photosByInspection.get(insp.id) ?? [];

      return {
        id: insp.id,
        inspectionDate: insp.inspectionDate,
        inspector: insp.inspector,
        inspectionType: insp.inspectionType,
        inspectionRating: insp.inspectionRating,
        violationCount: violations.length,
        photoCount: photos.length,
        violations: violations.slice(0, 12).map(v => ({
          id: v.id,
          label: v.violationLabel,
          category: v.category,
          violationCode: v.violationCode,
          observation: v.observation,
        })),
        photoThumbnails: photos
          .slice(0, 4)
          .map(p => p.photoUrl ?? '')
          .filter(Boolean),
        alreadyImported: importedInspectionIds.has(insp.id),
      };
    });

    // Sort newest first
    inspections.sort((a, b) =>
      (b.inspectionDate ?? '').localeCompare(a.inspectionDate ?? '')
    );

    return { inspections };
  },
});
