-- atlas:import ../types/enum_inspection_photos_photo_type.sql
-- atlas:import inspections.sql

CREATE TABLE inspection_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_url TEXT,
  photo_type inspection_photos_photo_type_enum,
  caption TEXT,
  violation_label TEXT,
  complaint_id TEXT,
  legacy_inspector_ref TEXT,      -- renamed from inspector in 004
  uploaded_at TIMESTAMPTZ,
  exhibits TEXT,
  legacy_complaint_ref TEXT,      -- renamed from complaint in 004
  legacy_inspection_ref TEXT,     -- renamed from inspection in 004
  hearing_packets TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  -- FK columns (added in 001d, renamed in 004)
  inspection_id BIGINT REFERENCES inspections(inspection_id) ON DELETE CASCADE
);
