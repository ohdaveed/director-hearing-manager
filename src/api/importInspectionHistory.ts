/**
 * importInspectionHistory.ts
 *
 * Imports selected submitted inspections into the hearing packet:
 *  1. Dedup-checks existing chronology entries via relatedInspection links
 *  2. Maps violation categories to SFHC Article 11 citation codes
 *  3. Bulk-creates chronology entries with narrative templates
 *  4. Creates exhibit records for inspection reports (est. 5 pages)
 *  5. Creates exhibit records for grouped photos (1 page per photo)
 *  6. Assigns sequential Bates ranges and exhibit letters
 */

import { z } from 'zod';
import {
  createEndpoint,
  HearingPackets,
  Inspections,
  Violations,
  InspectionPhotos,
  Chronology,
  Exhibits,
} from 'zite-integrations-backend-sdk';
import type { ChronologyRecordType, ExhibitsRecordType } from 'zite-integrations-backend-sdk';

// ── Helpers ────────────────────────────────────────────────────────────────

function getLinkedId(field: unknown): string | undefined {
  if (typeof field === 'string') return field;
  if (Array.isArray(field)) return field[0];
  return undefined;
}

function padBates(n: number): string {
  return n.toString().padStart(3, '0');
}

function batesRange(start: number, count: number): string {
  if (count <= 0) count = 1;
  return `${padBates(start)}–${padBates(start + count - 1)}`;
}

function exhibitLetter(idx: number): string {
  return idx < 26 ? String.fromCharCode(65 + idx) : `(${idx + 1})`;
}

// ── Violation category → SFHC Article 11 mapping ──────────────────────────

const CAT_TO_SFHC: Record<string, string> = {
  // Insects & pests
  'Bed Bugs': '§ 581(b)(8)',
  'Cockroaches': '§ 581(b)(8)',
  'Flies': '§ 581(b)(8)',
  'Mosquitoes': '§ 581(b)(8)',
  'Noxious Insects / Vermin': '§ 581(b)(8)',
  'Animals and Pests': '§ 581(b)(8)',
  // Birds
  'Pigeons': '§ 581(b)(7)',
  // Plants
  'Poison Oak': '§ 581(b)(11)',
  'Overgrown Vegetation': '§ 581(b)(2)',
  'Vegetation': '§ 581(b)(2)',
  // Rodents
  'Rodents': '§ 581(b)(13)',
  // Refuse / garbage
  'Garbage / Refuse / Waste / Debris': '§ 581(b)(1)',
  'Garbage / Refuse / Waste': '§ 581(b)(1)',
  'Refuse': '§ 581(b)(1)',
  'Inadequate Garbage Containers / Lids': '§ 581(b)(1)',
  'Uncontainerized Garbage': '§ 581(b)(1)',
  // Sewage
  'Human / Animal Waste (Sewage)': '§ 581(b)(5)',
  // Unsanitary
  'Unsanitary Bathroom / Toilet': '§ 581(b)(4)',
  'Unsanitary Floor, Walls & Ceiling': '§ 581(b)(4)',
  'Unsanitary Hallways': '§ 581(b)(4)',
  'Unsanitary Common Kitchen': '§ 581(b)(4)',
  'Unsanitary Conditions': '§ 581(b)(4)',
  'Sanitation': '§ 581(b)(4)',
  // Mold
  'Mold Growth': '§ 581(b)(6)',
  // Paper / accumulation
  'Accumulation of Paper Materials': '§ 581(b)(3)',
  'Excessive Materials': '§ 581(b)(3)',
  // Public health
  'Air Pollutants and Odors': '§ 581(b)(18)',
  'Building Conditions': '§ 581(b)(18)',
  'Public Health Safety Threat': '§ 581(b)(18)',
  // Fees
  'Unpaid Fees': '§ 609',
};

/** Resolve the best SFHC code for a violation, preferring a stored violationCode. */
function resolveSfhc(
  category?: string,
  violationCode?: string,
): string | undefined {
  if (violationCode && violationCode.startsWith('§')) return violationCode;
  if (category) return CAT_TO_SFHC[category];
  return undefined;
}

