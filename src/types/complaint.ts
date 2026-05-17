/**
 * complaint.ts
 *
 * Shared complaint summary type used as the common currency for complaint records
 * passed between pages and components (e.g. from My Complaints → Inspection Form).
 *
 * Structurally compatible with both GetAssignedComplaintsOutputType['complaints'][0]
 * and GetAllComplaintsOutputType['complaints'][0] so components can accept either
 * without needing to import endpoint-specific types.
 */
export type ComplaintSummary = {
  id: string;
  complaintId?: string;
  address?: string;
  description?: string;
  status?: string;
  category?: string[];
  reinspectionDueOnAfter?: string;
  draftInspectionId?: string;
  locationRecordId?: string;
  locationId?: string;
  hearingStatus?: string;
  hearingDate?: string;
  assignedTo?: string;
  dateEntered?: string;
};
