# Plan: Fix Inspection Report Save Failure

## TL;DR

> **Bug**: Inspection reports don't save when Submit is clicked.
> **Root Cause**: Data mismatch between form submission and database schema — wrong field names, missing column mappings, and extra fields that don't exist.
> **Fix**: Remap `summary` → `notes`, remove non-existent columns, fix `location_id` mapping, and strip `isDraft` before upsert.
> **Deliverable**: Inspection form submits and saves successfully to the `inspections` table.

---

## Context

### Problem Description

When a user clicks "Submit" on the Inspection Form page (`InspectionFormPage.tsx`), the inspection report is not saved. The form validation passes but the Supabase upsert fails silently (or the error is not shown to the user).

### Root Cause Analysis (from schema inspection)

The `inspectionService.save()` function passes `inspectionData` directly to a Supabase upsert without transforming field names to match the schema. The schema has:

| Schema Column     | Type | Form Field (current)              | Issue                                                                                 |
| ----------------- | ---- | --------------------------------- | ------------------------------------------------------------------------------------- |
| `notes`           | text | `summary`                         | **Wrong name** — should map `summary` → `notes`                                       |
| (none)            | —    | `global_observations`             | **Column doesn't exist** — should be removed or stored in `notes`                     |
| (none)            | —    | `areas_inspected`                 | **Column doesn't exist** — should be removed                                          |
| `location_id`     | text | `location_id: complaint.location` | **Wrong value** — `selectedComplaint.location` doesn't exist; should use `locationid` |
| `complaint_id`    | text | `complaint_id`                    | OK (matches)                                                                          |
| `status`          | enum | `status: "Submitted"`             | OK (matches enum values)                                                              |
| `inspection_type` | enum | `inspection_type`                 | OK (matches enum values)                                                              |
| `isDraft`         | —    | `isDraft`                         | **Not a column** — must be stripped before upsert                                     |

### Additional Issues in Violations Save

The violations upsert sends fields that don't match the violations table schema:

| Violations Table Column | Currently Sent           | Issue          |
| ----------------------- | ------------------------ | -------------- |
| `violation_label`       | `violation_label`        | OK             |
| `inspection`            | `inspection` (string ID) | OK             |
| `location_in_property`  | `location_in_property`   | OK             |
| `corrective_action`     | `corrective_action`      | OK             |
| `responsible_party`     | `responsible_party`      | OK             |
| `due_date`              | `due_date`               | OK (date type) |
| `status`                | `status`                 | OK (enum)      |

---

## Work Objectives

### Core Objective

Fix the inspection save flow so that clicking Submit successfully persists the inspection record to the database.

### Concrete Deliverables

- `InspectionFormPage.tsx`: Fix `location_id` mapping to use `selectedComplaint.locationid`
- `inspectionService.ts`: Map `summary` → `notes`, strip `isDraft`/`global_observations`/`areas_inspected` before upsert
- Verified by running the app and submitting an inspection

### Definition of Done

- [ ] Submit inspection form → record appears in `inspections` table
- [ ] Violations are correctly saved and linked to the inspection
- [ ] No console errors on submit

---

## Verification Strategy

### Test Scenarios (Manual QA)

1. Navigate to Inspection Form with a complaint selected
2. Fill in inspection details (type, date, areas)
3. Add a violation
4. Click Submit
5. Verify: toast "Inspection saved successfully" appears
6. Verify: inspection record exists in database with correct `notes`, `status` = "Submitted"
7. Verify: violations are linked to the inspection

---

## Execution Strategy

```
Wave 1 (immediate — single task, bug fix):
├── T1: Fix InspectionFormPage.tsx — location_id mapping
├── T2: Fix inspectionService.ts — field transformations + strip non-columns
└── T3: Manual QA — submit inspection form and verify save

Critical Path: T1 → T2 → T3
Parallel Execution: NO (sequential bug fix)
Max Concurrent: 1
```

---

## TODOs

