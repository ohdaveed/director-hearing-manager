/**
 * packet.ts
 *
 * Domain types for Hearing Packets - single source of truth for packet data structures.
 */

import type { ComplaintSummary } from "./complaint";

/**
 * Basic packet data from hearing_packets table (PACKET_LIST_COLUMNS)
 * Plus complaint address and complaintId for UI convenience
 */
export type PacketSummary = {
  id: string;
  hearing_date: string | null;
  packet_status: string;
  assigned_to: string | null;
  case_number: string | null;
  program_code: string | null;
  packet_type: string | null;
  notes: string | null;
  hearing_time: string | null;
  hearing_location: string | null;
  bates_start: string | null;
  bates_end: string | null;
  admin_fee: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;

  // Denormalized from complaints relation for UI convenience
  address: string | null;
  complaintId: string | null;
  hearingStatus: string | null;
};

/**
 * Full packet data including relations (PACKET_FULL_COLUMNS + relations)
 * This matches what packetService.getById returns after mapping
 */
export type PacketFull = PacketSummary & {
  generated_at: string | null;
  chronology_snapshot: string | null;
  hearing_order_data: string | null;
  selected_report_ids: string | null;
  selected_photo_ids: string | null;
  checklist_data: string | null;
  enforcement_flags: string | null;
  selected_reports: string | null;
  selected_photos: string | null;
  inspector_signature: string | null;
  manager_signature: string | null;
  revision_notes: string | null;
  status_history: string | null;
};

/**
 * Packet with all relations loaded - used in packet detail view
 */
export type PacketWithRelations = PacketFull & {
  complaint: ComplaintSummary | null;
  location: {
    id: string;
    address: string;
    owner_name: string | null;
    verification_date: string | null;
    // Add other location fields as needed
  } | null;
  inspector: {
    id: string;
    name: string;
    email: string;
    // Add other inspector fields as needed
  } | null;
  inspections: Array<{
    id: string;
    complaint_id: string;
    inspector_id: string;
    inspection_date: string;
    status: string;
    // Add other inspection fields as needed
  }>;
};

/**
 * Enforcement flags for legal language checkboxes
 */
export interface EnforcementFlags {
  nuisanceAbatement: boolean;
  costRecovery: boolean;
  appealHealthPermit: boolean;
  appealNonPermitted: boolean;
}

/**
 * Status history entry for audit trail
 */
export interface StatusHistoryEntry {
  timestamp: string;
  userName: string;
  fromStatus: string;
  toStatus: string;
  action: string;
  notes?: string;
}

/**
 * Checklist completion status - maps milestone ID to boolean
 */
export type ChecklistCompletion = Record<number, boolean>;