// ── Endpoint ───────────────────────────────────────────────────────────────

export default createEndpoint({
  description: 'Import selected past inspections into the hearing packet chronology and exhibits',
  inputSchema: z.object({
    packetId: z.string(),
    inspectionIds: z.array(z.string()).min(1),
  }),
  outputSchema: z.object({
    imported: z.number(),
    skipped: z.number(),
    chronologyEntriesCreated: z.number(),
    exhibitsCreated: z.number(),
  }),
  execute: async ({ input, context }) => {
    const packet = await HearingPackets.findOne({ id: input.packetId });
    if (!packet) throw new Error('Packet not found');

    const complaintId = getLinkedId(packet.complaint);
    if (!complaintId) throw new Error('No complaint linked to this packet');

    const batesStartVal = packet.batesStart ?? 1;

    // ── Load existing data in parallel ──────────────────────────────────
    const [chronoRes, existingExhibitsRes, inspRes, violRes, photoRes] =
      await Promise.all([
        Chronology.findAll({
          filters: { complaint: complaintId },
          limit: 500,
          fields: ['relatedInspection', 'chronologyOrder'],
        }),
        Exhibits.findAll({
          filters: { complaint: complaintId },
          limit: 500,
          fields: ['sortOrder', 'pageCount'],
        }),
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
          fields: ['id', 'inspection', 'photoUrl'],
        }),
      ]);

    // ── Build dedup set ──────────────────────────────────────────────────
    const alreadyImportedIds = new Set<string>();
    for (const c of chronoRes.records) {
      const id = getLinkedId(c.relatedInspection);
      if (id) alreadyImportedIds.add(id);
    }

    // ── Group violations & photos by inspection ID ───────────────────────
    const violsByInsp = new Map<string, typeof violRes.records>();
    for (const v of violRes.records) {
      const iid = getLinkedId(v.inspection);
      if (!iid) continue;
      if (!violsByInsp.has(iid)) violsByInsp.set(iid, []);
      violsByInsp.get(iid)!.push(v);
    }

    const photosByInsp = new Map<string, typeof photoRes.records>();
    for (const p of photoRes.records) {
      const iid = getLinkedId(p.inspection);
      if (!iid) continue;
      if (!photosByInsp.has(iid)) photosByInsp.set(iid, []);
      photosByInsp.get(iid)!.push(p);
    }

    const inspMap = new Map(inspRes.records.map(i => [i.id, i]));

    // ── Calculate starting Bates position and exhibit index ─────────────
    const sortedExhibits = [...existingExhibitsRes.records].sort(
      (a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999)
    );
    let nextSortOrder =
      (sortedExhibits[sortedExhibits.length - 1]?.sortOrder ?? 0) + 1;
    let currentBates = batesStartVal;
    for (const ex of sortedExhibits) currentBates += ex.pageCount ?? 1;
    let nextExhibitIdx = sortedExhibits.length;

    // Next chronology order
    const maxOrder = chronoRes.records.reduce(
      (m, c) => Math.max(m, c.chronologyOrder ?? 0),
      0
    );
    let nextChronoOrder = maxOrder + 1;

    // Inspector name for narrative
    const inspectorName =
      context.user.firstName && context.user.lastName
        ? `${context.user.firstName} ${context.user.lastName}`
        : context.user.email;

    // ── Build records to create ──────────────────────────────────────────
    const exhibitRecords: Partial<ExhibitsRecordType>[] = [];
    const chronoRecords: Partial<ChronologyRecordType>[] = [];

    let imported = 0;
    let skipped = 0;

    for (const inspId of input.inspectionIds) {
      if (alreadyImportedIds.has(inspId)) {
        skipped++;
        continue;
      }

      const insp = inspMap.get(inspId);
      if (!insp) {
        skipped++;
        continue;
      }

      const violations = violsByInsp.get(inspId) ?? [];
      const photos = photosByInsp.get(inspId) ?? [];

      // Determine primary SFHC code (first resolving violation wins)
      let primaryCode: string | undefined;
      for (const v of violations) {
        const code = resolveSfhc(v.category, v.violationCode);
        if (code) { primaryCode = code; break; }
      }

      // Build narrative
      const inspDate = insp.inspectionDate ?? 'unknown date';
      const byInspector = insp.inspector ?? inspectorName;
      const entryType =
        insp.inspectionType?.toLowerCase().includes('re-inspection')
          ? 'Re-inspection'
          : 'Inspection';

      let narrative: string;
      if (violations.length > 0) {
        const lines = violations.map(v => {
          const code = resolveSfhc(v.category, v.violationCode);
          const obs =
            v.observation || v.violationLabel || v.category || 'condition observed';
          return code
            ? `Verified violation of Section ${code}: ${obs}.`
            : `Observed: ${obs}.`;
        });
        narrative =
          `On-site inspection conducted by ${byInspector}. ` +
          `${violations.length} violation(s) documented. ` +
          lines.join(' ');
      } else {
        narrative =
          `On-site inspection conducted by ${byInspector}. ` +
          `No violations documented during this visit.`;
      }

      // ── Exhibit: inspection report (estimated 5 pages) ─────────────
      const reportPageCount = 5;
      const reportBates = batesRange(currentBates, reportPageCount);
      const reportLabel = `Exhibit ${exhibitLetter(nextExhibitIdx)} — Inspection Report (${inspDate})`;

      exhibitRecords.push({
        exhibitLabel: reportLabel,
        exhibitType: 'Inspection Report',
        description: `Inspection report for ${inspDate} conducted by ${byInspector}`,
        sortOrder: nextSortOrder,
        complaint: complaintId,
        sourceInspection: inspId,
        category: 'Inspection Report',
        exhibitDate: insp.inspectionDate,
        pageCount: reportPageCount,
      });
      currentBates += reportPageCount;
      nextSortOrder++;
      nextExhibitIdx++;

      // ── Exhibit: photos (1 page per photo) ─────────────────────────
      let photosBates: string | undefined;
      if (photos.length > 0) {
        photosBates = batesRange(currentBates, photos.length);
        const photoLabel = `Exhibit ${exhibitLetter(nextExhibitIdx)} — Inspection Photos (${inspDate})`;

        exhibitRecords.push({
          exhibitLabel: photoLabel,
          exhibitType: 'Photo',
          description: `${photos.length} photo(s) from on-site inspection on ${inspDate}`,
          sortOrder: nextSortOrder,
          complaint: complaintId,
          sourceInspection: inspId,
          category: 'Photos',
          exhibitDate: insp.inspectionDate,
          pageCount: photos.length,
        });
        currentBates += photos.length;
        nextSortOrder++;
        nextExhibitIdx++;
      }

      // ── Chronology entry ────────────────────────────────────────────
      chronoRecords.push({
        summary: narrative,
        entryDate: insp.inspectionDate,
        entryType,
        complaint: complaintId,
        relatedInspection: inspId,
        createdBy: inspectorName,
        chronologyOrder: nextChronoOrder,
        attachmentPageRef: reportBates,
        citationCode: primaryCode as ChronologyRecordType['citationCode'],
        violationsObserved:
          violations.length > 0
            ? violations
                .map(v => v.violationLabel || v.category || '')
                .filter(Boolean)
                .join(', ')
            : undefined,
        sourceRecord: input.packetId,
      });
      nextChronoOrder++;
      imported++;
    }

    // ── Persist in bulk (max 100 per call) ──────────────────────────────
    if (exhibitRecords.length > 0) {
      for (let i = 0; i < exhibitRecords.length; i += 100) {
        await Exhibits.bulkCreate({ records: exhibitRecords.slice(i, i + 100) });
      }
    }

    if (chronoRecords.length > 0) {
      for (let i = 0; i < chronoRecords.length; i += 100) {
        await Chronology.bulkCreate({ records: chronoRecords.slice(i, i + 100) });
      }
    }

    return {
      imported,
      skipped,
      chronologyEntriesCreated: chronoRecords.length,
      exhibitsCreated: exhibitRecords.length,
    };
  },
});
