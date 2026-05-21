-- atlas:import ../types/enum_inspections_inspection_type.sql
-- atlas:import ../types/enum_inspections_inspection_rating.sql
-- atlas:import ../types/enum_inspections_access_granted_by.sql
-- atlas:import ../types/enum_inspections_status.sql
-- atlas:import complaints.sql
-- atlas:import locations.sql

CREATE TABLE inspections (
  inspection_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  legacy_complaint_ref TEXT,    -- renamed from complaint in 004
  legacy_location_ref TEXT,     -- renamed from location in 004
  inspector TEXT,
  inspection_date DATE,
  time_in TEXT,
  time_out TEXT,
  inspection_type inspections_inspection_type_enum,
  inspection_rating inspections_inspection_rating_enum,
  access_granted_by inspections_access_granted_by_enum,
  dba TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  facility_address TEXT,
  legacy_complaint_id TEXT,     -- renamed from complaint_id in 004
  legacy_location_id TEXT,      -- renamed from location_id in 004
  notes TEXT,
  completed_report TEXT,
  violation_count NUMERIC,
  violations TEXT,
  status inspections_status_enum,
  submitted_at TIMESTAMPTZ,
  chronology TEXT,
  exhibits TEXT,
  deleted_at TIMESTAMPTZ,
  imported_reports TEXT,
  inspection_photos TEXT,
  global_observations TEXT[],   -- added in 003a
  areas_inspected TEXT[],       -- added in 003a
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  -- FK columns (added in 001d, renamed in 004)
  complaint_id UUID REFERENCES complaints(id) ON DELETE SET NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL
);
