-- Created by migration 003b: SOP Compliance Rules

CREATE TABLE compliance_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('Critical', 'Warning', 'Info')),
  data_field TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE compliance_rules IS 'SOP compliance rules for hearing packet validation';
