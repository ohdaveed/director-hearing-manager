-- All complaint status values including those added by migrations 001e
CREATE TYPE complaints_status_enum AS ENUM (
  'New',
  'Contact Pending',
  'Inspection Scheduled',
  'NOV Issued',
  'Re-Inspection Due',
  'Non-Compliant',
  'Escalated',
  'Monitoring',
  'Closed — Compliant',
  'Closed — No Violation',
  'Closed — Unfounded',
  'Open',
  'Withdrawn',
  'Referred to Outside Agency'
);
