/**
 * complaint.ts
 *
 * Shared complaint summary type used as the common currency for complaint records
 * passed between pages and components (e.g. from My Complaints → Inspection Form).
 *
 * Structurally compatible with both any['complaints'][0]
 * and any['complaints'][0] so components can accept either
 * without needing to import endpoint-specific types.
 */
export type ComplaintSummary = {
  id: string;
  legacy_complaint_id?: string;
  address?: string;
  description?: string;
  status?: string;
  category?: string[];
  reinspection_due_on_after?: string;
  draftInspectionId?: string;
  locationRecordId?: string;
  legacy_location_id?: string;
  hearing_status?: string;
  hearing_date?: string;
  assigned_to?: string;
  assignedProgram?: string;
  date_entered?: string;
};
