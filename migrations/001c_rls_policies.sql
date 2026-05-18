-- =============================================================================
-- Migration 001c: Row-Level Security — Enable & Drop Existing
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE complaints       ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections      ENABLE ROW LEVEL SECURITY;
ALTER TABLE violations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE chronology       ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_documents  ENABLE ROW LEVEL SECURITY;
ALTER TABLE exhibits         ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_log      ENABLE ROW LEVEL SECURITY;
ALTER TABLE hearing_packets  ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE imported_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for idempotency
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', pol.policyname, pol.tablename);
  END LOOP;
END;
$$;

-- Helper function: safe role check (SECURITY DEFINER avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role::text FROM public.users WHERE id = auth.uid();
$$;

-- ── USERS ──
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can manage all users"
  ON users FOR ALL
  USING (
    public.get_current_user_role() IN ('Admin', 'Super Admin')
  );

-- ── COMPLAINTS ──
CREATE POLICY "Inspectors can view assigned complaints"
  ON complaints FOR SELECT
  USING (
    (assigned_to = (SELECT email FROM users WHERE id = auth.uid())
     OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'Super Admin', 'Program Manager')))
    AND deleted_at IS NULL
  );

CREATE POLICY "Staff can insert complaints"
  ON complaints FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()));

CREATE POLICY "Assigned staff can update complaints"
  ON complaints FOR UPDATE
  USING (
    assigned_to = (SELECT email FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'Super Admin', 'Program Manager'))
  );

-- ── INSPECTIONS ──
CREATE POLICY "Staff can view inspections"
  ON inspections FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Inspectors can create inspections"
  ON inspections FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()));

CREATE POLICY "Inspectors can update own inspections"
  ON inspections FOR UPDATE
  USING (
    inspector = (SELECT email FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'Super Admin'))
  );

-- ── VIOLATIONS ──
CREATE POLICY "Staff can view violations"
  ON violations FOR SELECT
  USING (deleted_at IS NULL AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid()));

CREATE POLICY "Staff can insert violations"
  ON violations FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()));

CREATE POLICY "Staff can update violations"
  ON violations FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()));
