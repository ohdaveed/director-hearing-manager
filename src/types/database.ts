/**
 * Database Types
 *
 * This file defines the strict TypeScript interfaces that match the Supabase/PostgreSQL schema.
 * It is manually maintained to ensure parity between the database and the frontend.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      inspection_photos: {
        Row: {
          id: string;
          photo_url: string | null;
          photo_type:
            | "Violation"
            | "Abatement"
            | "Memo of Visit"
            | "General"
            | null;
          caption: string | null;
          violation_label: string | null;
          complaint_id: string | null;
          inspector: string | null;
          uploaded_at: string | null;
          exhibits: string | null;
          complaint: string | null;
          inspection: string | null;
          hearing_packets: string[] | null;
          created_at: string;
          updated_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          photo_url?: string | null;
          photo_type?:
            | "Violation"
            | "Abatement"
            | "Memo of Visit"
            | "General"
            | null;
          caption?: string | null;
          violation_label?: string | null;
          complaint_id?: string | null;
          inspector?: string | null;
          uploaded_at?: string | null;
          exhibits?: string | null;
          complaint?: string | null;
          inspection?: string | null;
          hearing_packets?: string[] | null;
          created_at?: string;
          updated_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          photo_url?: string | null;
          photo_type?:
            | "Violation"
            | "Abatement"
            | "Memo of Visit"
            | "General"
            | null;
          caption?: string | null;
          violation_label?: string | null;
          complaint_id?: string | null;
          inspector?: string | null;
          uploaded_at?: string | null;
          exhibits?: string | null;
          complaint?: string | null;
          inspection?: string | null;
          hearing_packets?: string[] | null;
          created_at?: string;
          updated_at?: string | null;
          deleted_at?: string | null;
        };
      };
      complaints: {
        Row: {
          id: string;
          date_entered: string | null;
          address: string | null;
          complaintid: string | null;
          locationid: string | null;
          status:
            | "New"
            | "Contact Pending"
            | "Inspection Scheduled"
            | "NOV Issued"
            | "Re-Inspection Due"
            | "Non-Compliant"
            | "Escalated"
            | "Monitoring"
            | "Closed — Compliant"
            | "Closed — No Violation"
            | "Closed — Unfounded"
            | "Open"
            | null;
          description: string | null;
          assigned_to: string | null;
          category: string[] | null;
          date_last_report_sent: string | null;
          reinspection_due_on_after: string | null;
          attachments: boolean | null;
          inspections: string | null;
          location: string | null;
          complainant_name: string | null;
          complainant_phone: string | null;
          complainant_email: string | null;
          chronology: string | null;
          owner_documents: string | null;
          exhibits: string | null;
          service_log: string | null;
          hearing_packets: string | null;
          hearing_status:
            | "None"
            | "Referral Pending"
            | "Referred"
            | "Hearing Scheduled"
            | "Heard"
            | "Decision Issued"
            | null;
          hearing_date: string | null;
          thread_parent: string | null;
          violations: string | null;
          inspection_photos: string | null;
          "311_case_number": string | null;
          unit_number: string | null;
          complaint_type: string | null;
          complaint_subtype: string | null;
          method_received:
            | "Email"
            | "Phone"
            | "In-Person"
            | "311"
            | "Walk-In"
            | "Letter"
            | null;
          assigned_program:
            | "Healthy Housing and Vector Control"
            | "Environmental Health"
            | "Vector Control"
            | null;
          date_assigned: string | null;
          complainant_anonymous: boolean | null;
          complainant_address: string | null;
          complainant_contact_dates: string | null;
          facility_name: string | null;
          facility_ownership: string | null;
          date_closed: string | null;
          deleted_at: string | null;
          hearing_rp_name: string | null;
          hearing_rp_phone: string | null;
          hearing_rp_email: string | null;
          hearing_rp_address: string | null;
          purpose_of_hearing: string | null;
          notice_of_hearing_date: string | null;
          hearing_order_date: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          date_entered?: string | null;
          address?: string | null;
          complaintid?: string | null;
          locationid?: string | null;
          status?:
            | "New"
            | "Contact Pending"
            | "Inspection Scheduled"
            | "NOV Issued"
            | "Re-Inspection Due"
            | "Non-Compliant"
            | "Escalated"
            | "Monitoring"
            | "Closed — Compliant"
            | "Closed — No Violation"
            | "Closed — Unfounded"
            | "Open"
            | null;
          description?: string | null;
          assigned_to?: string | null;
          category?: string[] | null;
          date_last_report_sent?: string | null;
          reinspection_due_on_after?: string | null;
          attachments?: boolean | null;
          inspections?: string | null;
          location?: string | null;
          complainant_name?: string | null;
          complainant_phone?: string | null;
          complainant_email?: string | null;
          chronology?: string | null;
          owner_documents?: string | null;
          exhibits?: string | null;
          service_log?: string | null;
          hearing_packets?: string | null;
          hearing_status?:
            | "None"
            | "Referral Pending"
            | "Referred"
            | "Hearing Scheduled"
            | "Heard"
            | "Decision Issued"
            | null;
          hearing_date?: string | null;
          thread_parent?: string | null;
          violations?: string | null;
          inspection_photos?: string | null;
          "311_case_number"?: string | null;
          unit_number?: string | null;
          complaint_type?: string | null;
          complaint_subtype?: string | null;
          method_received?:
            | "Email"
            | "Phone"
            | "In-Person"
            | "311"
            | "Walk-In"
            | "Letter"
            | null;
          assigned_program?:
            | "Healthy Housing and Vector Control"
            | "Environmental Health"
            | "Vector Control"
            | null;
          date_assigned?: string | null;
          complainant_anonymous?: boolean | null;
          complainant_address?: string | null;
          complainant_contact_dates?: string | null;
          facility_name?: string | null;
          facility_ownership?: string | null;
          date_closed?: string | null;
          deleted_at?: string | null;
          hearing_rp_name?: string | null;
          hearing_rp_phone?: string | null;
          hearing_rp_email?: string | null;
          hearing_rp_address?: string | null;
          purpose_of_hearing?: string | null;
          notice_of_hearing_date?: string | null;
          hearing_order_date?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          date_entered?: string | null;
          address?: string | null;
          complaintid?: string | null;
          locationid?: string | null;
          status?:
            | "New"
            | "Contact Pending"
            | "Inspection Scheduled"
            | "NOV Issued"
            | "Re-Inspection Due"
            | "Non-Compliant"
            | "Escalated"
            | "Monitoring"
            | "Closed — Compliant"
            | "Closed — No Violation"
            | "Closed — Unfounded"
            | "Open"
            | null;
          description?: string | null;
          assigned_to?: string | null;
          category?: string[] | null;
          date_last_report_sent?: string | null;
          reinspection_due_on_after?: string | null;
          attachments?: boolean | null;
          inspections?: string | null;
          location?: string | null;
          complainant_name?: string | null;
          complainant_phone?: string | null;
          complainant_email?: string | null;
          chronology?: string | null;
          owner_documents?: string | null;
          exhibits?: string | null;
          service_log?: string | null;
          hearing_packets?: string | null;
          hearing_status?:
            | "None"
            | "Referral Pending"
            | "Referred"
            | "Hearing Scheduled"
            | "Heard"
            | "Decision Issued"
            | null;
          hearing_date?: string | null;
          thread_parent?: string | null;
          violations?: string | null;
          inspection_photos?: string | null;
          "311_case_number"?: string | null;
          unit_number?: string | null;
          complaint_type?: string | null;
          complaint_subtype?: string | null;
          method_received?:
            | "Email"
            | "Phone"
            | "In-Person"
            | "311"
            | "Walk-In"
            | "Letter"
            | null;
          assigned_program?:
            | "Healthy Housing and Vector Control"
            | "Environmental Health"
            | "Vector Control"
            | null;
          date_assigned?: string | null;
          complainant_anonymous?: boolean | null;
          complainant_address?: string | null;
          complainant_contact_dates?: string | null;
          facility_name?: string | null;
          facility_ownership?: string | null;
          date_closed?: string | null;
          deleted_at?: string | null;
          hearing_rp_name?: string | null;
          hearing_rp_phone?: string | null;
          hearing_rp_email?: string | null;
          hearing_rp_address?: string | null;
          purpose_of_hearing?: string | null;
          notice_of_hearing_date?: string | null;
          hearing_order_date?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      locations: {
        Row: {
          id: string;
          address: string | null;
          location_id: string | null;
          owner_name: string | null;
          owner_address: string | null;
          owner_phone: string | null;
          owner_email: string | null;
          facility_type:
            | "Tourist Hotel"
            | "Residential Hotel"
            | "Apartments"
            | "Residential Property"
            | "Vacant Lot"
            | "City Owned Property"
            | "Other"
            | null;
          number_of_units: number | null;
          number_of_rooms: number | null;
          healthy_housing: boolean | null;
          census_tract: string | null;
          current_fees: number | null;
          inspections: string | null;
          arrizon_open_complaint_inspections_list_1: string | null;
          block_lot: string | null;
          dba: string | null;
          management_name: string | null;
          responsible_party: string | null;
          responsible_party_phone: string | null;
          responsible_party_email: string | null;
          building_features: string[] | null;
          verification_date: string | null;
          imported_reports: string | null;
          created_at: string;
          updated_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          address?: string | null;
          location_id?: string | null;
          owner_name?: string | null;
          owner_address?: string | null;
          owner_phone?: string | null;
          owner_email?: string | null;
          facility_type?:
            | "Tourist Hotel"
            | "Residential Hotel"
            | "Apartments"
            | "Residential Property"
            | "Vacant Lot"
            | "City Owned Property"
            | "Other"
            | null;
          number_of_units?: number | null;
          number_of_rooms?: number | null;
          healthy_housing?: boolean | null;
          census_tract?: string | null;
          current_fees?: number | null;
          inspections?: string | null;
          arrizon_open_complaint_inspections_list_1?: string | null;
          block_lot?: string | null;
          dba?: string | null;
          management_name?: string | null;
          responsible_party?: string | null;
          responsible_party_phone?: string | null;
          responsible_party_email?: string | null;
          building_features?: string[] | null;
          verification_date?: string | null;
          imported_reports?: string | null;
          created_at?: string;
          updated_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          address?: string | null;
          location_id?: string | null;
          owner_name?: string | null;
          owner_address?: string | null;
          owner_phone?: string | null;
          owner_email?: string | null;
          facility_type?:
            | "Tourist Hotel"
            | "Residential Hotel"
            | "Apartments"
            | "Residential Property"
            | "Vacant Lot"
            | "City Owned Property"
            | "Other"
            | null;
          number_of_units?: number | null;
          number_of_rooms?: number | null;
          healthy_housing?: boolean | null;
          census_tract?: string | null;
          current_fees?: number | null;
          inspections?: string | null;
          arrizon_open_complaint_inspections_list_1?: string | null;
          block_lot?: string | null;
          dba?: string | null;
          management_name?: string | null;
          responsible_party?: string | null;
          responsible_party_phone?: string | null;
          responsible_party_email?: string | null;
          building_features?: string[] | null;
          verification_date?: string | null;
          imported_reports?: string | null;
          created_at?: string;
          updated_at?: string | null;
          deleted_at?: string | null;
        };
      };
      inspections: {
        Row: {
          inspection_id: number;
          location: string | null;
          complaint: string | null;
          inspector: string | null;
          inspection_date: string | null;
          time_in: string | null;
          time_out: string | null;
          inspection_type:
            | "Routine"
            | "Routine Re-inspection"
            | "Complaint"
            | "Complaint Re-inspection"
            | "Citation to Hearing Issued"
            | "Field Consultation / Survey"
            | "Imported"
            | null;
          inspection_rating: "Satisfactory" | "Unsatisfactory" | null;
          access_granted_by:
            | "Tenant"
            | "Owner"
            | "Property Manager"
            | "Could Not Access"
            | "Memo of Visit Left on Site"
            | "Observed from Adjacent Lot"
            | "Observed from Public Right of Way"
            | null;
          dba: string | null;
          contact_phone: string | null;
          contact_email: string | null;
          facility_address: string | null;
          complaint_id: string | null;
          location_id: string | null;
          notes: string | null;
          completed_report: string | null;
          violation_count: number | null;
          violations: string | null;
          status: "Draft" | "Submitted" | null;
          submitted_at: string | null;
          chronology: string | null;
          exhibits: string | null;
          deleted_at: string | null;
          imported_reports: string | null;
          inspection_photos: string | null;
          global_observations: string[] | null;
          areas_inspected: string[] | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          inspection_id?: never;
          location?: string | null;
          complaint?: string | null;
          inspector?: string | null;
          inspection_date?: string | null;
          time_in?: string | null;
          time_out?: string | null;
          inspection_type?:
            | "Routine"
            | "Routine Re-inspection"
            | "Complaint"
            | "Complaint Re-inspection"
            | "Citation to Hearing Issued"
            | "Field Consultation / Survey"
            | "Imported"
            | null;
          inspection_rating?: "Satisfactory" | "Unsatisfactory" | null;
          access_granted_by?:
            | "Tenant"
            | "Owner"
            | "Property Manager"
            | "Could Not Access"
            | "Memo of Visit Left on Site"
            | "Observed from Adjacent Lot"
            | "Observed from Public Right of Way"
            | null;
          dba?: string | null;
          contact_phone?: string | null;
          contact_email?: string | null;
          facility_address?: string | null;
          complaint_id?: string | null;
          location_id?: string | null;
          notes?: string | null;
          completed_report?: string | null;
          violation_count?: number | null;
          violations?: string | null;
          status?: "Draft" | "Submitted" | null;
          submitted_at?: string | null;
          chronology?: string | null;
          exhibits?: string | null;
          deleted_at?: string | null;
          imported_reports?: string | null;
          inspection_photos?: string | null;
          global_observations?: string[] | null;
          areas_inspected?: string[] | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          inspection_id?: never;
          location?: string | null;
          complaint?: string | null;
          inspector?: string | null;
          inspection_date?: string | null;
          time_in?: string | null;
          time_out?: string | null;
          inspection_type?:
            | "Routine"
            | "Routine Re-inspection"
            | "Complaint"
            | "Complaint Re-inspection"
            | "Citation to Hearing Issued"
            | "Field Consultation / Survey"
            | "Imported"
            | null;
          inspection_rating?: "Satisfactory" | "Unsatisfactory" | null;
          access_granted_by?:
            | "Tenant"
            | "Owner"
            | "Property Manager"
            | "Could Not Access"
            | "Memo of Visit Left on Site"
            | "Observed from Adjacent Lot"
            | "Observed from Public Right of Way"
            | null;
          dba?: string | null;
          contact_phone?: string | null;
          contact_email?: string | null;
          facility_address?: string | null;
          complaint_id?: string | null;
          location_id?: string | null;
          notes?: string | null;
          completed_report?: string | null;
          violation_count?: number | null;
          violations?: string | null;
          status?: "Draft" | "Submitted" | null;
          submitted_at?: string | null;
          chronology?: string | null;
          exhibits?: string | null;
          deleted_at?: string | null;
          imported_reports?: string | null;
          inspection_photos?: string | null;
          global_observations?: string[] | null;
          areas_inspected?: string[] | null;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      violations: {
        Row: {
          id: string;
          violation_label: string | null;
          inspection: string | null;
          violation_code: string | null;
          category: string | null;
          location_in_property: string | null;
          corrective_action: string | null;
          due_date: string | null;
          responsible_party: "Owner" | "Tenant" | null;
          status: "Violation" | "Abated" | "Corrected on Site" | null;
          complaint: string | null;
          deleted_at: string | null;
          observation: string | null;
          exhibit_refs: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          violation_label?: string | null;
          inspection?: string | null;
          violation_code?: string | null;
          category?: string | null;
          location_in_property?: string | null;
          corrective_action?: string | null;
          due_date?: string | null;
          responsible_party?: "Owner" | "Tenant" | null;
          status?: "Violation" | "Abated" | "Corrected on Site" | null;
          complaint?: string | null;
          deleted_at?: string | null;
          observation?: string | null;
          exhibit_refs?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          violation_label?: string | null;
          inspection?: string | null;
          violation_code?: string | null;
          category?: string | null;
          location_in_property?: string | null;
          corrective_action?: string | null;
          due_date?: string | null;
          responsible_party?: "Owner" | "Tenant" | null;
          status?: "Violation" | "Abated" | "Corrected on Site" | null;
          complaint?: string | null;
          deleted_at?: string | null;
          observation?: string | null;
          exhibit_refs?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      chronology: {
        Row: {
          id: string;
          summary: string | null;
          entry_date: string | null;
          entry_type:
            | "Inspection"
            | "NOV"
            | "Re-inspection"
            | "Contact Attempt"
            | "Hearing Referral"
            | "Other"
            | null;
          created_by: string | null;
          complaint: string | null;
          related_inspection: string | null;
          frozen_at: string | null;
          source_record: string | null;
          visibility: "Public" | "Internal" | null;
          violations_observed: string | null;
          exhibit_refs: string | null;
          chronology_order: number | null;
          attachment_page_ref: string | null;
          citation_code: string | null;
          created_at: string;
          updated_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          summary?: string | null;
          entry_date?: string | null;
          entry_type?:
            | "Inspection"
            | "NOV"
            | "Re-inspection"
            | "Contact Attempt"
            | "Hearing Referral"
            | "Other"
            | null;
          created_by?: string | null;
          complaint?: string | null;
          related_inspection?: string | null;
          frozen_at?: string | null;
          source_record?: string | null;
          visibility?: "Public" | "Internal" | null;
          violations_observed?: string | null;
          exhibit_refs?: string | null;
          chronology_order?: number | null;
          attachment_page_ref?: string | null;
          citation_code?: string | null;
          created_at?: string;
          updated_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          summary?: string | null;
          entry_date?: string | null;
          entry_type?:
            | "Inspection"
            | "NOV"
            | "Re-inspection"
            | "Contact Attempt"
            | "Hearing Referral"
            | "Other"
            | null;
          created_by?: string | null;
          complaint?: string | null;
          related_inspection?: string | null;
          frozen_at?: string | null;
          source_record?: string | null;
          visibility?: "Public" | "Internal" | null;
          violations_observed?: string | null;
          exhibit_refs?: string | null;
          chronology_order?: number | null;
          attachment_page_ref?: string | null;
          citation_code?: string | null;
          created_at?: string;
          updated_at?: string | null;
          deleted_at?: string | null;
        };
      };
      users: {
        Row: {
          id: string;
          email: string | null;
          first_name: string | null;
          last_name: string | null;
          role:
            | "Admin"
            | "Inspector"
            | "Program Manager"
            | "Super Admin"
            | null;
          last_login: string | null;
          signature_text: string | null;
          signature_style:
            | "Style 1 — Classic"
            | "Style 2 — Flowing"
            | "Style 3 — Formal"
            | "Style 4 — Modern"
            | null;
          created_at: string;
          updated_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          email?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          role?:
            | "Admin"
            | "Inspector"
            | "Program Manager"
            | "Super Admin"
            | null;
          last_login?: string | null;
          signature_text?: string | null;
          signature_style?:
            | "Style 1 — Classic"
            | "Style 2 — Flowing"
            | "Style 3 — Formal"
            | "Style 4 — Modern"
            | null;
          created_at?: string;
          updated_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          role?:
            | "Admin"
            | "Inspector"
            | "Program Manager"
            | "Super Admin"
            | null;
          last_login?: string | null;
          signature_text?: string | null;
          signature_style?:
            | "Style 1 — Classic"
            | "Style 2 — Flowing"
            | "Style 3 — Formal"
            | "Style 4 — Modern"
            | null;
          created_at?: string;
          updated_at?: string | null;
          deleted_at?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      inspection_photos_photo_type_enum:
        | "Violation"
        | "Abatement"
        | "Memo of Visit"
        | "General";
      complaints_status_enum:
        | "New"
        | "Contact Pending"
        | "Inspection Scheduled"
        | "NOV Issued"
        | "Re-Inspection Due"
        | "Non-Compliant"
        | "Escalated"
        | "Monitoring"
        | "Closed — Compliant"
        | "Closed — No Violation"
        | "Closed — Unfounded"
        | "Open";
      complaints_hearing_status_enum:
        | "None"
        | "Referral Pending"
        | "Referred"
        | "Hearing Scheduled"
        | "Heard"
        | "Decision Issued";
      complaints_method_received_enum:
        | "Email"
        | "Phone"
        | "In-Person"
        | "311"
        | "Walk-In"
        | "Letter";
      complaints_assigned_program_enum:
        | "Healthy Housing and Vector Control"
        | "Environmental Health"
        | "Vector Control";
      locations_facility_type_enum:
        | "Tourist Hotel"
        | "Residential Hotel"
        | "Apartments"
        | "Residential Property"
        | "Vacant Lot"
        | "City Owned Property"
        | "Other";
      inspections_inspection_type_enum:
        | "Routine"
        | "Routine Re-inspection"
        | "Complaint"
        | "Complaint Re-inspection"
        | "Citation to Hearing Issued"
        | "Field Consultation / Survey"
        | "Imported";
      inspections_inspection_rating_enum: "Satisfactory" | "Unsatisfactory";
      inspections_access_granted_by_enum:
        | "Tenant"
        | "Owner"
        | "Property Manager"
        | "Could Not Access"
        | "Memo of Visit Left on Site"
        | "Observed from Adjacent Lot"
        | "Observed from Public Right of Way";
      inspections_status_enum: "Draft" | "Submitted";
      violations_responsible_party_enum: "Owner" | "Tenant";
      violations_status_enum: "Violation" | "Abated" | "Corrected on Site";
      chronology_entry_type_enum:
        | "Inspection"
        | "NOV"
        | "Re-inspection"
        | "Contact Attempt"
        | "Hearing Referral"
        | "Other";
      chronology_visibility_enum: "Public" | "Internal";
      users_role_enum:
        | "Admin"
        | "Inspector"
        | "Program Manager"
        | "Super Admin";
      users_signature_style_enum:
        | "Style 1 — Classic"
        | "Style 2 — Flowing"
        | "Style 3 — Formal"
        | "Style 4 — Modern";
    };
  };
}
