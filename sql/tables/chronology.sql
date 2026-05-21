-- atlas:import ../types/enum_chronology_entry_type.sql
-- atlas:import ../types/enum_chronology_visibility.sql
-- atlas:import ../types/enum_chronology_citation_code.sql
-- atlas:import complaints.sql

CREATE TABLE chronology (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary TEXT,
  entry_date DATE,
  entry_type chronology_entry_type_enum,
  created_by TEXT,
  legacy_complaint_ref TEXT,         -- renamed from complaint in 004
  legacy_inspection_ref TEXT,        -- renamed from related_inspection in 004
  frozen_at TIMESTAMPTZ,
  source_record TEXT,
  visibility chronology_visibility_enum,
  violations_observed TEXT,
  exhibit_refs TEXT,
  chronology_order NUMERIC,
  attachment_page_ref TEXT,
  citation_code chronology_citation_code_enum,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  -- FK columns (added in 001d, renamed in 004)
  complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE
);
