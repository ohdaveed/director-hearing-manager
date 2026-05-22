# Database Standardization Plan

## Background & Motivation

The current database schema contains a mix of legacy text-based identifiers (e.g., `complaintid`, `locationid`), legacy descriptive text fields (`complaint`, `location`, `inspection`), and newer UUID/BIGINT foreign key columns with inconsistent suffixes (`_uuid`, `_id_fk`). To align with Postgres and Supabase best practices (Approach A), we are standardizing all foreign key columns to the `_id` suffix, migrating legacy data to `legacy_*` columns to prevent PostgREST relation name collisions, and applying necessary indexing.

## Scope & Impact

This is a cross-cutting change affecting the database schema, PostgREST queries, and frontend UI components.

- **Affected Tables:** `complaints`, `locations`, `inspections`, `violations`, `chronology`, `exhibits`, `service_log`, `hearing_packets`, `imported_reports`, `inspection_photos`.
- **Affected Frontend Areas:** Data services (`src/services/*`), Hooks (`src/hooks/*`), and UI Components referencing legacy IDs.

## Proposed Solution

We will follow **Approach A: Standard `_id` suffix**.

### Phase 1: Database Migration

Create a new migration (`004_standardize_fks.sql`) with the following steps:

1. **Rename Descriptive Text Fields (Collision Prevention):**
   Rename columns like `complaint`, `location`, and `inspection` (which store legacy string labels) to `legacy_complaint_ref`, `legacy_location_ref`, and `legacy_inspection_ref`.
2. **Rename Legacy Text Identifiers:**
   Rename `complaintid`, `locationid`, `location_id` (in locations), and `complaint_id` (in inspections) to `legacy_complaint_id`, `legacy_location_id`, etc.
3. **Rename UUID/BIGINT Foreign Keys:**
   Rename all `*_uuid` and `*_id_fk` columns to their standard `_id` equivalents (e.g., `complaint_uuid` -> `complaint_id`, `inspection_id_fk` -> `inspection_id`).
   _Note: `inspections.inspection_id` will be kept as-is since it is the primary key and matches the `inspection_id` FK naming convention in other tables._
4. **Create Indexes:**
   Following the Supabase `schema-foreign-key-indexes` best practice, add a `CREATE INDEX` for every new `_id` foreign key column to optimize JOINs and CASCADE deletions.

### Phase 2: Codebase Updates

1. **TypeScript Definitions:**
   Update `types/database.ts` to reflect the new schema.
2. **PostgREST Queries:**
   Update all `select()` queries in `src/services/` and `src/hooks/` to use the new relation names (e.g., replacing `complaints!complaint_uuid(...)` with `complaints!complaint_id(...)`).
3. **UI Components:**
   Search the codebase for usages of `complaintid`, `locationid`, etc., and replace them with `legacy_complaint_id` and `legacy_location_id` to ensure visual parity and correct data rendering.

## Alternatives Considered

- **Approach B (Explicit Type Suffixes):** Keeping `_uuid` and `_id_fk`. Rejected because it's non-standard, visually noisy, and counter to PostgREST relationship naming defaults.
- **Approach C (`_ref` suffix):** Using `_ref`. Cleaner than B, but still non-standard compared to `_id`.

## Verification & Testing

1. Successfully run the migration locally using Supabase CLI.
2. Verify that there are no TypeScript compiler errors.
3. Test key workflows locally: loading complaints, inspections, and hearing packets to ensure JOINs and foreign keys are resolving correctly.

## Migration & Rollback

If the database migration fails or causes unexpected downstream issues, we will rollback using `supabase db reset` (in local dev) and revert the codebase commit.
