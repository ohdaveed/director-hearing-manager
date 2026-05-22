import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database";

type Complaint = Database["public"]["Tables"]["complaints"]["Row"];
type ComplaintInsert = Database["public"]["Tables"]["complaints"]["Insert"];
type ComplaintUpdate = Database["public"]["Tables"]["complaints"]["Update"];

export type EscalationQueueComplaint = Pick<
  Complaint,
  | "id"
  | "legacy_complaint_id"
  | "address"
  | "status"
  | "description"
  | "assigned_to"
  | "date_entered"
  | "hearing_status"
  | "hearing_date"
  | "legacy_location_id"
  | "category"
  | "reinspection_due_on_after"
  | "deleted_at"
> & {
  hearing_packets?: Array<{
    id: string;
    hearing_date: string | null;
    packet_status: string | null;
    assigned_to: string | null;
    case_number: string | null;
    program_code: string | null;
    packet_type: string | null;
    deleted_at: string | null;
  }>;
};

/**
 * Column selection constants to avoid SELECT * anti-pattern.
 * Centralize here so changes propagate everywhere.
 */
export const COMPLAINT_LIST_COLUMNS = `
  id, legacy_complaint_id, address, status, description, assigned_to,
  date_entered, hearing_status, hearing_date, legacy_location_id,
  category, reinspection_due_on_after, deleted_at
`;

export const COMPLAINT_ESCALATION_COLUMNS = `
  ${COMPLAINT_LIST_COLUMNS},
  hearing_packets!complaint_id (
    id, hearing_date, packet_status, assigned_to, case_number,
    program_code, packet_type, deleted_at
  )
`;

export const COMPLAINT_FULL_COLUMNS = `
  id, legacy_complaint_id, address, status, description, assigned_to,
  date_entered, hearing_status, hearing_date, legacy_location_id,
  category, reinspection_due_on_after, deleted_at,
  date_last_report_sent, attachments, complainant_name,
  complainant_phone, complainant_email, complainant_address,
  complainant_anonymous, complainant_contact_dates,
  "311_case_number", unit_number, complaint_type, complaint_subtype,
  method_received, assigned_program, date_assigned, date_closed,
  facility_name, facility_ownership,
  hearing_rp_name, hearing_rp_phone, hearing_rp_email, hearing_rp_address,
  purpose_of_hearing, notice_of_hearing_date, hearing_order_date,
  thread_parent
`;

function toTitleCase(value: string) {
  return value
    .split(/[.\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function getAssigneeVariants(value: string) {
  const normalized = value.trim();
  const variants = new Set<string>();
  if (!normalized) return [];

  variants.add(normalized);

  if (normalized.includes("@")) {
    const [localPart] = normalized.split("@");
    variants.add(toTitleCase(localPart));
  } else if (normalized.includes(" ")) {
    const emailLocal = normalized.toLowerCase().replace(/\s+/g, ".");
    variants.add(`${emailLocal}@sfdph.org`);
  }

  return Array.from(variants);
}

export const complaintService = {
  async getAll(filters: { assigned_to?: string } = {}): Promise<Complaint[]> {
    let query = supabase
      .from("complaints")
      .select(COMPLAINT_LIST_COLUMNS)
      .is("deleted_at", null)
      .order("date_entered", { ascending: false });

    if (filters.assigned_to) {
      const assigneeVariants = getAssigneeVariants(filters.assigned_to);
      query =
        assigneeVariants.length > 1
          ? query.in("assigned_to", assigneeVariants)
          : query.eq("assigned_to", filters.assigned_to);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Complaint[];
  },

  async getEscalationQueue(): Promise<EscalationQueueComplaint[]> {
    const { data, error } = await supabase
      .from("complaints")
      .select(COMPLAINT_ESCALATION_COLUMNS)
      .is("deleted_at", null)
      .order("date_entered", { ascending: false });

    if (error) throw error;
    // Supabase's generated table row type cannot express embedded PostgREST
    // relation payloads, so this boundary narrows the explicit select above.
    return data as unknown as EscalationQueueComplaint[];
  },

  async getById(id: string): Promise<any> {
    const { data, error } = await supabase
      .from("complaints")
      .select(
        `
         ${COMPLAINT_FULL_COLUMNS},
         inspections!complaint_id (
           inspection_id, inspection_date, inspector, inspection_type,
           inspection_rating, status, notes, deleted_at,
           violations!inspection_id (
             id, violation_label, violation_code, category,
             location_in_property, corrective_action, due_date,
             responsible_party, status, observation, deleted_at
           ),
           inspection_photos!inspection_id (
             id, photo_url, photo_type, caption, violation_label, deleted_at
           )
         ),
         chronology!complaint_id (
           id, summary, entry_date, entry_type, created_by,
           visibility, chronology_order, citation_code, deleted_at
         ),
         hearing_packets!complaint_id (
           id, hearing_date, packet_status, assigned_to, case_number,
           program_code, packet_type
         )
       `,
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(complaint: ComplaintInsert): Promise<Complaint> {
    const { data, error } = await supabase
      .from("complaints")
      .insert([
        {
          ...complaint,
        },
      ])
      .select(COMPLAINT_LIST_COLUMNS)
      .single();

    if (error) throw error;
    return data as Complaint;
  },

  async update(id: string, updates: ComplaintUpdate): Promise<Complaint> {
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
    return data as Complaint;
  },

  async softDelete(id: string): Promise<Complaint> {
    const { data, error } = await supabase
      .from("complaints")
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as ComplaintUpdate)
      .eq("id", id)
      .select(COMPLAINT_LIST_COLUMNS)
      .single();

    if (error) throw error;
    return data as Complaint;
  },
};
