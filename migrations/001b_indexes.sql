-- =============================================================================
-- Migration 001b: Indexes (CRITICAL for performance)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── Complaints ──
CREATE INDEX IF NOT EXISTS idx_complaints_assigned_to     ON complaints (assigned_to);
CREATE INDEX IF NOT EXISTS idx_complaints_date_entered    ON complaints (date_entered DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_status          ON complaints (status);
CREATE INDEX IF NOT EXISTS idx_complaints_hearing_status  ON complaints (hearing_status);
CREATE INDEX IF NOT EXISTS idx_complaints_deleted_at      ON complaints (deleted_at);
CREATE INDEX IF NOT EXISTS idx_complaints_locationid      ON complaints (locationid);
CREATE INDEX IF NOT EXISTS idx_complaints_complaintid     ON complaints (complaintid);
-- Composite: filter by assigned_to + order by date_entered (most common query)
CREATE INDEX IF NOT EXISTS idx_complaints_assigned_date
  ON complaints (assigned_to, date_entered DESC);

-- ── Inspections ──
CREATE INDEX IF NOT EXISTS idx_inspections_complaint       ON inspections (complaint);
CREATE INDEX IF NOT EXISTS idx_inspections_complaint_id    ON inspections (complaint_id);
CREATE INDEX IF NOT EXISTS idx_inspections_date            ON inspections (inspection_date DESC);
CREATE INDEX IF NOT EXISTS idx_inspections_status          ON inspections (status);
CREATE INDEX IF NOT EXISTS idx_inspections_inspector       ON inspections (inspector);
CREATE INDEX IF NOT EXISTS idx_inspections_deleted_at      ON inspections (deleted_at);
CREATE INDEX IF NOT EXISTS idx_inspections_location        ON inspections (location);
CREATE INDEX IF NOT EXISTS idx_inspections_location_id     ON inspections (location_id);

-- ── Violations ──
CREATE INDEX IF NOT EXISTS idx_violations_inspection       ON violations (inspection);
CREATE INDEX IF NOT EXISTS idx_violations_inspection_id    ON violations (inspection_id);
CREATE INDEX IF NOT EXISTS idx_violations_status           ON violations (status);
CREATE INDEX IF NOT EXISTS idx_violations_deleted_at       ON violations (deleted_at);
CREATE INDEX IF NOT EXISTS idx_violations_complaint        ON violations (complaint);

-- ── Inspection Photos ──
CREATE INDEX IF NOT EXISTS idx_photos_complaint_id   ON inspection_photos (complaint_id);
CREATE INDEX IF NOT EXISTS idx_photos_inspection_id  ON inspection_photos (inspection_id);
CREATE INDEX IF NOT EXISTS idx_photos_photo_type     ON inspection_photos (photo_type);

-- ── Chronology ──
CREATE INDEX IF NOT EXISTS idx_chronology_complaint     ON chronology (complaint);
CREATE INDEX IF NOT EXISTS idx_chronology_complaint_id  ON chronology (complaint_id);
CREATE INDEX IF NOT EXISTS idx_chronology_order         ON chronology (chronology_order);
CREATE INDEX IF NOT EXISTS idx_chronology_entry_type    ON chronology (entry_type);
CREATE INDEX IF NOT EXISTS idx_chronology_entry_date    ON chronology (entry_date);
CREATE INDEX IF NOT EXISTS idx_chronology_visibility    ON chronology (visibility);

-- ── Hearing Packets ──
CREATE INDEX IF NOT EXISTS idx_packets_status         ON hearing_packets (packet_status);
CREATE INDEX IF NOT EXISTS idx_packets_assigned       ON hearing_packets (assigned_to);
CREATE INDEX IF NOT EXISTS idx_packets_hearing_date   ON hearing_packets (hearing_date);
CREATE INDEX IF NOT EXISTS idx_packets_complaint      ON hearing_packets (complaint);
CREATE INDEX IF NOT EXISTS idx_packets_complaint_id   ON hearing_packets (complaint_id);
CREATE INDEX IF NOT EXISTS idx_packets_type           ON hearing_packets (packet_type);

-- ── Users ──
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role  ON users (role);

-- ── Locations ──
CREATE INDEX IF NOT EXISTS idx_locations_address_trgm   ON locations USING gin (address gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_locations_location_id    ON locations (location_id);
CREATE INDEX IF NOT EXISTS idx_locations_owner_name     ON locations (owner_name);
CREATE INDEX IF NOT EXISTS idx_locations_facility_type  ON locations (facility_type);

-- ── Exhibits ──
CREATE INDEX IF NOT EXISTS idx_exhibits_complaint           ON exhibits (complaint);
CREATE INDEX IF NOT EXISTS idx_exhibits_complaint_id        ON exhibits (complaint_id);
CREATE INDEX IF NOT EXISTS idx_exhibits_source_inspection   ON exhibits (source_inspection);
CREATE INDEX IF NOT EXISTS idx_exhibits_category            ON exhibits (category);
CREATE INDEX IF NOT EXISTS idx_exhibits_deleted_at          ON exhibits (deleted_at);

-- ── Service Log ──
CREATE INDEX IF NOT EXISTS idx_service_log_complaint      ON service_log (complaint);
CREATE INDEX IF NOT EXISTS idx_service_log_complaint_id   ON service_log (complaint_id);
CREATE INDEX IF NOT EXISTS idx_service_log_status         ON service_log (status);

-- ── Owner Documents ──
CREATE INDEX IF NOT EXISTS idx_owner_docs_complaint      ON owner_documents (complaint);
CREATE INDEX IF NOT EXISTS idx_owner_docs_complaint_id   ON owner_documents (complaint_id);
CREATE INDEX IF NOT EXISTS idx_owner_docs_category       ON owner_documents (category);

-- ── Imported Reports ──
CREATE INDEX IF NOT EXISTS idx_imported_reports_parsing_status  ON imported_reports (parsing_status);
CREATE INDEX IF NOT EXISTS idx_imported_reports_location        ON imported_reports (location);
CREATE INDEX IF NOT EXISTS idx_imported_reports_location_id     ON imported_reports (location_id);
CREATE INDEX IF NOT EXISTS idx_imported_reports_linked_inspection ON imported_reports (linked_inspection);
