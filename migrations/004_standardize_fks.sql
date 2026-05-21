-- 1. Rename Descriptive Text Fields (Collision Prevention)
ALTER TABLE chronology RENAME COLUMN complaint TO legacy_complaint_ref;
ALTER TABLE chronology RENAME COLUMN related_inspection TO legacy_inspection_ref;
ALTER TABLE exhibits RENAME COLUMN complaint TO legacy_complaint_ref;
ALTER TABLE exhibits RENAME COLUMN source_inspection TO legacy_inspection_ref;
ALTER TABLE inspection_photos RENAME COLUMN complaint TO legacy_complaint_ref;
ALTER TABLE inspection_photos RENAME COLUMN inspection TO legacy_inspection_ref;
ALTER TABLE inspection_photos RENAME COLUMN inspector TO legacy_inspector_ref;
ALTER TABLE inspections RENAME COLUMN complaint TO legacy_complaint_ref;
ALTER TABLE inspections RENAME COLUMN location TO legacy_location_ref;
ALTER TABLE owner_documents RENAME COLUMN complaint TO legacy_complaint_ref;
ALTER TABLE service_log RENAME COLUMN complaint TO legacy_complaint_ref;
ALTER TABLE violations RENAME COLUMN complaint TO legacy_complaint_ref;
ALTER TABLE violations RENAME COLUMN inspection TO legacy_inspection_ref;
ALTER TABLE hearing_packets RENAME COLUMN complaint TO legacy_complaint_ref;
ALTER TABLE imported_reports RENAME COLUMN location TO legacy_location_ref;
ALTER TABLE imported_reports RENAME COLUMN linked_inspection TO legacy_inspection_ref;

-- 2. Rename Legacy Text Identifiers
ALTER TABLE complaints RENAME COLUMN complaintid TO legacy_complaint_id;
ALTER TABLE complaints RENAME COLUMN locationid TO legacy_location_id;
ALTER TABLE locations RENAME COLUMN location_id TO legacy_location_id;
ALTER TABLE inspections RENAME COLUMN complaint_id TO legacy_complaint_id;
ALTER TABLE inspections RENAME COLUMN location_id TO legacy_location_id;

-- 3. Rename UUID/BIGINT Foreign Keys to Standard _id
-- inspections
ALTER TABLE inspections RENAME COLUMN complaint_uuid TO complaint_id;
ALTER TABLE inspections RENAME COLUMN location_uuid TO location_id;
-- violations
ALTER TABLE violations RENAME COLUMN inspection_id_fk TO inspection_id;
-- chronology
ALTER TABLE chronology RENAME COLUMN complaint_uuid TO complaint_id;
-- exhibits
ALTER TABLE exhibits RENAME COLUMN complaint_uuid TO complaint_id;
ALTER TABLE exhibits RENAME COLUMN source_inspection_id_fk TO source_inspection_id;
-- service_log
ALTER TABLE service_log RENAME COLUMN complaint_uuid TO complaint_id;
-- owner_documents
ALTER TABLE owner_documents RENAME COLUMN complaint_uuid TO complaint_id;
-- hearing_packets
ALTER TABLE hearing_packets RENAME COLUMN complaint_uuid TO complaint_id;
-- imported_reports
ALTER TABLE imported_reports RENAME COLUMN location_uuid TO location_id;
ALTER TABLE imported_reports RENAME COLUMN linked_inspection_id_fk TO linked_inspection_id;
-- inspection_photos
ALTER TABLE inspection_photos RENAME COLUMN inspection_id_fk TO inspection_id;

-- 4. Add Missing FK Indexes (Supabase Best Practice)
CREATE INDEX IF NOT EXISTS idx_inspections_complaint_id ON inspections(complaint_id);
CREATE INDEX IF NOT EXISTS idx_inspections_location_id ON inspections(location_id);
CREATE INDEX IF NOT EXISTS idx_violations_inspection_id ON violations(inspection_id);
CREATE INDEX IF NOT EXISTS idx_chronology_complaint_id ON chronology(complaint_id);
CREATE INDEX IF NOT EXISTS idx_exhibits_complaint_id ON exhibits(complaint_id);
CREATE INDEX IF NOT EXISTS idx_exhibits_source_inspection_id ON exhibits(source_inspection_id);
CREATE INDEX IF NOT EXISTS idx_service_log_complaint_id ON service_log(complaint_id);
CREATE INDEX IF NOT EXISTS idx_owner_documents_complaint_id ON owner_documents(complaint_id);
CREATE INDEX IF NOT EXISTS idx_hearing_packets_complaint_id ON hearing_packets(complaint_id);
CREATE INDEX IF NOT EXISTS idx_imported_reports_location_id ON imported_reports(location_id);
CREATE INDEX IF NOT EXISTS idx_imported_reports_linked_inspection_id ON imported_reports(linked_inspection_id);
CREATE INDEX IF NOT EXISTS idx_inspection_photos_inspection_id ON inspection_photos(inspection_id);
