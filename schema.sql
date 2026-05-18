CREATE TYPE inspection_photos_photo_type_enum AS ENUM ('Violation', 'Abatement', 'Memo of Visit', 'General');

CREATE TYPE complaints_status_enum AS ENUM ('New', 'Contact Pending', 'Inspection Scheduled', 'NOV Issued', 'Re-Inspection Due', 'Non-Compliant', 'Escalated', 'Monitoring', 'Closed — Compliant', 'Closed — No Violation', 'Closed — Unfounded', 'Open');

CREATE TYPE complaints_hearing_status_enum AS ENUM ('None', 'Referral Pending', 'Referred', 'Hearing Scheduled', 'Heard', 'Decision Issued');

CREATE TYPE complaints_method_received_enum AS ENUM ('Email', 'Phone', 'In-Person', '311', 'Walk-In', 'Letter');

CREATE TYPE complaints_assigned_program_enum AS ENUM ('Healthy Housing and Vector Control', 'Environmental Health', 'Vector Control');

CREATE TYPE locations_facility_type_enum AS ENUM ('Tourist Hotel', 'Residential Hotel', 'Apartments', 'Residential Property', 'Vacant Lot', 'City Owned Property', 'Other');

CREATE TYPE inspections_inspection_type_enum AS ENUM ('Routine', 'Routine Re-inspection', 'Complaint', 'Complaint Re-inspection', 'Citation to Hearing Issued', 'Field Consultation / Survey', 'Imported');

CREATE TYPE inspections_inspection_rating_enum AS ENUM ('Satisfactory', 'Unsatisfactory');

CREATE TYPE inspections_access_granted_by_enum AS ENUM ('Tenant', 'Owner', 'Property Manager', 'Could Not Access', 'Memo of Visit Left on Site', 'Observed from Adjacent Lot', 'Observed from Public Right of Way');

CREATE TYPE inspections_status_enum AS ENUM ('Draft', 'Submitted');

CREATE TYPE violations_responsible_party_enum AS ENUM ('Owner', 'Tenant');

CREATE TYPE violations_status_enum AS ENUM ('Violation', 'Abated', 'Corrected on Site');

CREATE TYPE chronology_entry_type_enum AS ENUM ('Inspection', 'NOV', 'Re-inspection', 'Contact Attempt', 'Hearing Referral', 'Other');

CREATE TYPE chronology_visibility_enum AS ENUM ('Public', 'Internal');

CREATE TYPE chronology_citation_code_enum AS ENUM ('§ 581(b)(1) — Garbage / Refuse / Waste', '§ 581(b)(2) — Overgrown Vegetation', '§ 581(b)(3) — Accumulation of Paper Materials', '§ 581(b)(4) — Unsanitary Conditions', '§ 581(b)(5) — Sewage / Human Waste', '§ 581(b)(6) — Mold Growth', '§ 581(b)(7) — Pigeons / Birds', '§ 581(b)(8) — Noxious Insects / Vermin', '§ 581(b)(11) — Poison Oak', '§ 581(b)(13) — Rodents', '§ 581(b)(18) — Public Health Safety Threat', '§ 609 — Unpaid Fees');

CREATE TYPE owner_documents_category_enum AS ENUM ('Proof of Service', 'NOV', 'Correspondence', 'Permit', 'Owner Response', 'Other');

CREATE TYPE exhibits_exhibit_type_enum AS ENUM ('Photo', 'Inspection Report', 'NOV', 'Correspondence', 'Other');

CREATE TYPE exhibits_category_enum AS ENUM ('Inspection Report', 'Photos', 'NOV', 'Correspondence', 'Proof of Service', 'Other');

CREATE TYPE service_log_service_method_enum AS ENUM ('Certified Mail', 'Personal Service', 'Posting', 'Email');

CREATE TYPE service_log_status_enum AS ENUM ('Draft', 'Mailed', 'Posted', 'Personally Served', 'Returned', 'Proof Complete');

CREATE TYPE hearing_packets_packet_status_enum AS ENUM ('Not Started', 'In Progress', 'Under Review', 'Complete', 'Submitted');

CREATE TYPE hearing_packets_program_code_enum AS ENUM ('HHV', 'HHP', 'VEC', 'ENV');

CREATE TYPE hearing_packets_packet_type_enum AS ENUM ('Draft', 'Final');

CREATE TYPE users_role_enum AS ENUM ('Admin', 'Inspector', 'Program Manager', 'Super Admin');

CREATE TYPE users_signature_style_enum AS ENUM ('Style 1 — Classic', 'Style 2 — Flowing', 'Style 3 — Formal', 'Style 4 — Modern');

CREATE TYPE imported_reports_parsing_status_enum AS ENUM ('Pending', 'Parsed', 'Failed', 'Manual');

CREATE TABLE inspection_photos (
  id uuid primary key default gen_random_uuid(),
  photo_url text,
  photo_type inspection_photos_photo_type_enum,
  caption text,
  violation_label text,
  complaint_id text,
  inspector text,
  uploaded_at timestamp with time zone,
  exhibits text,
  complaint text,
  inspection text,
  hearing_packets text[],
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone,
  deleted_at timestamp with time zone
);

