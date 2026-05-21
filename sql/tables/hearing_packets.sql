-- atlas:import ../types/enum_hearing_packets_packet_status.sql
-- atlas:import ../types/enum_hearing_packets_program_code.sql
-- atlas:import ../types/enum_hearing_packets_packet_type.sql
-- atlas:import complaints.sql

CREATE TABLE hearing_packets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hearing_date DATE,
  packet_status hearing_packets_packet_status_enum,
  assigned_to TEXT,
  notes TEXT,
  generated_at TIMESTAMPTZ,
  legacy_complaint_ref TEXT,        -- renamed from complaint in 004
  case_number TEXT,
  program_code hearing_packets_program_code_enum,
  proposed_actions TEXT[],
  hearing_time TEXT,
  hearing_location TEXT,
  chronology_snapshot TEXT,
  packet_type hearing_packets_packet_type_enum,
  bates_start NUMERIC,
  bates_end NUMERIC,
  hearing_order_data TEXT,
  selected_report_ids TEXT,
  selected_photo_ids TEXT,
  admin_fee TEXT,
  checklist_data TEXT,
  enforcement_flags TEXT,
  selected_reports TEXT[],
  selected_photos TEXT[],
  inspector_signature TEXT,
  manager_signature TEXT,
  revision_notes TEXT,
  status_history TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  -- FK column (added in 001d, renamed in 004)
  complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE
);
