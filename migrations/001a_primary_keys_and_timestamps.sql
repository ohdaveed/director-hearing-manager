-- =============================================================================
-- Migration 001a: Primary Keys & Timestamps
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Primary Keys ──
ALTER TABLE hearing_packets     ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid();
ALTER TABLE inspection_photos   ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid();
ALTER TABLE violations          ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid();
ALTER TABLE chronology          ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid();
ALTER TABLE owner_documents     ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid();
ALTER TABLE exhibits            ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid();
ALTER TABLE service_log         ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid();
ALTER TABLE users               ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid();
ALTER TABLE locations           ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid();
ALTER TABLE imported_reports    ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid();

-- ── created_at / updated_at ──
ALTER TABLE complaints        ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE complaints        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE inspections       ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE inspections       ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE violations        ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE violations        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE inspection_photos ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE inspection_photos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE chronology        ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE chronology        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE owner_documents   ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE owner_documents   ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE exhibits          ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE exhibits          ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE service_log       ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE service_log       ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE hearing_packets   ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE hearing_packets   ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE locations         ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE locations         ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE imported_reports  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE imported_reports  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE users             ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE users             ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- ── Soft delete columns for tables that lack them ──
ALTER TABLE inspection_photos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE chronology        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE owner_documents   ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE service_log       ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE hearing_packets   ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE users             ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE locations         ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE imported_reports  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ── Auto-update trigger for updated_at ──
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'complaints','inspections','violations','inspection_photos',
      'chronology','owner_documents','exhibits','service_log',
      'hearing_packets','locations','imported_reports','users'
    ])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON %I;', tbl, tbl);
    EXECUTE format(
      'CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      tbl, tbl
    );
  END LOOP;
END;
$$;
