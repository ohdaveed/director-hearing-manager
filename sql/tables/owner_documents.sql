-- atlas:import ../types/enum_owner_documents_category.sql
-- atlas:import complaints.sql

CREATE TABLE owner_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT,
  submission_date DATE,
  notes TEXT,
  received_by TEXT,
  legacy_complaint_ref TEXT,         -- renamed from complaint in 004
  category owner_documents_category_enum,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  -- FK column (added in 001d, renamed in 004)
  complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE
);
