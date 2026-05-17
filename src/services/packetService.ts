import { supabase } from "@/lib/supabase";

/** Column selections to avoid SELECT * */
export const PACKET_LIST_COLUMNS = `
  id, hearing_date, packet_status, assigned_to, case_number,
  program_code, packet_type, notes, hearing_time, hearing_location,
  bates_start, bates_end, admin_fee, deleted_at, created_at, updated_at
`;

export const PACKET_FULL_COLUMNS = `
  ${PACKET_LIST_COLUMNS},
  generated_at, chronology_snapshot, hearing_order_data,
  selected_report_ids, selected_photo_ids, checklist_data,
  enforcement_flags, selected_reports, selected_photos,
  inspector_signature, manager_signature, revision_notes, status_history
`;

export const packetService = {
  async getAll(
    filters: { statusFilter?: string; assignedToFilter?: string } = {},
  ) {
    let query = supabase
      .from("hearing_packets")
      .select(
        `
        ${PACKET_LIST_COLUMNS},
        complaints ( id, address, complaintid, hearing_status )
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

    // Map to the expected frontend format
    return data.map((p) => ({
      ...p,
      address: (p as any).complaints?.address,
      complaintId: (p as any).complaints?.complaintid,
      hearingStatus: (p as any).complaints?.hearing_status,
    }));
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from("hearing_packets")
      .select(
        `
        ${PACKET_FULL_COLUMNS},
        complaint:complaints (
          id, complaintid, address, status, description, assigned_to,
          date_entered, hearing_status, hearing_date, locationid,
          category, deleted_at,
          inspections (
            inspection_id, inspection_date, inspector, inspection_type,
            inspection_rating, status, notes, deleted_at,
            violations (
              id, violation_label, violation_code, category,
              location_in_property, corrective_action, due_date,
              responsible_party, status, observation, deleted_at
            ),
            inspection_photos (
              id, photo_url, photo_type, caption, violation_label, deleted_at
            )
          ),
          locations (
            id, address, location_id, owner_name, owner_address,
            owner_phone, owner_email, facility_type
          ),
          chronology (
            id, summary, entry_date, entry_type, created_by,
            visibility, chronology_order, citation_code, deleted_at
          ),
          service_log (
            id, notice_type, service_method, service_date, recipient,
            tracking_number, proof_of_service, status, notes, deleted_at
          )
        )
      `,
      )
      .eq("id", id)
      .is("complaint.deleted_at", null)
      .single();

    if (error) throw error;

    const complaint = (data as any).complaint;
    return {
      packet: data,
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
          packet_status: "Not Started",
          created_at: new Date().toISOString(),
        },
      ])
      .select(PACKET_LIST_COLUMNS)
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from("hearing_packets")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(PACKET_LIST_COLUMNS)
      .single();

    if (error) throw error;
    return data;
  },

  async saveComplianceAnalysis(
    packetId: string,
    complianceData: {
      extractedText: string;
      complianceResult: any;
      mappedData: any;
      analyzedAt: string;
    },
  ) {
    const { data, error } = await supabase
      .from("hearing_packets")
      .update({
        notes: `[COMPLIANCE_ANALYSIS]\nAnalyzed at: ${complianceData.analyzedAt}\nScore: ${complianceData.complianceResult.score}\nStatus: ${complianceData.complianceResult.isCompliant ? "Compliant" : "Non-Compliant"}\nIssues: ${complianceData.complianceResult.issues.length}\n\n${complianceData.complianceResult.summary}`,
        packet_status: complianceData.complianceResult.isCompliant
          ? "Analysis Complete - Approved"
          : "Analysis Complete - Needs Review",
        updated_at: new Date().toISOString(),
      })
      .eq("id", packetId)
      .select(PACKET_LIST_COLUMNS)
      .single();

    if (error) throw error;
    return data;
  },

  async generateAndStorePdf(
    _packetId: string,
    content: string,
  ): Promise<string> {
    return new Promise((resolve) => {
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      resolve(url);
    });
  },
};
