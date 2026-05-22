# Database Standardization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize foreign key naming conventions to `_id`, migrate legacy text IDs to `legacy_*` columns, and add missing foreign key constraints and indexes per Supabase best practices.

**Architecture:** Use a single database migration to rename columns and add constraints/indexes. Follow with a systematic update of the service layer and frontend components to use new column names.

**Tech Stack:** PostgreSQL, Supabase, TypeScript, React.

---

### Task 1: Database Migration - Standardization

**Files:**

- Create: `migrations/004_standardize_fks.sql`
- Modify: `schema.sql` (to reflect final state)

- [ ] **Step 1: Create the migration file**

Create `migrations/004_standardize_fks.sql` with the following SQL:

```sql
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
```

- [ ] **Step 2: Apply migration to local database**

Run: `supabase db query "$(cat migrations/004_standardize_fks.sql)"`
Expected: Success.

- [ ] **Step 3: Update schema.sql to match current state**

Update `schema.sql` by manually applying the renames to the `CREATE TABLE` statements.

- [ ] **Step 4: Commit**

```bash
git add migrations/004_standardize_fks.sql schema.sql
git commit -m "db: standardize foreign key naming to _id and add indexes"
```

### Task 2: Update TypeScript Types

**Files:**

- Modify: `src/types/database.ts`

- [ ] **Step 1: Regenerate Types (or manually update)**

If Supabase CLI is connected, run: `supabase gen types typescript --local > src/types/database.ts`
Otherwise, manually update the `Database` interface in `src/types/database.ts` to reflect the renames from Task 1.

- [ ] **Step 2: Commit**

```bash
git add src/types/database.ts
git commit -m "types: update database types for standardized schema"
```

### Task 3: Update Service Layer (PostgREST Queries)

**Files:**

- Modify: `src/services/complaintService.ts`
- Modify: `src/services/inspectionService.ts`
- Modify: `src/services/packetService.ts`
- Modify: `src/services/importService.ts`
- Modify: `src/services/locationService.ts`

- [ ] **Step 1: Update complaintService.ts**

Update `select` strings. Replace `!complaint_uuid` with `!complaint_id`.

- [ ] **Step 2: Update inspectionService.ts**

Update `save` and `get` methods to use `complaint_id` and `location_id`.

- [ ] **Step 3: Update packetService.ts**

Update relations and query strings.

- [ ] **Step 4: Update importService.ts**

Update mapping logic for imported reports.

- [ ] **Step 5: Run Type Check**

Run: `npx tsc --noEmit`
Expected: Zero errors in `src/services/`.

- [ ] **Step 6: Commit**

```bash
git add src/services/
git commit -m "feat: update service layer to use standardized foreign keys"
```

### Task 4: Update Frontend UI Components

**Files:**

- Modify: `src/components/ComplaintListItem.tsx`
- Modify: `src/components/ComplaintDetailView.tsx`
- Modify: `src/components/LocationOwnerPanel.tsx`
- Modify: `src/components/AssignedComplaintsPanel.tsx`
- (and others identified in audit)

- [ ] **Step 1: Replace legacy ID field names**

Global find and replace `complaintid` -> `legacy_complaint_id` and `locationid` -> `legacy_location_id` and `location_id` (when referring to the text field) -> `legacy_location_id`.

- [ ] **Step 2: Verify component rendering**

Manually check `ComplaintListItem` and `LocationOwnerPanel` to ensure labels and IDs still display correctly.

- [ ] **Step 3: Run Type Check**

Run: `npx tsc --noEmit`
Expected: Zero errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/ src/pages/
git commit -m "ui: update components to use legacy_* names for text IDs"
```

### Task 5: Verification

- [ ] **Step 1: Final verification of core workflows**

Open the app, load a complaint list, view a complaint, view a location. Ensure all relationships (JOINs) are loading correctly.

- [ ] **Step 2: Final Commit**

```bash
git commit --allow-empty -m "final: database standardization verified"
```
