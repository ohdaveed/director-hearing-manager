import { z } from 'zod';
import {
  createEndpoint,
  HearingPackets,
  Chronology,
  Exhibits,
  ArrizonOpenComplaintInspectionsList1,
  Locations,
} from 'zite-integrations-backend-sdk';

function getLinkedId(field: unknown): string | undefined {
  if (typeof field === 'string') return field;
  if (Array.isArray(field)) return field[0];
  return undefined;
}

export default createEndpoint({
  description: 'Fetch chronology entries, exhibits, and packet/location metadata for the chronology workspace',
  inputSchema: z.object({ packetId: z.string() }),
  outputSchema: z.object({
    complaintId: z.string().optional(),
    packetMeta: z.object({
      hearingDate: z.string().optional(),
      hearingTime: z.string().optional(),
      caseNumber: z.string().optional(),
      programCode: z.string().optional(),
      batesStart: z.number().optional(),
    }).optional(),
    locationMeta: z.object({
      address: z.string().optional(),
      blockLot: z.string().optional(),
      facilityType: z.string().optional(),
      numberOfUnits: z.number().optional(),
      ownerName: z.string().optional(),
      ownerPhone: z.string().optional(),
      ownerEmail: z.string().optional(),
      responsibleParty: z.string().optional(),
      responsiblePartyPhone: z.string().optional(),
      responsiblePartyEmail: z.string().optional(),
    }).optional(),
    chronology: z.array(z.object({
      id: z.string(),
      entryDate: z.string().optional(),
      entryType: z.string().optional(),
      citationCode: z.string().optional(),
      summary: z.string().optional(),
      exhibitRefs: z.string().optional(),
      attachmentPageRef: z.string().optional(),
      chronologyOrder: z.number().optional(),
      createdBy: z.string().optional(),
      visibility: z.string().optional(),
      violationsObserved: z.string().optional(),
    })),
    exhibits: z.array(z.object({
      id: z.string(),
      exhibitLabel: z.string().optional(),
      exhibitType: z.string().optional(),
      description: z.string().optional(),
      sortOrder: z.number().optional(),
      file: z.array(z.object({ url: z.string() })).optional(),
      category: z.string().optional(),
      exhibitDate: z.string().optional(),
      caption: z.string().optional(),
      pageCount: z.number().optional(),
    })),
  }),
  execute: async ({ input }) => {
    const packet = await HearingPackets.findOne({ id: input.packetId });
    if (!packet) throw new Error('Packet not found');

    const complaintId = getLinkedId(packet.complaint);
    if (!complaintId) {
      return { complaintId: undefined, packetMeta: undefined, locationMeta: undefined, chronology: [], exhibits: [] };
    }

    // Fetch complaint, chronology, and exhibits in parallel
    const [chronoRes, exhibitsRes, complaint] = await Promise.all([
      Chronology.findAll({ filters: { complaint: complaintId }, limit: 200 }),
      Exhibits.findAll({ filters: { complaint: complaintId }, limit: 200 }),
      ArrizonOpenComplaintInspectionsList1.findOne({ id: complaintId }),
    ]);

    // Fetch location after we have the complaint
    const locationId = getLinkedId(complaint?.location);
    const location = locationId ? await Locations.findOne({ id: locationId }) : undefined;

    const sortedChrono = [...chronoRes.records].sort((a, b) => {
      if (a.chronologyOrder != null && b.chronologyOrder != null) return a.chronologyOrder - b.chronologyOrder;
      if (a.chronologyOrder != null) return -1;
      if (b.chronologyOrder != null) return 1;
      return (a.entryDate ?? '').localeCompare(b.entryDate ?? '');
    });

    const sortedExhibits = [...exhibitsRes.records].sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));

    return {
      complaintId,
      packetMeta: {
        hearingDate: packet.hearingDate,
        hearingTime: packet.hearingTime,
        caseNumber: packet.caseNumber,
        programCode: packet.programCode,
        batesStart: packet.batesStart,
      },
      locationMeta: location ? {
        address: location.address,
        blockLot: location.blockLot,
        facilityType: location.facilityType,
        numberOfUnits: location.numberOfUnits,
        ownerName: location.ownerName,
        ownerPhone: location.ownerPhone,
        ownerEmail: location.ownerEmail,
        responsibleParty: location.responsibleParty,
        responsiblePartyPhone: location.responsiblePartyPhone,
        responsiblePartyEmail: location.responsiblePartyEmail,
      } : undefined,
      chronology: sortedChrono.map(c => ({
        id: c.id,
        entryDate: c.entryDate,
        entryType: c.entryType,
        citationCode: (c as Record<string, unknown>).citationCode as string | undefined,
        summary: c.summary,
        exhibitRefs: c.exhibitRefs,
        attachmentPageRef: c.attachmentPageRef,
        chronologyOrder: c.chronologyOrder,
        createdBy: c.createdBy,
        visibility: c.visibility,
        violationsObserved: c.violationsObserved,
      })),
      exhibits: sortedExhibits.map(e => ({
        id: e.id,
        exhibitLabel: e.exhibitLabel,
        exhibitType: e.exhibitType,
        description: e.description,
        sortOrder: e.sortOrder,
        file: e.file,
        category: e.category,
        exhibitDate: e.exhibitDate,
        caption: e.caption,
        pageCount: (e as Record<string, unknown>).pageCount as number | undefined,
      })),
    };
  },
});
