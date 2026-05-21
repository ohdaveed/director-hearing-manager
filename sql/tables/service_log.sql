-- atlas:import ../types/enum_service_log_service_method.sql
-- atlas:import ../types/enum_service_log_status.sql
-- atlas:import complaints.sql

CREATE TABLE service_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_type TEXT,
  service_method service_log_service_method_enum,
  service_date DATE,
  recipient TEXT,
  tracking_number TEXT,
  proof_of_service BOOLEAN,
  notes TEXT,
  status service_log_status_enum,
  legacy_complaint_ref TEXT,        -- renamed from complaint in 004
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  -- FK column (added in 001d, renamed in 004)
  complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE
);