CREATE TABLE complaints (
  id uuid primary key default gen_random_uuid(),
  date_entered date,
  address text,
  complaintid text,
  locationid text,
  status complaints_status_enum,
  description text,
  assigned_to text,
  category text[],
  date_last_report_sent text,
  reinspection_due_on_after date,
  attachments boolean,
  inspections text,
  location text,
  complainant_name text,
  complainant_phone text,
  complainant_email text,
  chronology text,
  owner_documents text,
  exhibits text,
  service_log text,
  hearing_packets text,
  hearing_status complaints_hearing_status_enum,
  hearing_date date,
  thread_parent text,
  violations text,
  inspection_photos text,
  "311_case_number" text,
  unit_number text,
  complaint_type text,
  complaint_subtype text,
  method_received complaints_method_received_enum,
  assigned_program complaints_assigned_program_enum,
  date_assigned date,
  complainant_anonymous boolean,
  complainant_address text,
  complainant_contact_dates text,
  facility_name text,
  facility_ownership text,
  date_closed date,
  deleted_at timestamp with time zone,
  hearing_rp_name text,
  hearing_rp_phone text,
  hearing_rp_email text,
  hearing_rp_address text,
  purpose_of_hearing text,
  notice_of_hearing_date date,
  hearing_order_date date,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone
);

CREATE TABLE locations (
  id uuid primary key default gen_random_uuid(),
  address text,
  location_id text,
  owner_name text,
  owner_address text,
  owner_phone text,
  owner_email text,
  facility_type locations_facility_type_enum,
  number_of_units numeric,
  number_of_rooms numeric,
  healthy_housing boolean,
  census_tract text,
  current_fees numeric(10,2),
  inspections text,
  arrizon_open_complaint_inspections_list_1 text,
  block_lot text,
  dba text,
  management_name text,
  responsible_party text,
  responsible_party_phone text,
  responsible_party_email text,
  building_features text[],
  verification_date date,
  imported_reports text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone,
  deleted_at timestamp with time zone
);

CREATE TABLE inspections (
  inspection_id bigint primary key generated always as identity,
  location text,
  complaint text,
  inspector text,
  inspection_date date,
  time_in text,
  time_out text,
  inspection_type inspections_inspection_type_enum,
  inspection_rating inspections_inspection_rating_enum,
  access_granted_by inspections_access_granted_by_enum,
  dba text,
  contact_phone text,
  contact_email text,
  facility_address text,
  complaint_id text,
  location_id text,
  notes text,
  completed_report text,
  violation_count numeric,
  violations text,
  status inspections_status_enum,
  submitted_at timestamp with time zone,
  chronology text,
  exhibits text,
  deleted_at timestamp with time zone,
  imported_reports text,
  inspection_photos text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone
);

CREATE TABLE violations (
  id uuid primary key default gen_random_uuid(),
  violation_label text,
  inspection text,
  violation_code text,
  category text,
  location_in_property text,
  corrective_action text,
  due_date date,
  responsible_party violations_responsible_party_enum,
  status violations_status_enum,
  complaint text,
  deleted_at timestamp with time zone,
  observation text,
  exhibit_refs text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone
);

CREATE TABLE chronology (
  id uuid primary key default gen_random_uuid(),
  summary text,
  entry_date date,
  entry_type chronology_entry_type_enum,
  created_by text,
  complaint text,
  related_inspection text,
  frozen_at timestamp with time zone,
  source_record text,
  visibility chronology_visibility_enum,
  violations_observed text,
  exhibit_refs text,
  chronology_order numeric,
  attachment_page_ref text,
  citation_code chronology_citation_code_enum,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone,
  deleted_at timestamp with time zone
);

CREATE TABLE owner_documents (
  id uuid primary key default gen_random_uuid(),
  document_type text,
  submission_date date,
  notes text,
  received_by text,
  complaint text,
  category owner_documents_category_enum,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone,
  deleted_at timestamp with time zone
);

CREATE TABLE exhibits (
  id uuid primary key default gen_random_uuid(),
  exhibit_label text,
  exhibit_type exhibits_exhibit_type_enum,
  description text,
  sort_order numeric,
  complaint text,
  source_inspection text,
  source_photo text,
  file jsonb,
  caption text,
  category exhibits_category_enum,
  deleted_at timestamp with time zone,
  exhibit_date date,
  page_count numeric,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone
);

CREATE TABLE service_log (
  id uuid primary key default gen_random_uuid(),
  notice_type text,
  service_method service_log_service_method_enum,
  service_date date,
  recipient text,
  tracking_number text,
  proof_of_service boolean,
  notes text,
  status service_log_status_enum,
  complaint text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone,
  deleted_at timestamp with time zone
);

CREATE TABLE hearing_packets (
  id uuid primary key default gen_random_uuid(),
  hearing_date date,
  packet_status hearing_packets_packet_status_enum,
  assigned_to text,
  notes text,
  generated_at timestamp with time zone,
  complaint text,
  case_number text,
  program_code hearing_packets_program_code_enum,
  proposed_actions text[],
  hearing_time text,
  hearing_location text,
  chronology_snapshot text,
  packet_type hearing_packets_packet_type_enum,
  bates_start numeric,
  bates_end numeric,
  hearing_order_data text,
  selected_report_ids text,
  selected_photo_ids text,
  admin_fee text,
  checklist_data text,
  enforcement_flags text,
  selected_reports text[],
  selected_photos text[],
  inspector_signature text,
  manager_signature text,
  revision_notes text,
  status_history text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone,
  deleted_at timestamp with time zone
);

CREATE TABLE users (
  id uuid primary key default gen_random_uuid(),
  email text,
  first_name text,
  last_name text,
  role users_role_enum,
  last_login timestamp with time zone,
  signature_text text,
  signature_style users_signature_style_enum,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone,
  deleted_at timestamp with time zone
);

CREATE TABLE imported_reports (
  id uuid primary key default gen_random_uuid(),
  report_title text,
  location text,
  pdf_file jsonb,
  inspection_date date,
  inspection_type text,
  inspection_rating text,
  inspector_name text,
  violation_count numeric,
  parsing_status imported_reports_parsing_status_enum,
  uploaded_by text,
  uploaded_at timestamp with time zone,
  linked_inspection text,
  hearing_packets text[],
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone,
  deleted_at timestamp with time zone
);