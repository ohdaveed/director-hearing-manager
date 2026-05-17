import { z } from 'zod';
import {
  createEndpoint,
  HearingPackets,
  ArrizonOpenComplaintInspectionsList1,
  Locations,
  Inspections,
  Violations,
  InspectionPhotos,
  Chronology,
  ServiceLog,
  Exhibits,
  Users,
  ImportedReports,
} from 'zite-integrations-backend-sdk';

const violationSchema = z.object({
  id: z.string(),
  violationLabel: z.string().optional(),
  violationCode: z.string().optional(),
  category: z.string().optional(),
  locationInProperty: z.string().optional(),
  observation: z.string().optional(),
  correctiveAction: z.string().optional(),
  dueDate: z.string().optional(),
  responsibleParty: z.string().optional(),
  exhibitRefs: z.string().optional(),
  status: z.string().optional(),
});

const photoSchema = z.object({
  id: z.string(),
  photoUrl: z.string().optional(),
  caption: z.string().optional(),
  violationLabel: z.string().optional(),
  photoType: z.string().optional(),
  uploadedAt: z.string().optional(),
  inspectionDate: z.string().optional(),
});

const inspectionSchema = z.object({
  id: z.string(),
  inspectionId: z.string().optional(),
  inspectionDate: z.string().optional(),
  inspectionType: z.string().optional(),
  inspectionRating: z.string().optional(),
  inspector: z.string().optional(),
  timeIn: z.string().optional(),
  timeOut: z.string().optional(),
  accessGrantedBy: z.string().optional(),
  dba: z.string().optional(),
  facilityAddress: z.string().optional(),
  notes: z.string().optional(),
  violations: z.array(violationSchema),
  photos: z.array(photoSchema),
});

const exhibitSchema = z.object({
  id: z.string(),
  exhibitLabel: z.string().optional(),
  exhibitType: z.string().optional(),
  description: z.string().optional(),
  sortOrder: z.number().optional(),
  caption: z.string().optional(),
  category: z.string().optional(),
  exhibitDate: z.string().optional(),
  file: z.array(z.object({ url: z.string() })).optional(),
  exhibitLetter: z.string().optional(),
});

const importedReportSchema = z.object({
  id: z.string(),
  reportTitle: z.string().optional(),
  inspectionDate: z.string().optional(),
  inspectionType: z.string().optional(),
  inspectionRating: z.string().optional(),
  inspectorName: z.string().optional(),
  violationCount: z.number().optional(),
  parsingStatus: z.string().optional(),
  pdfUrl: z.string().optional(),
  linkedInspectionId: z.string().optional(),
});

/** Safely extract a single ID from a linked-record field (string or string[]) */
function getLinkedId(field: unknown): string | undefined {
  if (typeof field === 'string') return field;
  if (Array.isArray(field)) return field[0];
  return undefined;
}

/** Safely extract all IDs from a linked-record field that allows multiple values */
function getLinkedIds(field: unknown): string[] {
  if (!field) return [];
  if (Array.isArray(field)) return field.filter((id): id is string => typeof id === 'string');
  if (typeof field === 'string' && field) return [field];
  return [];
}

