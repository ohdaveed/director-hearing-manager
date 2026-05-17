-- =============================================================================
-- Migration 001d: RLS (remaining tables) & Foreign Keys
-- =============================================================================

-- ═════════════════════════════════════════════════════════════════════════════
-- PART A: Remaining RLS Policies
-- ═════════════════════════════════════════════════════════════════════════════

-- ── LOCATIONS ──
CREATE POLICY "Staff can view locations"
  ON locations FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()));

CREATE POLICY "Staff can insert locations"
  ON locations FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()));

CREATE POLICY "Staff can update locations"
  ON locations FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()));

-- ── HEARING PACKETS ──
CREATE POLICY "Staff can view hearing packets"
  ON hearing_packets FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()));

CREATE POLICY "Staff can insert hearing packets"
  ON hearing_packets FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()));

CREATE POLICY "Staff can update hearing packets"
  ON hearing_packets FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()));

-- ── CHRONOLOGY ──
CREATE POLICY "Auth can view chronology"
  ON chronology FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()));

CREATE POLICY "Auth can insert chronology"
  ON chronology FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()));

CREATE POLICY "Auth can update chronology"
  ON chronology FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()));

-- ── EXHIBITS ──
CREATE POLICY "Auth can view exhibits"
  ON exhibits FOR SELECT
  USING (deleted_at IS NULL AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid()));

CREATE POLICY "Auth can insert exhibits"
  ON exhibits FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()));

-- ── INSPECTION PHOTOS ──
CREATE POLICY "Auth can view inspection photos"
  ON inspection_photos FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()));

CREATE POLICY "Auth can insert inspection photos"
  ON inspection_photos FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()));

-- ── OWNER DOCUMENTS ──
CREATE POLICY "Auth can view owner documents"
  ON owner_documents FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()));

CREATE POLICY "Auth can insert owner documents"
  ON owner_documents FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()));

-- ── SERVICE LOG ──
CREATE POLICY "Auth can view service log"
  ON service_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()));

CREATE POLICY "Auth can insert service log"
  ON service_log FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()));

-- ── IMPORTED REPORTS ──
CREATE POLICY "Auth can view imported reports"
  ON imported_reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()));

CREATE POLICY "Auth can insert imported reports"
  ON imported_reports FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()));


-- ═════════════════════════════════════════════════════════════════════════════
-- PART B: Foreign Key Columns
-- ═════════════════════════════════════════════════════════════════════════════

-- Add new UUID FK columns alongside existing text references.
-- (Existing text cols preserved for backward compatibility.)

ALTER TABLE inspections ADD COLUMN IF NOT EXISTS complaint_id UUID
  REFERENCES complaints(id) ON DELETE SET NULL;

ALTER TABLE inspections ADD COLUMN IF NOT EXISTS location_id_uuid UUID
  REFERENCES locations(id) ON DELETE SET NULL;

ALTER TABLE violations ADD COLUMN IF NOT EXISTS inspection_uuid UUID
  REFERENCES inspections(inspection_id) ON DELETE CASCADE;

ALTER TABLE chronology ADD COLUMN IF NOT EXISTS complaint_uuid UUID
  REFERENCES complaints(id) ON DELETE CASCADE;

ALTER TABLE exhibits ADD COLUMN IF NOT EXISTS complaint_uuid UUID
  REFERENCES complaints(id) ON DELETE CASCADE;

ALTER TABLE exhibits ADD COLUMN IF NOT EXISTS source_inspection_uuid UUID
  REFERENCES inspections(inspection_id) ON DELETE SET NULL;

ALTER TABLE service_log ADD COLUMN IF NOT EXISTS complaint_uuid UUID
  REFERENCES complaints(id) ON DELETE CASCADE;

ALTER TABLE owner_documents ADD COLUMN IF NOT EXISTS complaint_uuid UUID
  REFERENCES complaints(id) ON DELETE CASCADE;

ALTER TABLE hearing_packets ADD COLUMN IF NOT EXISTS complaint_uuid UUID
  REFERENCES complaints(id) ON DELETE CASCADE;

ALTER TABLE imported_reports ADD COLUMN IF NOT EXISTS location_uuid UUID
  REFERENCES locations(id) ON DELETE SET NULL;

ALTER TABLE imported_reports ADD COLUMN IF NOT EXISTS linked_inspection_uuid UUID
  REFERENCES inspections(inspection_id) ON DELETE SET NULL;

ALTER TABLE inspection_photos ADD COLUMN IF NOT EXISTS inspection_uuid UUID
  REFERENCES inspections(inspection_id) ON DELETE CASCADE;
