import { supabase } from "@/lib/supabase";
import type { ComplianceResult } from "@/types/compliance";
import type { PacketData } from "./packetMapperService";

/** Column selections to avoid SELECT * */
export const PACKET_LIST_COLUMNS = `
  id, hearing_date, packet_status, assigned_to, case_number,
  program_code, packet_type, notes, hearing_time, hearing_location,
  bates_start, bates_end, admin_fee, deleted_at,
  generated_at, generated_file_path, final_file_path,
  approved_at, submitted_at, locked_at
`;

export const PACKET_FULL_COLUMNS = `
  ${PACKET_LIST_COLUMNS},
  chronology_snapshot, hearing_order_data,
  selected_report_ids, selected_photo_ids, checklist_data,
  enforcement_flags, selected_reports, selected_photos,
  inspector_signature, manager_signature, revision_notes, status_history,
  selected_report_ids_json, selected_photo_ids_json,
  packet_snapshot_json, validation_results_json,
  checklist_json, enforcement_json, status_history_json,
  page_numbering_complete, exhibit_labeling_complete,
  internal_review_date, notice_service_date, final_reinspection_date,
  coordinator_submittal_date, teams_upload_date, post_order_service_date
`;

export const PACKET_STATUSES = [
  "Not Started",
  "In Progress",
  "Under Review",
  "Changes Requested",
  "Approved",
  "Complete",
  "Submitted",
] as const;

export type PacketStatus = (typeof PACKET_STATUSES)[number];

export interface PacketValidationResult {
  rule_slug: string;
  status: "pass" | "fail" | "warning" | string;
  severity?: "critical" | "major" | "minor" | string;
  message?: string;
  [key: string]: unknown;
}

export interface PacketGenerationEvent {
  id: string;
  hearing_packet_id: string | null;
  complaint_uuid: string | null;
  event_type: string;
  event_status: "info" | "success" | "warning" | "error" | "blocked" | string;
  event_message: string | null;
  event_data: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
}

export interface GeneratedPacketFile {
  id: string;
  hearing_packet_id: string | null;
  complaint_uuid: string | null;
  file_type: string;
  file_path: string;
  file_name: string | null;
  mime_type: string | null;
  version_number: number;
  generated_by: string | null;
  generated_at: string;
  packet_hash: string | null;
  is_final: boolean;
  notes: string | null;
  metadata: Record<string, unknown> | null;
}

export interface GenerateHearingPacketResult {
  ok: boolean;
  packetId: string;
  packetType: "draft" | "final";
  file: GeneratedPacketFile;
  signedUrl: string | null;
  validationResults: PacketValidationResult[];
}

export interface GeneratedFileUrlResult {
  signedUrl: string;
  file: Pick<GeneratedPacketFile, "id" | "file_path" | "file_name" | "metadata">;
}

function parseJsonField<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

function normalizePacketRow<T extends Record<string, any>>(packet: T): T {
  return {
    ...packet,
    checklist_json: parseJsonField(packet.checklist_json ?? packet.checklist_data, {}),
    enforcement_json: parseJsonField(packet.enforcement_json ?? packet.enforcement_flags, {}),
    status_history_json: parseJsonField(packet.status_history_json ?? packet.status_history, []),
    selected_report_ids_json: parseJsonField(
      packet.selected_report_ids_json ?? packet.selected_report_ids,
      [],
    ),
    selected_photo_ids_json: parseJsonField(
      packet.selected_photo_ids_json ?? packet.selected_photo_ids,
      [],
    ),
    packet_snapshot_json: parseJsonField(packet.packet_snapshot_json, {}),
    validation_results_json: parseJsonField(packet.validation_results_json, []),
  };
}

function toLegacyCompatibleUpdates(updates: Record<string, any>) {
  const next = { ...updates };

  // Keep old text columns and new jsonb columns aligned while the UI is being refactored.
  if ("checklist_json" in next && !("checklist_data" in next)) {
    next.checklist_data = JSON.stringify(next.checklist_json ?? {});
  }
  if ("enforcement_json" in next && !("enforcement_flags" in next)) {
    next.enforcement_flags = JSON.stringify(next.enforcement_json ?? {});
  }
  if ("status_history_json" in next && !("status_history" in next)) {
    next.status_history = JSON.stringify(next.status_history_json ?? []);
  }

  if ("checklist_data" in next && !("checklist_json" in next)) {
    next.checklist_json = parseJsonField(next.checklist_data, {});
  }
  if ("enforcement_flags" in next && !("enforcement_json" in next)) {
    next.enforcement_json = parseJsonField(next.enforcement_flags, {});
  }
  if ("status_history" in next && !("status_history_json" in next)) {
    next.status_history_json = parseJsonField(next.status_history, []);
  }

  next.updated_at = new Date().toISOString();
  return next;
}

