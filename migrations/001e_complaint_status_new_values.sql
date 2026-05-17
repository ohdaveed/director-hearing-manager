BEGIN;
ALTER TYPE complaints_status_enum ADD VALUE IF NOT EXISTS 'Withdrawn';
ALTER TYPE complaints_status_enum ADD VALUE IF NOT EXISTS 'Referred to Outside Agency';
COMMIT;

ALTER TYPE complaints_status_enum ADD VALUE IF NOT EXISTS 'Withdrawn';
ALTER TYPE complaints_status_enum ADD VALUE IF NOT EXISTS 'Referred to Outside Agency';

COMMIT;