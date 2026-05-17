import { z } from 'zod';
import { createEndpoint, Inspections, Violations, Locations, Chronology, ServiceLog } from 'zite-integrations-backend-sdk';

const violationSchema = z.object({
  violationKey: z.string(),
  location: z.string(),
  correctiveAction: z.string(),
  dueDate: z.string(),
  responsibleParty: z.enum(['Owner', 'Tenant']),
  status: z.enum(['Violation', 'Abated', 'Corrected on Site']).default('Violation'),
  ownerActions: z.array(z.string()).optional(),
  tenantActions: z.array(z.string()).optional(),
  selectedObservations: z.array(z.string()).optional(),
});

/** Serialize split corrective actions into the correctiveAction field for DB storage */
function serializeCorrectiveAction(v: {
  correctiveAction: string;
  ownerActions?: string[];
  tenantActions?: string[];
}): string {
  const hasOwner = (v.ownerActions?.length ?? 0) > 0;
  const hasTenant = (v.tenantActions?.length ?? 0) > 0;
  if (hasOwner || hasTenant) {
    return JSON.stringify({ v2: true, ownerActions: v.ownerActions ?? [], tenantActions: v.tenantActions ?? [] });
  }
  return v.correctiveAction;
}

const responsiblePartySchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  address: z.string(),
  phone: z.string(),
  email: z.string(),
  served: z.boolean(),
});

