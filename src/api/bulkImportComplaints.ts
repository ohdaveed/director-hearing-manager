import { z } from 'zod';
import { createEndpoint, ArrizonOpenComplaintInspectionsList1, Locations, Chronology } from 'zite-integrations-backend-sdk';

const rowSchema = z.object({
  address: z.string().min(1),
  dateReceived: z.string().min(1),
  description: z.string().min(1),
  complaintId: z.string().optional(),
  caseNumber311: z.string().optional(),
  complaintType: z.string().optional(),
  category: z.string().optional(),
  assignedTo: z.string().optional(),
  status: z.string().optional(),
  methodReceived: z.string().optional(),
  assignedProgram: z.string().optional(),
  dateAssigned: z.string().optional(),
  locationId: z.string().optional(),
});

async function generateId(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = String(Math.floor(100000 + Math.random() * 900000));
    const existing = await ArrizonOpenComplaintInspectionsList1.findOne({ filters: { complaintId: id }, fields: ['id'] });
    if (!existing) return id;
  }
  return String(Date.now()).slice(-6);
}

export default createEndpoint({
  description: 'Bulk import multiple complaints from CSV rows using bulkCreate for speed',
  inputSchema: z.object({
    rows: z.array(rowSchema).min(1).max(200),
  }),
  outputSchema: z.object({
    created: z.number(),
    skipped: z.number(),
    errors: z.array(z.object({ row: z.number(), reason: z.string() })),
    success: z.boolean(),
  }),
  execute: async ({ input, context }) => {
    const errors: { row: number; reason: string }[] = [];
    const today = new Date().toISOString().split('T')[0];

    // Step 1: Resolve complaint IDs — check uniqueness for explicit ones, generate for blanks
    type ResolvedRow = { row: typeof input.rows[0]; complaintId: string; rowIndex: number };
    const resolved: ResolvedRow[] = [];

    for (let i = 0; i < input.rows.length; i++) {
      const row = input.rows[i];
      if (row.complaintId?.trim()) {
        const trimmed = row.complaintId.trim();
        const existing = await ArrizonOpenComplaintInspectionsList1.findOne({ filters: { complaintId: trimmed }, fields: ['id'] });
        if (existing) {
          errors.push({ row: i + 1, reason: `Complaint ID "${trimmed}" already exists` });
          continue;
        }
        resolved.push({ row, complaintId: trimmed, rowIndex: i });
      } else {
        const id = await generateId();
        resolved.push({ row, complaintId: id, rowIndex: i });
      }
    }

    if (resolved.length === 0) {
      return { created: 0, skipped: input.rows.length, errors, success: false };
    }

    // Step 2: Resolve locations — use provided locationId or create a new one
    const locationIds: string[] = [];
    const rowsNeedingNewLocation: { index: number; address: string }[] = [];

    resolved.forEach((r, i) => {
      if (r.row.locationId?.trim()) {
        locationIds[i] = r.row.locationId.trim();
      } else {
        rowsNeedingNewLocation.push({ index: i, address: r.row.address });
      }
    });

    // Bulk create only the locations that don't have an existing ID
    for (let b = 0; b < rowsNeedingNewLocation.length; b += 100) {
      const batch = rowsNeedingNewLocation.slice(b, b + 100);
      const locResult = await Locations.bulkCreate({
        records: batch.map(r => ({ address: r.address })),
      });
      locResult.records.forEach((l, bi) => {
        locationIds[batch[bi].index] = l.id;
      });
    }

    // Step 3: Bulk create complaints (100 per batch)
    const complaintRecords: { id: string }[] = [];
    for (let b = 0; b < resolved.length; b += 100) {
      const batch = resolved.slice(b, b + 100);
      const result = await ArrizonOpenComplaintInspectionsList1.bulkCreate({
        records: batch.map((r, bi) => ({
          complaintId: r.complaintId,
          dateEntered: r.row.dateReceived,
          address: r.row.address,
          location: locationIds[b + bi],
          status: r.row.status ?? 'New',
          description: r.row.description,
          category: r.row.category ? r.row.category.split(',').map(c => c.trim()).filter(Boolean) : undefined,
          assignedTo: r.row.assignedTo ?? undefined,
          hearingStatus: 'None',
          complaintType: r.row.complaintType ?? undefined,
          methodReceived: r.row.methodReceived ?? undefined,
          assignedProgram: r.row.assignedProgram ?? undefined,
          dateAssigned: r.row.dateAssigned ?? today,
          _311CaseNumber: r.row.caseNumber311 ?? undefined,
          complainantAnonymous: false,
        })),
      });
      result.records.forEach(c => complaintRecords.push({ id: c.id }));
    }

    // Step 4: Bulk create chronology entries
    for (let b = 0; b < complaintRecords.length; b += 100) {
      const batch = complaintRecords.slice(b, b + 100);
      const resolvedBatch = resolved.slice(b, b + 100);
      await Chronology.bulkCreate({
        records: batch.map((c, bi) => ({
          summary: `Complaint received (CSV import) — ${resolvedBatch[bi].row.description.slice(0, 200)}`,
          entryDate: today,
          entryType: 'Other',
          createdBy: context.user.email,
          complaint: c.id,
          sourceRecord: `CSV Import — ${today}`,
          visibility: 'Public',
        })),
      });
    }

    const skipped = input.rows.length - resolved.length;
    return {
      created: complaintRecords.length,
      skipped,
      errors,
      success: complaintRecords.length > 0,
    };
  },
});
