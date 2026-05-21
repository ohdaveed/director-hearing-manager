-- atlas:import ../types/enum_violations_responsible_party.sql
-- atlas:import ../types/enum_violations_status.sql
-- atlas:import inspections.sql

CREATE TABLE violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  violation_label TEXT,
  legacy_inspection_ref TEXT,   -- renamed from inspection in 004
  violation_code TEXT,
  category TEXT,
  location_in_property TEXT,
  corrective_action TEXT,
  due_date DATE,
  responsible_party violations_responsible_party_enum,
  status violations_status_enum,
  legacy_complaint_ref TEXT,    -- renamed from complaint in 004
  deleted_at TIMESTAMPTZ,
  observation TEXT,
  exhibit_refs TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  -- FK columns (added in 001d, renamed in 004)
  inspection_id BIGINT REFERENCES inspections(inspection_id) ON DELETE CASCADE
);
