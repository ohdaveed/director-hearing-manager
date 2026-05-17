import { supabase } from "@/lib/supabase";

/**
 * Column selection constants to avoid SELECT * anti-pattern.
 * Centralize here so changes propagate everywhere.
 */
export const COMPLAINT_LIST_COLUMNS = `
  id, complaintid, address, status, description, assigned_to,
  date_entered, hearing_status, hearing_date, locationid,
  category, reinspection_due_on_after, deleted_at
`;

export const COMPLAINT_FULL_COLUMNS = `
  id, complaintid, address, status, description, assigned_to,
  date_entered, hearing_status, hearing_date, locationid,
  category, reinspection_due_on_after, deleted_at,
  date_last_report_sent, attachments, complainant_name,
  complainant_phone, complainant_email, complainant_address,
  complainant_anonymous, complainant_contact_dates,
  311_case_number, unit_number, complaint_type, complaint_subtype,
  method_received, assigned_program, date_assigned, date_closed,
  facility_name, facility_ownership,
  hearing_rp_name, hearing_rp_phone, hearing_rp_email, hearing_rp_address,
  purpose_of_hearing, notice_of_hearing_date, hearing_order_date,
  thread_parent, created_at, updated_at
`;

export const complaintService = {
  async getAll(filters: { assigned_to?: string } = {}) {
    let query = supabase
      .from("complaints")
      .select(COMPLAINT_LIST_COLUMNS)
      .is("deleted_at", null)
      .order("date_entered", { ascending: false });

    if (filters.assigned_to) {
      query = query.eq("assigned_to", filters.assigned_to);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as any[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from("complaints")
      .select(
        `
        ${COMPLAINT_FULL_COLUMNS},
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
        chronology (
          id, summary, entry_date, entry_type, created_by,
          visibility, chronology_order, citation_code, deleted_at
        ),
        hearing_packets (
          id, hearing_date, packet_status, assigned_to, case_number,
          program_code, packet_type, created_at
        )
      `,
      )
      .eq("id", id)
      .is("inspections.deleted_at", null)
      .is("chronology.deleted_at", null)
      .single();

    if (error) throw error;
    return data;
  },

  async create(complaint: any) {
    const { data, error } = await supabase
      .from("complaints")
      .insert([
        {
          ...complaint,
          created_at: new Date().toISOString(),
        },
      ])
      .select(COMPLAINT_LIST_COLUMNS)
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from("complaints")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(COMPLAINT_LIST_COLUMNS)
      .single();

    if (error) throw error;
    return data;
  },
};
