-- =============================================================================
-- Migration 003b: SOP Compliance Rules
-- =============================================================================

CREATE TABLE IF NOT EXISTS compliance_rules (
  id text primary key,
  name text not null,
  description text not null,
  severity text not null check (severity in ('Critical', 'Warning', 'Info')),
  data_field text,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- Seed Initial SOP Rules
INSERT INTO compliance_rules (id, name, description, severity, data_field)
VALUES 
  ('SOP-001', 'Cover Page Structure', 'Cover Page must include the case number in format (#HHP-25-05) and address.', 'Critical', 'case_number'),
  ('SOP-002', 'Enforcement action summary', 'Synopsis page must include responsible parties, case number, purpose of hearing, enforcement codes.', 'Critical', 'proposed_actions'),
  ('SOP-004', 'Case Chronology alignment', 'Chronology must include all responsible parties, program code, case number, hearing date, and aligned with exhibits.', 'Critical', 'chronology_snapshot'),
  ('SOP-005', 'Exhibit Labeling', 'All exhibits must be labeled with letters A, B, C in red on top right corner.', 'Critical', 'selected_report_ids'),
  ('SOP-009', 'Photo Presentation', 'ONE photograph per page with date, time, label, address and description.', 'Warning', 'selected_photo_ids'),
  ('SOP-010', 'Notice Timeline (14 Days)', 'Notice must be served at least 14 days before the hearing.', 'Critical', 'notice_of_hearing_date'),
  ('SOP-012', 'Submission Timeline (5 Days)', 'Final package must be delivered 5 days prior to hearing.', 'Critical', 'generated_at')
ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description,
  severity = EXCLUDED.severity,
  data_field = EXCLUDED.data_field;

-- Enable RLS
ALTER TABLE compliance_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for compliance rules"
  ON compliance_rules FOR SELECT
  USING (true);

CREATE POLICY "Allow admins to manage compliance rules"
  ON compliance_rules FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'Super Admin')));