export default createEndpoint({
  description: 'Fetch all data needed to render a hearing packet document',
  inputSchema: z.object({ packetId: z.string() }),
  outputSchema: z.object({
    packet: z.object({
      id: z.string(),
      hearingDate: z.string().optional(),
      hearingTime: z.string().optional(),
      hearingLocation: z.string().optional(),
      packetStatus: z.string().optional(),
      packetType: z.string().optional(),
      assignedTo: z.string().optional(),
      notes: z.string().optional(),
      caseNumber: z.string().optional(),
      programCode: z.string().optional(),
      proposedActions: z.array(z.string()).optional(),
      chronologySnapshot: z.string().optional(),
      batesStart: z.number().optional(),
      batesEnd: z.number().optional(),
      hearingOrderData: z.string().optional(),
      // Replaced JSON string fields with typed arrays (backed by linked records)
      selectedReportIds: z.array(z.string()).optional(),
      selectedPhotoIds: z.array(z.string()).optional(),
      adminFee: z.string().optional(),
      checklistData: z.string().optional(),
      enforcementFlags: z.string().optional(),
      inspectorSignature: z.string().optional(),
      managerSignature: z.string().optional(),
    }),
    complaint: z.object({
      id: z.string(),
      complaintId: z.string().optional(),
      address: z.string().optional(),
      dateEntered: z.string().optional(),
      status: z.string().optional(),
      description: z.string().optional(),
      category: z.array(z.string()).optional(),
      hearingDate: z.string().optional(),
      hearingStatus: z.string().optional(),
      assignedTo: z.string().optional(),
      assignedProgram: z.string().optional(),
      hearingRpName: z.string().optional(),
      hearingRpPhone: z.string().optional(),
      hearingRpEmail: z.string().optional(),
      hearingRpAddress: z.string().optional(),
      purposeOfHearing: z.string().optional(),
      noticeOfHearingDate: z.string().optional(),
      hearingOrderDate: z.string().optional(),
    }).optional(),
    location: z.object({
      id: z.string(),
      address: z.string().optional(),
      blockLot: z.string().optional(),
      dba: z.string().optional(),
      facilityType: z.string().optional(),
      managementName: z.string().optional(),
      ownerName: z.string().optional(),
      ownerAddress: z.string().optional(),
      ownerPhone: z.string().optional(),
      ownerEmail: z.string().optional(),
      responsibleParty: z.string().optional(),
      responsiblePartyPhone: z.string().optional(),
      responsiblePartyEmail: z.string().optional(),
      numberOfUnits: z.number().optional(),
      verificationDate: z.string().optional(),
      buildingFeatures: z.array(z.string()).optional(),
    }).optional(),
    inspector: z.object({
      name: z.string(),
      email: z.string().optional(),
    }).optional(),
    inspections: z.array(inspectionSchema),
    chronology: z.array(z.object({
      id: z.string(),
      entryDate: z.string().optional(),
      entryType: z.string().optional(),
      citationCode: z.string().optional(),
      summary: z.string().optional(),
      violationsObserved: z.string().optional(),
      exhibitRefs: z.string().optional(),
      chronologyOrder: z.number().optional(),
      attachmentPageRef: z.string().optional(),
      createdBy: z.string().optional(),
      sourceRecord: z.string().optional(),
      visibility: z.string().optional(),
      frozenAt: z.string().optional(),
    })),
    exhibits: z.array(exhibitSchema),
    serviceLog: z.array(z.object({
      id: z.string(),
      noticeType: z.string().optional(),
      serviceMethod: z.string().optional(),
      serviceDate: z.string().optional(),
      recipient: z.string().optional(),
      trackingNumber: z.string().optional(),
      proofOfService: z.boolean().optional(),
      notes: z.string().optional(),
      status: z.string().optional(),
    })),
    importedReports: z.array(importedReportSchema),
    allPhotos: z.array(photoSchema),
  }),
  execute: async ({ input }) => {
    const packet = await HearingPackets.findOne({ id: input.packetId });
    if (!packet) throw new Error('Packet not found');

    const complaintId = getLinkedId(packet.complaint);

    // Resolve selected IDs: prefer linked record fields, fall back to legacy JSON strings
    const selectedReportIds: string[] = getLinkedIds(packet.selectedReports).length > 0
      ? getLinkedIds(packet.selectedReports)
      : packet.selectedReportIDs
        ? (() => { try { return JSON.parse(packet.selectedReportIDs) as string[]; } catch { return []; } })()
        : [];

    const selectedPhotoIds: string[] = getLinkedIds(packet.selectedPhotos).length > 0
      ? getLinkedIds(packet.selectedPhotos)
      : packet.selectedPhotoIDs
        ? (() => { try { return JSON.parse(packet.selectedPhotoIDs) as string[]; } catch { return []; } })()
        : [];

    const packetOut = {
      id: packet.id,
      hearingDate: packet.hearingDate,
      hearingTime: packet.hearingTime,
      hearingLocation: packet.hearingLocation,
      packetStatus: packet.packetStatus,
      packetType: packet.packetType,
      assignedTo: packet.assignedTo,
      notes: packet.notes,
      caseNumber: packet.caseNumber,
      programCode: packet.programCode,
      proposedActions: packet.proposedActions as string[] | undefined,
      chronologySnapshot: packet.chronologySnapshot,
      batesStart: packet.batesStart,
      batesEnd: packet.batesEnd,
      hearingOrderData: packet.hearingOrderData,
      selectedReportIds,
      selectedPhotoIds,
      adminFee: packet.adminFee,
      checklistData: packet.checklistData,
      enforcementFlags: packet.enforcementFlags,
      inspectorSignature: packet.inspectorSignature,
      managerSignature: packet.managerSignature,
    };

    if (!complaintId) {
      return {
        packet: packetOut,
        complaint: undefined,
        location: undefined,
        inspector: undefined,
        inspections: [],
        chronology: [],
        exhibits: [],
        serviceLog: [],
        importedReports: [],
        allPhotos: [],
      };
    }

    const complaint = await ArrizonOpenComplaintInspectionsList1.findOne({ id: complaintId });
    const locationId = getLinkedId(complaint?.location);

    // Single parallel batch — violations, photos, and users included to eliminate a second round-trip
    const [
      locationRes,
      inspectionsRes,
      chronologyRes,
      serviceLogRes,
      exhibitsRes,
      importedRes,
      violationsRes,
      photosRes,
      usersRes,
    ] = await Promise.all([
      locationId ? Locations.findOne({ id: locationId }) : Promise.resolve(undefined),
      Inspections.findAll({ filters: { complaintId: complaint?.complaintId }, limit: 100 }),
      Chronology.findAll({ filters: { complaint: complaintId }, limit: 200 }),
      ServiceLog.findAll({ filters: { complaint: complaintId }, limit: 100 }),
      Exhibits.findAll({ filters: { complaint: complaintId }, limit: 200 }),
      locationId
        ? ImportedReports.findAll({ filters: { location: locationId }, limit: 100 })
        : Promise.resolve({ records: [] as Awaited<ReturnType<typeof ImportedReports.findAll>>['records'] }),
      Violations.findAll({ filters: { complaint: complaintId }, limit: 500 }),
      InspectionPhotos.findAll({ filters: { complaintId: complaint?.complaintId }, limit: 500 }),
      Users.findAll({ limit: 200, fields: ['firstName', 'lastName', 'email'] }),
    ]);

    // Robust inspector lookup: exact full-name match, then partial name fallback
    let inspectorInfo: { name: string; email?: string } | undefined;
    if (complaint?.assignedTo) {
      const inspectorName = complaint.assignedTo.trim();
      const lower = inspectorName.toLowerCase();
      const exactMatch = usersRes.records.find(u => {
        const full = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
        return full.toLowerCase() === lower;
      });
      if (exactMatch) {
        inspectorInfo = { name: inspectorName, email: exactMatch.email };
      } else {
        const partialMatch = usersRes.records.find(u =>
          (u.firstName && lower.includes(u.firstName.toLowerCase())) ||
          (u.lastName && lower.includes(u.lastName.toLowerCase()))
        );
        inspectorInfo = { name: inspectorName, email: partialMatch?.email };
      }
    }

    type ViolationRecord = (typeof violationsRes.records)[number];
    const violsByInspection = new Map<string, ViolationRecord[]>();
    for (const v of violationsRes.records) {
      const iid = getLinkedId(v.inspection);
      if (iid) {
        if (!violsByInspection.has(iid)) violsByInspection.set(iid, []);
        violsByInspection.get(iid)!.push(v);
      }
    }

    const inspections = inspectionsRes.records
      .sort((a, b) => (a.inspectionDate ?? '').localeCompare(b.inspectionDate ?? ''))
      .map(insp => ({
        id: insp.id,
        inspectionId: String(insp.inspectionId ?? ''),
        inspectionDate: insp.inspectionDate,
        inspectionType: insp.inspectionType,
        inspectionRating: insp.inspectionRating,
        inspector: insp.inspector,
        timeIn: insp.timeIn,
        timeOut: insp.timeOut,
        accessGrantedBy: insp.accessGrantedBy,
        dba: insp.dba,
        facilityAddress: insp.facilityAddress,
        notes: insp.notes,
        violations: (violsByInspection.get(insp.id) ?? []).map(v => ({
          id: v.id,
          violationLabel: v.violationLabel,
          violationCode: v.violationCode,
          category: v.category,
          locationInProperty: v.locationInProperty,
          observation: v.observation,
          correctiveAction: v.correctiveAction,
          dueDate: v.dueDate,
          responsibleParty: v.responsibleParty,
          exhibitRefs: v.exhibitRefs,
          status: v.status,
        })),
        photos: [] as { id: string; photoUrl?: string; caption?: string; violationLabel?: string; photoType?: string; uploadedAt?: string; inspectionDate?: string }[],
      }));

    // Build a lookup map for inspection ID → date (used for direct-link photo grouping)
    const inspectionDateMap = new Map(inspections.map(i => [i.id, i.inspectionDate]));

    // Build photos: use direct inspection link as primary source of grouping.
    // Date-window assignment (below) only runs for photos without a direct link.
    const allPhotosFlat = photosRes.records.map(p => {
      const directInspId = getLinkedId(p.inspection);
      const directDate = directInspId ? inspectionDateMap.get(directInspId) : undefined;
      return {
        id: p.id,
        photoUrl: p.photoUrl,
        caption: p.caption,
        violationLabel: p.violationLabel,
        photoType: p.photoType,
        uploadedAt: p.uploadedAt,
        inspectionDate: directDate,  // set immediately if there's a direct link
      };
    });

    // Fallback: assign inspectionDate by upload-date window for photos without a direct link
    for (let idx = 0; idx < inspections.length; idx++) {
      const insp = inspections[idx];
      const nextDate = inspections[idx + 1]?.inspectionDate;
      allPhotosFlat.forEach(p => {
        if (p.inspectionDate) return;  // already set by direct link
        if (!p.uploadedAt || !insp.inspectionDate) {
          if (idx === 0) p.inspectionDate = insp.inspectionDate;
          return;
        }
        const pDate = p.uploadedAt.slice(0, 10);
        if (pDate >= insp.inspectionDate && (!nextDate || pDate < nextDate)) {
          p.inspectionDate = insp.inspectionDate;
        }
      });
    }

    const inspectionsWithPhotos = inspections.map((insp, idx) => {
      const nextDate = inspections[idx + 1]?.inspectionDate;
      let photos = allPhotosFlat.filter(p => {
        // Photos with a direct link: include if they link to this inspection
        if (p.inspectionDate === insp.inspectionDate && allPhotosFlat.some(
          ph => ph.id === p.id && getLinkedId(photosRes.records.find(r => r.id === ph.id)?.inspection) === insp.id
        )) return true;
        // Photos without a direct link: use date-window
        if (!p.uploadedAt || !insp.inspectionDate) return idx === 0;
        const pDate = p.uploadedAt.slice(0, 10);
        return pDate >= insp.inspectionDate && (!nextDate || pDate < nextDate);
      });
      if (selectedPhotoIds.length > 0) {
        photos = photos.filter(p => selectedPhotoIds.includes(p.id));
      }
      return { ...insp, photos };
    });

    const sortedExhibits = [...exhibitsRes.records].sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
    const exhibits = sortedExhibits.map((ex, idx) => ({
      id: ex.id,
      exhibitLabel: ex.exhibitLabel,
      exhibitType: ex.exhibitType,
      description: ex.description,
      sortOrder: ex.sortOrder,
      caption: ex.caption,
      category: ex.category,
      exhibitDate: ex.exhibitDate,
      file: ex.file,
      exhibitLetter: String.fromCharCode(65 + idx),
    }));

    const sortedChronology = [...chronologyRes.records].sort((a, b) => {
      if (a.chronologyOrder != null && b.chronologyOrder != null) return a.chronologyOrder - b.chronologyOrder;
      return (a.entryDate ?? '').localeCompare(b.entryDate ?? '');
    });

    const importedReports = importedRes.records
      .sort((a, b) => (b.uploadedAt ?? '').localeCompare(a.uploadedAt ?? ''))
      .map(r => {
        const inspId = getLinkedId(r.linkedInspection);
        return {
          id: r.id,
          reportTitle: r.reportTitle,
          inspectionDate: r.inspectionDate,
          inspectionType: r.inspectionType,
          inspectionRating: r.inspectionRating,
          inspectorName: r.inspectorName,
          violationCount: r.violationCount,
          parsingStatus: r.parsingStatus,
          pdfUrl: r.pdfFile?.[0]?.url,
          linkedInspectionId: inspId,
        };
      });

    return {
      packet: packetOut,
      complaint: complaint ? {
        id: complaint.id,
        complaintId: complaint.complaintId,
        address: complaint.address,
        dateEntered: complaint.dateEntered,
        status: complaint.status,
        description: complaint.description,
        category: complaint.category as string[] | undefined,
        hearingDate: complaint.hearingDate,
        hearingStatus: complaint.hearingStatus,
        assignedTo: complaint.assignedTo,
        assignedProgram: complaint.assignedProgram,
        hearingRpName: complaint.hearingRpName,
        hearingRpPhone: complaint.hearingRpPhone,
        hearingRpEmail: complaint.hearingRpEmail,
        hearingRpAddress: complaint.hearingRpAddress,
        purposeOfHearing: complaint.purposeOfHearing,
        noticeOfHearingDate: complaint.noticeOfHearingDate,
        hearingOrderDate: complaint.hearingOrderDate,
      } : undefined,
      location: locationRes ? {
        id: locationRes.id,
        address: locationRes.address,
        blockLot: locationRes.blockLot,
        dba: locationRes.dba,
        facilityType: locationRes.facilityType,
        managementName: locationRes.managementName,
        ownerName: locationRes.ownerName,
        ownerAddress: locationRes.ownerAddress,
        ownerPhone: locationRes.ownerPhone,
        ownerEmail: locationRes.ownerEmail,
        responsibleParty: locationRes.responsibleParty,
        responsiblePartyPhone: locationRes.responsiblePartyPhone,
        responsiblePartyEmail: locationRes.responsiblePartyEmail,
        numberOfUnits: locationRes.numberOfUnits,
        verificationDate: locationRes.verificationDate,
        buildingFeatures: locationRes.buildingFeatures as string[] | undefined,
      } : undefined,
      inspector: inspectorInfo,
      inspections: inspectionsWithPhotos,
      chronology: sortedChronology.map(c => ({
        id: c.id,
        entryDate: c.entryDate,
        entryType: c.entryType,
        citationCode: c.citationCode,
        summary: c.summary,
        violationsObserved: c.violationsObserved,
        exhibitRefs: c.exhibitRefs,
        chronologyOrder: c.chronologyOrder,
        attachmentPageRef: c.attachmentPageRef,
        createdBy: c.createdBy,
        sourceRecord: c.sourceRecord,
        visibility: c.visibility,
        frozenAt: c.frozenAt,
      })),
      exhibits,
      serviceLog: serviceLogRes.records.map(s => ({
        id: s.id,
        noticeType: s.noticeType,
        serviceMethod: s.serviceMethod,
        serviceDate: s.serviceDate,
        recipient: s.recipient,
        trackingNumber: s.trackingNumber,
        proofOfService: s.proofOfService,
        notes: s.notes,
        status: s.status,
      })),
      importedReports,
      allPhotos: allPhotosFlat,
    };
  },
});