export default createEndpoint({
  description: 'Save or update an inspection draft or submit final report',
  inputSchema: z.object({
    inspectionId: z.string().optional(),
    locationRecordId: z.string().optional(),
    complaintRecordId: z.string().optional(),
    inspector: z.string(),
    inspectionDate: z.string().optional(),
    timeIn: z.string().optional(),
    timeOut: z.string().optional(),
    facilityType: z.string().optional(),
    inspectionType: z.string().optional(),
    inspectionRating: z.string().optional(),
    accessGrantedBy: z.string().optional(),
    dba: z.string().optional(),
    contactPhone: z.string().optional(),
    contactEmail: z.string().optional(),
    facilityName: z.string().optional(),
    locationId: z.string().optional(),
    ownerName: z.string().optional(),
    numApts: z.string().optional(),
    numRooms: z.string().optional(),
    buildingDetails: z.array(z.string()).optional(),
    isHealthyHousing: z.boolean().optional(),
    currentBalance: z.string().optional(),
    complaintId: z.string().optional(),
    observations: z.array(z.object({
      id: z.string(),
      text: z.string(),
      linkedViolationKey: z.string(),
    })).optional(),
    violations: z.array(violationSchema).optional(),
    completedReport: z.string().optional(),
    submitting: z.boolean().default(false),
    // Narrative
    summary: z.string().optional(),
    // Areas inspected
    areasInspected: z.array(z.string()).optional(),
    // Corrective actions
    checkedStandardCAs: z.record(z.boolean()).optional(),
    standardCADetails: z.record(z.object({ date: z.string(), notes: z.string() })).optional(),
    customCAs: z.array(z.object({ id: z.string(), text: z.string(), date: z.string(), notes: z.string() })).optional(),
    globalObservations: z.array(z.string()).optional(),
    // Hearing prep
    hearingCaseStatus: z.string().optional(),
    hearingDate: z.string().optional(),
    programCode: z.string().optional(),
    blockLot: z.string().optional(),
    enforcementSummary: z.string().optional(),
    responsibleParties: z.array(responsiblePartySchema).optional(),
  }),
  outputSchema: z.object({
    inspectionId: z.string(),
    success: z.boolean(),
  }),
  execute: async ({ input, context }) => {
    const notesData = JSON.stringify({
      observations: input.observations ?? [],
      buildingDetails: input.buildingDetails ?? [],
      ownerName: input.ownerName ?? '',
      isHealthyHousing: input.isHealthyHousing ?? false,
      currentBalance: input.currentBalance ?? '',
      summary: input.summary ?? '',
      areasInspected: input.areasInspected ?? [],
      checkedStandardCAs: input.checkedStandardCAs ?? {},
      standardCADetails: input.standardCADetails ?? {},
      customCAs: input.customCAs ?? [],
      globalObservations: input.globalObservations ?? [],
      hearingCaseStatus: input.hearingCaseStatus ?? '',
      hearingDate: input.hearingDate ?? '',
      programCode: input.programCode ?? '',
      blockLot: input.blockLot ?? '',
      enforcementSummary: input.enforcementSummary ?? '',
      responsibleParties: input.responsibleParties ?? [],
    });

    // Always resolve the facility address from the linked location record so we
    // store the human-readable street address rather than any internal identifier.
    let facilityAddress = input.facilityName;
    if (input.locationRecordId) {
      const locationRecord = await Locations.findOne({ id: input.locationRecordId });
      if (locationRecord?.address) {
        facilityAddress = locationRecord.address;
      }
    }

    const inspectionFields: Record<string, unknown> = {
      inspector: input.inspector,
      inspectionDate: input.inspectionDate,
      timeIn: input.timeIn,
      timeOut: input.timeOut,
      inspectionType: input.inspectionType,
      inspectionRating: input.inspectionRating,
      accessGrantedBy: input.accessGrantedBy,
      dba: input.dba,
      contactPhone: input.contactPhone,
      contactEmail: input.contactEmail,
      facilityAddress,
      complaintId: input.complaintId,
      locationId: input.locationId,
      notes: notesData,
      status: input.submitting ? 'Submitted' : 'Draft',
      violationCount: (input.violations ?? []).filter(v => v.violationKey).length,
    };

    if (input.submitting) {
      inspectionFields.submittedAt = new Date().toISOString();
      inspectionFields.completedReport = input.completedReport ?? '';
    }

    if (input.locationRecordId) inspectionFields.location = input.locationRecordId;
    if (input.complaintRecordId) inspectionFields.complaint = input.complaintRecordId;

    let inspectionId: string;

    if (input.inspectionId) {
      await Inspections.update({ id: input.inspectionId, record: inspectionFields });
      inspectionId = input.inspectionId;
    } else {
      const created = await Inspections.create({ record: inspectionFields });
      inspectionId = created.id;
    }

    // Sync violations: delete old, bulk create new
    const { records: existingViolations } = await Violations.findAll({
      filters: { inspection: inspectionId },
      limit: 100,
    });

    await Promise.all(existingViolations.map(v => Violations.delete({ id: v.id })));

    const filledViolations = (input.violations ?? []).filter(v => v.violationKey);
    if (filledViolations.length > 0) {
      const violationRecords = filledViolations.map(v => {
        const [category, label] = v.violationKey.split('||');
        return {
          violationLabel: label,
          inspection: inspectionId,
          ...(input.complaintRecordId ? { complaint: input.complaintRecordId } : {}),
          category,
          locationInProperty: v.location,
          correctiveAction: serializeCorrectiveAction(v),
          dueDate: v.dueDate,
          responsibleParty: (v.tenantActions?.length && !v.ownerActions?.length) ? 'Tenant' : 'Owner',
          status: v.status,
        };
      });
      await Violations.bulkCreate({ records: violationRecords });
    }

    // Auto-create chronology entry when submitting
    if (input.submitting && input.complaintRecordId) {
      const date = input.inspectionDate ?? new Date().toISOString().split('T')[0];
      const outcome = input.inspectionRating ?? 'outcome not recorded';
      const inspType = input.inspectionType ?? 'General';
      const count = filledViolations.length;
      const summaryText = (input.summary ?? '').trim().slice(0, 150);
      const noteText = (input.observations ?? [])
        .filter(o => o.text)
        .map(o => o.text.trim())
        .join(' ')
        .slice(0, 200);
      const chronologySummary = `Inspection on ${date}: ${inspType} inspection completed; ${outcome}; ${count} violation(s) observed.${summaryText ? ' ' + summaryText : noteText ? ' ' + noteText : ''}`;

      const inspIdStr = inspectionId.slice(-6).toUpperCase();
      const sourceLabel = `Inspection #${inspIdStr} — ${date}`;

      const violationsObservedStr = filledViolations.length > 0
        ? filledViolations.map(v => {
            const [, label] = v.violationKey.split('||');
            return label ? `${label}${v.location ? ` (${v.location})` : ''}` : v.violationKey;
          }).join('; ')
        : undefined;

      // Check if a chronology entry already exists for this inspection
      const { records: existingChronos } = await Chronology.findAll({
        filters: { relatedInspection: inspectionId },
        limit: 1,
      });

      if (existingChronos.length > 0) {
        // Preserve existing text — only fill in blank fields
        const existing = existingChronos[0];
        const updateRecord: Record<string, unknown> = {};
        if (!existing.summary) updateRecord.summary = chronologySummary;
        if (!existing.violationsObserved && violationsObservedStr) {
          updateRecord.violationsObserved = violationsObservedStr;
        }
        if (Object.keys(updateRecord).length > 0) {
          await Chronology.update({ id: existing.id, record: updateRecord });
        }
      } else {
        await Chronology.create({
          record: {
            summary: chronologySummary,
            entryDate: date,
            entryType: 'Inspection',
            createdBy: context.user.email,
            complaint: input.complaintRecordId,
            relatedInspection: inspectionId,
            sourceRecord: sourceLabel,
            visibility: 'Public',
            violationsObserved: violationsObservedStr,
          },
        });
      }

      // Create Service Log entries for served responsible parties (Citation to Hearing)
      if (input.inspectionType === 'Citation to Hearing Issued') {
        const servedParties = (input.responsibleParties ?? []).filter(p => p.served && p.name);
        if (servedParties.length > 0) {
          await ServiceLog.bulkCreate({
            records: servedParties.map(party => ({
              noticeType: 'Inspection Report / Citation',
              serviceMethod: 'Personal Service' as const,
              serviceDate: date,
              recipient: `${party.name}${party.role ? ` (${party.role})` : ''}`,
              notes: party.address ? `Address: ${party.address}` : undefined,
              status: 'Personally Served',
              complaint: input.complaintRecordId,
            })),
          });
        }
      }
    }

    // Also update the location if healthy housing / fees changed
    if (input.locationRecordId && (input.isHealthyHousing !== undefined || input.currentBalance)) {
      await Locations.update({
        id: input.locationRecordId,
        record: {
          healthyHousing: input.isHealthyHousing,
          currentFees: input.currentBalance ? parseFloat(input.currentBalance.replace(/[^0-9.]/g, '')) : undefined,
        },
      });
    }

    return { inspectionId, success: true };
  },
});
