-- atlas:import ../types/enum_exhibits_exhibit_type.sql
-- atlas:import ../types/enum_exhibits_category.sql
-- atlas:import complaints.sql
-- atlas:import inspections.sql

CREATE TABLE exhibits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exhibit_label TEXT,
  exhibit_type exhibits_exhibit_type_enum,
  description TEXT,
  sort_order NUMERIC,
  legacy_complaint_ref TEXT,          -- renamed from complaint in 004
  legacy_inspection_ref TEXT,         -- renamed from source_inspection in 004
  source_photo TEXT,
  file JSONB,
  caption TEXT,
  category exhibits_category_enum,
  deleted_at TIMESTAMPTZ,
  exhibit_date DATE,
  page_count NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  -- FK columns (added in 001d, renamed in 004)
  complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
  source_inspection_id BIGINT REFERENCES inspections(inspection_id) ON DELETE SET NULL
);