export const packetService = {
  async getAll(filters: { statusFilter?: string; assignedToFilter?: string } = {}) {
    let query = supabase
      .from("hearing_packets")
      .select(
        `
        ${PACKET_LIST_COLUMNS},
        complaints!complaint_uuid ( id, address, complaintid, hearing_status )
      `,
      )
      .is("deleted_at", null)
      .order("hearing_date", { ascending: true });

    if (filters.statusFilter) {
      query = query.eq("packet_status", filters.statusFilter);
    }

    if (filters.assignedToFilter) {
      query = query.eq("assigned_to", filters.assignedToFilter);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map((p) => {
      const normalized = normalizePacketRow(p as any);
      return {
        ...normalized,
        address: (p as any).complaints?.address,
        complaintid: (p as any).complaints?.complaintid,
        complaintId: (p as any).complaints?.complaintid,
        hearingStatus: (p as any).complaints?.hearing_status,
      };
    });
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from("hearing_packets")
      .select(
        `
        ${PACKET_FULL_COLUMNS},
        complaint:complaints!complaint_uuid (
          id, complaintid, address, status, description, assigned_to,
          date_entered, hearing_status, hearing_date, locationid,
          category, deleted_at,
          hearing_rp_name, hearing_rp_phone, hearing_rp_email,
          hearing_rp_address, purpose_of_hearing,
          inspections!complaint_id (
            inspection_id, inspection_date, inspector, inspection_type,
            inspection_rating, status, notes, deleted_at,
            violations!inspection_id (
              id, violation_label, violation_code, category,
              location_in_property, corrective_action, due_date,
              responsible_party, status, observation, deleted_at,
              regulatory_reference_id
            ),
            inspection_photos!inspection_id (
              id, photo_url, photo_type, caption, violation_label,
              photo_taken_at, display_address, exhibit_label,
              packet_include, packet_sort_order, deleted_at
            )
          ),
          chronology!complaint_uuid (
            id, summary, entry_date, entry_type, created_by,
            visibility, chronology_order, citation_code, exhibit_refs, deleted_at
          ),
          service_log!complaint_uuid (
            id, notice_type, service_method, service_date, recipient,
            tracking_number, proof_of_service, status, notes, deleted_at
          )
        )
        `,
        )
        .eq("id", id)
        .single();
    if (error) throw error;

    const packet = normalizePacketRow(data as any);
    const complaint = (data as any).complaint;
    return {
      packet,
      complaint,
      location: complaint?.locations,
      inspections: complaint?.inspections || [],
      chronology: complaint?.chronology || [],
      serviceLog: complaint?.service_log || [],
    };
  },

  async create(complaintId: string) {
    const { data, error } = await supabase
      .from("hearing_packets")
      .insert([
        {
          complaint: complaintId,
          complaint_uuid: complaintId,
          packet_status: "Not Started",
        },
      ])
      .select(PACKET_LIST_COLUMNS)
      .single();

    if (error) throw error;
    return normalizePacketRow(data as any);
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from("hearing_packets")
      .update(toLegacyCompatibleUpdates(updates))
      .eq("id", id)
      .select(PACKET_FULL_COLUMNS)
      .single();

    if (error) throw error;
    return normalizePacketRow(data as any);
  },

  async buildPacketJson(packetId: string) {
    const { data, error } = await supabase.rpc("build_hearing_packet_json", {
      p_hearing_packet_id: packetId,
    });
    if (error) throw error;
    return data;
  },

  async validatePacket(packetId: string): Promise<PacketValidationResult[]> {
    const { data, error } = await supabase.rpc("validate_hearing_packet", {
      p_hearing_packet_id: packetId,
    });
    if (error) throw error;
    return (data ?? []) as PacketValidationResult[];
  },

  async refreshSnapshot(packetId: string) {
    const { data, error } = await supabase.rpc("refresh_hearing_packet_snapshot", {
      p_hearing_packet_id: packetId,
    });
    if (error) throw error;
    return data;
  },

  async generateHearingPacket(
    packetId: string,
    packetType: "draft" | "final" = "draft",
  ): Promise<GenerateHearingPacketResult> {
    const { data, error } = await supabase.functions.invoke("generate-hearing-packet", {
      body: { packetId, packetType },
    });
    if (error) throw error;
    return data as GenerateHearingPacketResult;
  },

  async getGeneratedFileUrl(fileId: string): Promise<GeneratedFileUrlResult> {
    const { data, error } = await supabase.functions.invoke("get-hearing-packet-file-url", {
      body: { fileId },
    });
    if (error) throw error;
    return data as GeneratedFileUrlResult;
  },

  async getPacketFiles(packetId: string): Promise<GeneratedPacketFile[]> {
    const { data, error } = await supabase
      .from("generated_packet_files")
      .select(
        `id, hearing_packet_id, complaint_uuid, file_type, file_path, file_name,
         mime_type, version_number, generated_by, generated_at, packet_hash,
         is_final, notes, metadata`,
      )
      .eq("hearing_packet_id", packetId)
      .order("generated_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as GeneratedPacketFile[];
  },

  async getPacketEvents(packetId: string): Promise<PacketGenerationEvent[]> {
    const { data, error } = await supabase
      .from("packet_generation_events")
      .select(
        `id, hearing_packet_id, complaint_uuid, event_type, event_status,
         event_message, event_data, created_by, created_at`,
      )
      .eq("hearing_packet_id", packetId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as PacketGenerationEvent[];
  },

  async logPacketEvent({
    packetId,
    complaintUuid,
    eventType,
    eventStatus = "success",
    eventMessage,
    eventData = {},
  }: {
    packetId: string;
    complaintUuid?: string | null;
    eventType: string;
    eventStatus?: "info" | "success" | "warning" | "error" | "blocked";
    eventMessage?: string;
    eventData?: Record<string, unknown>;
  }) {
    const { data, error } = await supabase
      .from("packet_generation_events")
      .insert({
        hearing_packet_id: packetId,
        complaint_uuid: complaintUuid ?? null,
        event_type: eventType,
        event_status: eventStatus,
        event_message: eventMessage ?? null,
        event_data: eventData,
      })
      .select(
        `id, hearing_packet_id, complaint_uuid, event_type, event_status,
         event_message, event_data, created_by, created_at`,
      )
      .single();

    if (error) throw error;
    return data as PacketGenerationEvent;
  },

  async saveComplianceAnalysis(
    packetId: string,
    complianceData: {
      extractedText: string;
      complianceResult: ComplianceResult;
      mappedData: PacketData;
      analyzedAt: string;
    },
  ) {
    const { data, error } = await supabase
      .from("hearing_packets")
      .update(
        toLegacyCompatibleUpdates({
          case_number: complianceData.mappedData?.caseNumber,
          notes: `[COMPLIANCE_ANALYSIS]\nAnalyzed at: ${complianceData.analyzedAt}\nScore: ${complianceData.complianceResult.score}\nStatus: ${complianceData.complianceResult.isCompliant ? "Compliant" : "Non-Compliant"}\nIssues: ${complianceData.complianceResult.issues.length}\n\n${complianceData.complianceResult.summary}`,
          packet_status: complianceData.complianceResult.isCompliant
            ? "In Progress"
            : "Under Review",
        }),
      )
      .eq("id", packetId)
      .select(PACKET_FULL_COLUMNS)
      .single();

    if (error) throw error;
    return normalizePacketRow(data as any);
  },

  async generateAndStorePdf(packetId: string, pdfBlob: Blob): Promise<string> {
    const fileName = `final_packet_${Date.now()}.pdf`;
    const filePath = `packets/${packetId}/${fileName}`;

    // 1. Upload the Blob to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, pdfBlob, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // 2. Get the public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("documents").getPublicUrl(filePath);

    // 3. Update the hearing_packets record's notes with the storage URL
    // We'll append it to existing notes if possible
    const { data: currentPacket } = await supabase
      .from("hearing_packets")
      .select("notes")
      .eq("id", packetId)
      .single();

    const updatedNotes = currentPacket?.notes
      ? `${currentPacket.notes}\n\n[FINAL_PDF_URL]\n${publicUrl}`
      : `[FINAL_PDF_URL]\n${publicUrl}`;

    const { error: updateError } = await supabase
      .from("hearing_packets")
      .update({
        notes: updatedNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", packetId);

    if (updateError) throw updateError;

    return publicUrl;
  },
};
