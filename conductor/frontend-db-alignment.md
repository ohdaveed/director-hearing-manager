# Frontend and Database Alignment Plan (Revised)

## Objective

Ensure all frontend UI components (forms, detail views, tables) correctly map to and persist all relevant database columns defined in the Supabase schema. Fix critical data-loss bugs in the service layer, establish a robust TypeScript type system, and achieve 1:1 parity between the UI and the database.

## Key Files & Context

- `schema.sql`: Source of truth for database structure.
- `src/pages/ComplaintEntryPage.tsx`: Complaint creation form.
- `src/pages/InspectionFormPage.tsx`: Inspection recording form.
- `src/pages/AllLocationsPage.tsx`: Location directory and creation form.
- `src/components/LocationOwnerPanel.tsx`: Location detail edit panel.
- `src/services/`: Data mapping layer.
- `src/types/`: Central type definitions.
- `src/schemas/`: Zod validation schemas.

## Findings & Audit

### 1. Missing Database Columns

The following fields are used in the UI but are missing from the `inspections` table in `schema.sql`:

- `global_observations`: `text[]`
- `areas_inspected`: `text[]`

### 2. Service Layer "Sink-Hole" Bugs

- `inspectionService.ts`: Explicitly drops `global_observations` and `areas_inspected` during destructuring. Also does not derive/persist `violation_count` or `facility_address`.
- `locationService.ts`: Service layer is a pass-through; the gap is in `AllLocationsPage.tsx` and `LocationOwnerPanel.tsx` which do not send full payloads.
- `complaintService.ts`: Service layer is a pass-through; the gap is purely in `ComplaintEntryPage.tsx` which does not render or submit hearing fields.

### 3. UI Gaps (Columns Exist but are Unreachable)

- **Complaints:** Missing "Hearing Information" inputs (`hearing_rp_name`, `hearing_rp_phone`, `hearing_rp_email`, `hearing_rp_address`, `purpose_of_hearing`, `notice_of_hearing_date`, `hearing_order_date`). Metadata fields like `thread_parent`, `reinspection_due_on_after`, and `attachments` are also absent but are lower priority (relational/auto-populated).
- **Inspections:** Missing inputs for `access_granted_by` (enum), `contact_phone`, `contact_email`, `dba`, and `facility_address` (should auto-populate from complaint/location address).
- **Locations:** Property metadata (`dba`, `management_name`, `responsible_party`, `responsible_party_phone`, `responsible_party_email`, `building_features`) is visible in `LocationPage.tsx` but not editable in `LocationOwnerPanel.tsx` or creatable in `AllLocationsPage.tsx`.

### 4. Type System Gap

The project relies heavily on `any`, hiding potential mismatches and breaking changes. `ComplaintSummary` is a partial interface that does not reflect the full schema. Found:

- `type Location = any["locations"][0]` in `ComplaintEntryPage.tsx`
- `type ComplaintDetail = any` in `InspectionFormPage.tsx`
- `type Location = any` in `AllLocationsPage.tsx`
- `type Complaint = any["complaints"][0]` in `ComplaintSummaryCards.tsx`

## Implementation Phases

### Phase 1: Database Migration

- Create `migrations/003a_extend_inspections_schema.sql` to add `global_observations text[]` and `areas_inspected text[]` to the `inspections` table.
- Update `schema.sql` to reflect these changes.

### Phase 2: Type System Overhaul

- **Option A (preferred):** Run `npx supabase gen types typescript` against the live project to generate a complete `src/types/database.ts`.
- **Option B (fallback):** Manually create `src/types/database.ts` with strict interfaces for every table in `schema.sql`.
- Replace `any` usage in files touched by this plan with the generated/strict types. Existing `any` outside the scope may be cleaned up opportunistically.

### Phase 3: Service Layer Refinement

- Fix `inspectionService.save()` to stop dropping `global_observations` and `areas_inspected`. Derive and persist `violation_count` from the violations array.
- Preserve the existing `summary` → `notes` mapping; the new array fields are additive.
- Auto-populate `facility_address` from the associated complaint or location address before upsert.
- No changes needed to `locationService` or `complaintService` (both are pass-through layers).

### Phase 4: Complaint Form Expansion

- Add a collapsible "Hearing Information" section to `ComplaintEntryPage.tsx` with inputs for `hearing_rp_name`, `hearing_rp_phone`, `hearing_rp_email`, `hearing_rp_address`, `purpose_of_hearing`, `notice_of_hearing_date`, and `hearing_order_date`.
- Wire these fields into the existing `onSubmit` payload (the `complaintService.create` call already spreads the full object).

### Phase 5: Inspection Form Expansion

- Add inputs for `access_granted_by` (enum dropdown), `contact_phone`, `contact_email`, and `dba`.
- Wire `global_observations` and `areas_inspected` to the new DB columns now that the sink-hole bug is fixed.
- Derive `facility_address` automatically from `selectedComplaint.address`.

### Phase 6: Location Management UI

- Update `AllLocationsPage.tsx` create form to include `owner_address`, `number_of_rooms`, `healthy_housing`, `census_tract`, `block_lot`, `dba`, `management_name`, `responsible_party`, `responsible_party_phone`, `responsible_party_email`, and `building_features`.
- Update `LocationOwnerPanel.tsx` edit form to expose the same missing fields.

### Phase 7: Validation Schema Alignment

- Expand `src/schemas/complaintSchema.ts` to include hearing fields.
- Create `src/schemas/inspectionSchema.ts` covering all inspection fields (including the new enum values).
- Create `src/schemas/locationSchema.ts` covering all location fields.

### Phase 8: Test Coverage

- Update `src/pages/__tests__/AllLocationsPage.test.tsx` to assert new create-form fields are rendered and submitted.
- Create tests for `LocationOwnerPanel` edit flow (if not already covered).
- Create tests for `InspectionFormPage` persistence of `global_observations` and `areas_inspected`.

## Verification & Testing

- **TypeScript:** `npm run build` must pass with zero _new_ `any` regressions in files modified by this plan.
- **Unit Tests:** All existing tests pass; new tests for expanded forms pass.
- **Persistence:** End-to-end test of a full record creation for Complaint, Inspection, and Location, verifying all fields appear in the Supabase dashboard.
- **Audit:** Manually verify in Supabase dashboard that `global_observations` and `areas_inspected` are populated on inspection save.

## Risk Assessment

- **Severity (High):** Data is currently being lost in production due to the service-layer "sink-hole" bugs (`global_observations` and `areas_inspected` are dropped on every inspection save).
- **Complexity (Medium):** Refactoring to strict types will touch many files but provides the necessary safety for the UI expansion.
- **UX Impact (Low):** Adding collapsible sections and optional fields will not break existing workflows.
