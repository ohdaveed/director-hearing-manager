/**
 * Domain types for Hearing Packets.
 */

import type { PacketStatus } from "@/services/packetService";
import type { ComplaintSummary } from "./complaint";

export type JsonRecord = Record<string, unknown>;

export interface PacketValidationResult {
  rule_slug: string;
  status: "pass" | "warning" | "fail" | string;
  severity?: "critical" | "major" | "minor" | string;
  message?: string;
  [key: string]: unknown;
}

/**
 * Basic packet data from hearing_packets table plus denormalized complaint data.
 */
export type PacketSummary = {
  id: string;
  hearing_date: string | null;
  packet_status: PacketStatus | string;
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
  created_at?: string | null;
  updated_at?: string | null;
  generated_at?: string | null;
  generated_file_path?: string | null;
  final_file_path?: string | null;
  approved_at?: string | null;
  submitted_at?: string | null;
  locked_at?: string | null;

  address: string | null;
  legacy_complaint_id?: string | null;
  complaintId?: string | null;
  hearingStatus?: string | null;
};

export type PacketFull = PacketSummary & {
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

  selected_report_ids_json?: string[];
  selected_photo_ids_json?: string[];
  packet_snapshot_json?: JsonRecord;
  validation_results_json?: PacketValidationResult[];
  checklist_json?: JsonRecord;
  enforcement_json?: JsonRecord;
  status_history_json?: StatusHistoryEntry[];
  page_numbering_complete?: boolean | null;
  exhibit_labeling_complete?: boolean | null;
  internal_review_date?: string | null;
  notice_service_date?: string | null;
  final_reinspection_date?: string | null;
  coordinator_submittal_date?: string | null;
  teams_upload_date?: string | null;
  post_order_service_date?: string | null;
};

export interface PacketDetailData {
  packet: PacketFull;
  complaint: any;
  location: any;
  inspections: any[];
  chronology: any[];
  serviceLog: any[];
}

export type PacketWithRelations = PacketFull & {
  complaint: ComplaintSummary | null;
  location: {
    id: string;
    address: string;
    owner_name: string | null;
    verification_date: string | null;
  } | null;
  inspector: {
    id: string;
    name: string;
    email: string;
  } | null;
  inspections: Array<{
    id: string;
    complaint_id: string;
    inspector_id: string;
    inspection_date: string;
    status: string;
  }>;
};

export interface EnforcementFlags {
  nuisanceAbatement: boolean;
  costRecovery: boolean;
  appealHealthPermit: boolean;
  appealNonPermitted: boolean;
}

export interface StatusHistoryEntry {
  timestamp: string;
  userName?: string;
  fromStatus?: string;
  toStatus?: string;
  action?: string;
  notes?: string;
}

export type ChecklistCompletion = Record<number, boolean>;
