-- atlas:import ../types/enum_imported_reports_parsing_status.sql
-- atlas:import locations.sql
-- atlas:import inspections.sql

CREATE TABLE imported_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_title TEXT,
  legacy_location_ref TEXT,           -- renamed from location in 004
  pdf_file JSONB,
  inspection_date DATE,
  inspection_type TEXT,
  inspection_rating TEXT,
  inspector_name TEXT,
  violation_count NUMERIC,
  parsing_status imported_reports_parsing_status_enum,
  uploaded_by TEXT,
  uploaded_at TIMESTAMPTZ,
  legacy_inspection_ref TEXT,         -- renamed from linked_inspection in 004
  hearing_packets TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  -- FK columns (added in 001d, renamed in 004)
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  linked_inspection_id BIGINT REFERENCES inspections(inspection_id) ON DELETE SET NULL
);