- [ ] 1. **Fix `location_id` mapping in `InspectionFormPage.tsx`** — `quick`

  **What to do**:
  - Find line ~508 in `src/pages/InspectionFormPage.tsx`
  - Change `location_id: (selectedComplaint as any).location` to `location_id: selectedComplaint.locationid`
  - This fixes the value being passed (using correct `locationid` field from complaint)

  **Must NOT do**:
  - Don't change any other field mappings in this file

  **Recommended Agent Profile**:

  > **Category**: `quick` — Single field fix, no complexity
  > **Skills**: None required

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (with T2)
  - **Blocks**: T3 (must fix before testing)
  - **Blocked By**: None (can start immediately)

  **References**:
  - `src/pages/InspectionFormPage.tsx:508` — Current buggy `location_id` mapping
  - `src/types/complaint.ts:21` — `locationid?: string` field on ComplaintSummary type

  **Acceptance Criteria**:
  - [ ] Edit applied: `location_id: (selectedComplaint as any).location` → `location_id: selectedComplaint.locationid`
  - [ ] File saves without TypeScript errors

  **QA Scenarios**:

  \`\`\`
  Scenario: Form submit with correct location_id
  Tool: Browser (dev server at localhost:5173)
  Preconditions: User is logged in, has assigned complaints
  Steps: 1. Navigate to /inspections/new 2. Select a complaint (has locationid set) 3. Fill in inspection type = "Routine", date = today 4. Click Submit 5. Open browser console (F12)
  Expected Result: No "Failed to save" error in console, toast shows success
  Failure Indicators: "Failed to save. Please try again." toast, or Supabase error in console
  Evidence: .sisyphus/evidence/inspection-save-locationid-fix.png (screenshot of success toast)
  \`\`\`

  **Commit**: YES
  - Message: `fix(inspection): correct location_id mapping to use locationid field`
  - Files: `src/pages/InspectionFormPage.tsx`
  - Pre-commit: `npm run lint -- src/pages/InspectionFormPage.tsx`

---

- [ ] 2. **Fix field transformations in `inspectionService.ts`** — `quick`

  **What to do**:
  - In `save()` function, transform `inspectionData` before upserting:
    - Map `summary` → `notes`
    - Map `global_observations` and `areas_inspected` into `notes` as JSON string (or remove if not needed)
    - Remove `isDraft` and `inspector` (already correct) from the object
    - Ensure `complaint_id` and `location_id` are passed as plain strings
  - Code should look like:
    ```ts
    const { isDraft, summary, global_observations, areas_inspected, violations, photos, ...rest } = inspection;
    const inspectionData = {
      ...rest,
      notes: summary,  // map summary to notes column
      // optionally: violations: JSON.stringify({ global_observations, areas_inspected })
    };
    // Remove any undefined values
    };
    ```

  **Must NOT do**:
  - Don't change the violation upsert logic (it's working correctly)
  - Don't change the photos upsert logic
  - Don't change method signature

  **Recommended Agent Profile**:

  > **Category**: `quick` — Simple data transformation fix
  > **Skills**: None required

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (with T1)
  - **Blocks**: T3
  - **Blocked By**: None

  **References**:
  - `src/services/inspectionService.ts:68-81` — Current save function with upsert
  - Supabase schema: `inspections` table has `notes text` but no `summary` column

  **Acceptance Criteria**:
  - [ ] `summary` field is renamed to `notes` before upsert
  - [ ] `isDraft` is stripped from the upsert data
  - [ ] `global_observations` and `areas_inspected` are handled (removed or incorporated into `notes`)
  - [ ] No extra columns that don't exist in schema are passed to upsert
  - [ ] `npm run lint` passes

  **QA Scenarios**:

  \`\`\`
  Scenario: Submit inspection with summary text
  Tool: Browser + Network tab
  Preconditions: Dev server running, logged in
  Steps: 1. Navigate to /inspections/new 2. Select complaint with address "123 Main St" 3. Fill inspection type = "Routine", date = today 4. Add text to Summary field: "Property showed signs of pest activity" 5. Click Submit 6. Open Network tab, filter for "inspections" supabase request 7. Check request payload
  Expected Result: Payload contains "notes": "Property showed signs of pest activity" (not "summary")
  Failure Indicators: Payload still shows "summary" field, or upsert returns error
  Evidence: .sisyphus/evidence/inspection-save-notes-field.png (network request screenshot)

  Scenario: Submit inspection — no violations
  Tool: Browser
  Preconditions: Clean form
  Steps: 1. Navigate to /inspections/new 2. Select complaint 3. Fill inspection type = "Routine", date = today 4. Do NOT add any violations 5. Click Submit
  Expected Result: Success toast, inspection saved with status = "Submitted"
  Failure Indicators: Error toast, or inspection not found in database
  Evidence: .sisyphus/evidence/inspection-save-no-violations.png
  \`\`\`

  **Commit**: YES
  - Message: `fix(inspection): map summary to notes column, strip non-schema fields before upsert`
  - Files: `src/services/inspectionService.ts`
  - Pre-commit: `npm run lint -- src/services/inspectionService.ts && npm run test -- src/services/__tests__/inspectionService.test.ts` (if exists)

---

- [ ] 3. **Manual QA — verify inspection saves on submit** — `unspecified-high`

  **What to do**:
  - Start dev server: `npm run dev`
  - Open browser to http://localhost:5173
  - Log in as inspector
  - Navigate to Inspection Form
  - Select a complaint
  - Fill in all required fields (inspection type, date)
  - Add at least one violation
  - Click Submit
  - Verify toast appears: "Inspection saved successfully"
  - Check Supabase directly: `SELECT * FROM inspections WHERE complaint_id = 'selected-complaint-id' ORDER BY created_at DESC LIMIT 1`
  - Verify the record has correct `notes`, `status` = "Submitted", `inspection_type` = selected type

  **Must NOT do**:
  - Don't proceed to hearing packet creation — this is a standalone QA task

  **Recommended Agent Profile**:

  > **Category**: `unspecified-high` — Hands-on verification with browser + database
  > **Skills**: `webapp-testing` (Playwright for browser verification)

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (final task)
  - **Blocks**: None (final verification)
  - **Blocked By**: T1, T2

  **References**:
  - `src/pages/InspectionFormPage.tsx:1024-1036` — Submit button handler
  - Supabase MCP: `supabase_execute_sql` for direct DB verification

  **Acceptance Criteria**:
  - [ ] Submit button click triggers saveMutation
  - [ ] Toast "Inspection saved successfully" appears
  - [ ] Record exists in `inspections` table with correct data
  - [ ] Violations are linked via `inspection_id`

  **QA Scenarios**:

  \`\`\`
  Scenario: Full inspection submit flow
  Tool: Browser (Playwright) + Supabase
  Preconditions: Dev server running, test inspector logged in, test complaint exists with locationid
  Steps: 1. Navigate to http://localhost:5173/inspections/new 2. Wait for AssignedComplaintsPanel to load 3. Click on first complaint in the list 4. Wait for form to load with complaint address 5. Select inspection type: "Routine" from dropdown 6. Verify date is set to today 7. Click "+ Rodents" quick-pick violation chip 8. Verify violation appears in violations list 9. Click "Submit" button (not "Save Draft") 10. Wait for toast: "Inspection saved successfully" 11. Open Supabase MCP and run: SELECT inspection_id, notes, status, inspection_type FROM inspections ORDER BY created_at DESC LIMIT 1
  Expected Result: New record exists with status = 'Submitted', inspection_type = 'Routine', notes is non-empty string
  Failure Indicators: No record found, or status is still 'Draft', or notes is null/empty
  Evidence: - .sisyphus/evidence/inspection-full-submit-toast.png (screenshot of success toast) - .sisyphus/evidence/inspection-full-submit-db-query.json (SQL query result)

  Scenario: Draft save still works
  Tool: Browser
  Preconditions: Same as above
  Steps: 1. Navigate to /inspections/new 2. Select complaint 3. Fill inspection type = "Routine", date = today 4. Click "Save Draft" instead of Submit 5. Verify toast: "Draft saved." 6. Navigate away and back 7. Verify form state is restored (draft reloaded)
  Expected Result: Draft saves successfully and reloads on page revisit
  Failure Indicators: Draft not saved, or draft not restored
  Evidence: .sisyphus/evidence/inspection-draft-save.png
  \`\`\`

  **Commit**: NO (QA only)

---

## Final Verification Wave

> 1 review agent runs after all implementation tasks complete.

- [ ] F1. **Plan Compliance Audit** — `oracle`
      Read the plan end-to-end. For each "Must Have": verify implementation exists. For each "Must NOT Have": search codebase for forbidden patterns. Check evidence files exist in .sisyphus/evidence/.
      Output: `Must Have [2/2] | Tasks [3/3] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
      Run `npm run lint` and `npm run build`. Review changed files for: `as any` abuse, empty catches, console.log in prod, commented-out code.
      Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | VERDICT`

---

## Commit Strategy

- **T1**: `fix(inspection): correct location_id mapping to use locationid field` — src/pages/InspectionFormPage.tsx
- **T2**: `fix(inspection): map summary to notes column, strip non-schema fields before upsert` — src/services/inspectionService.ts

---

## Success Criteria

### Verification Commands

```bash
npm run lint -- src/pages/InspectionFormPage.tsx src/services/inspectionService.ts  # Expected: 0 errors
npm run build  # Expected: PASS
```

### Final Checklist

- [ ] T1: `location_id: selectedComplaint.locationid` fix applied
- [ ] T2: `summary` → `notes` mapping in save function
- [ ] T2: `isDraft`, `global_observations`, `areas_inspected` stripped before upsert
- [ ] All lint and build checks pass
- [ ] Manual QA confirms inspection saves on submit
