# Hearing Details Page Refactor

## TL;DR

> **Quick Summary**: Decompose the 1,593-line `HearingPacketsPage.tsx` monolith into focused, typed components with a custom form hook, add performance optimizations, and backfill tests for the extracted units.
>
> **Deliverables**:
>
> - `src/types/packet.ts` — strongly typed Packet domain model
> - `src/hooks/usePacketForm.ts` — custom hook replacing the 8-state `useEffect` sync anti-pattern
> - `src/components/packet/PreparationChecklist.tsx` — extracted checklist component
> - `src/components/packet/NoticeOfHearingPrint.tsx` — extracted print overlay component
> - `src/components/packet/PacketDetail.tsx` — extracted detail/edit view component
> - Refactored `src/pages/HearingPacketsPage.tsx` — lean list view + routing only
> - Tests for all extracted components in `__tests__/` co-located directories
>
> **Estimated Effort**: Large (8–12 tasks across 4 waves + final verification)
> **Parallel Execution**: YES — 4 waves + FINAL
> **Critical Path**: T1 → T2 → T5 → T6 → T8 → F1–F4 → user okay

---

## Context

### Original Request

Comprehensive overhaul of the Hearing Details / Hearing Packets page — UI/UX improvements, performance optimization, and code refactoring.

### Interview Summary

**Key Discussions**:

- User wants all three dimensions: UI/UX, performance, and code quality
- Test strategy: **Tests AFTER refactor** (refactor first, then backfill tests for extracted components)
- Agent-Executed QA: mandatory for every task

**Research Findings**:

- `src/pages/HearingPacketsPage.tsx` is 1,593 lines containing 4 components + helpers
- `Packet` is typed as `any`; `(packet as any).complaint` appears 10+ times
- `useEffect` syncs 8+ independent `useState` values from `packet` prop (classic anti-pattern)
- No existing tests for `HearingPacketsPage` or `packetService`
- Existing components in `src/components/packet/` set the convention for packet-related UI
- `src/types/` has no dedicated packet types (only `PacketAnalysisTask` in `asyncTask.ts`)

### Metis Review

**Identified Gaps** (addressed):

- Component directory: defaulted to `src/components/packet/` (follows existing convention)
- No dedicated packet types: resolved by adding `src/types/packet.ts` as Wave-1 task
- Inline `<style>` tag in `NoticeOfHearingPrint`: resolved by extraction + CSS-in-JS or dedicated stylesheet task

---

## Work Objectives

### Core Objective

Decompose the `HearingPacketsPage.tsx` monolith into focused, typed, testable components with a custom form-management hook and performance optimizations, while preserving all existing behavior and UI.

### Concrete Deliverables

- `src/types/packet.ts` — domain types for `Packet`, `PacketSummary`, `EnforcementFlags`, `StatusHistoryEntry`
- `src/hooks/usePacketForm.ts` — custom hook managing packet form state with `useReducer` or single state object
- `src/components/packet/PreparationChecklist.tsx` — extracted checklist with milestone logic
- `src/components/packet/NoticeOfHearingPrint.tsx` — extracted print overlay (inline styles preserved or extracted)
- `src/components/packet/PacketDetail.tsx` — extracted detail/edit view with tabs
- Refactored `src/pages/HearingPacketsPage.tsx` — list view, filtering, routing only (~300–400 lines target)
- Test files for each extracted component in co-located `__tests__/` directories

### Definition of Done

- [ ] `npm run build` passes with zero TypeScript errors
- [ ] `npm run test` passes (new + existing tests)
- [ ] `npm run lint` passes with zero warnings
- [ ] Agent QA scenarios pass for every task
- [ ] File size: `HearingPacketsPage.tsx` < 400 lines; each extracted component < 400 lines

### Must Have

- All existing UI behavior preserved exactly (no visual regressions)
- All existing data flows preserved (packet create, read, update, status transitions)
- Role-based conditional rendering preserved (manager vs inspector views)
- Status history audit trail preserved
- Preparation checklist deadline logic preserved
- Print/PDF generation preserved

### Must NOT Have (Guardrails)

- No changes to `packetService.ts` API surface (types only, no method signatures)
- No changes to packet document components (`PacketNoticeOfHearing`, `PacketCoverPage`, etc.)
- No database schema changes
- No new runtime dependencies
- No `as any` or `@ts-ignore` in new/extracted code
- No removal of existing tests
- No changes to routing structure in `App.tsx`

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision

- **Infrastructure exists**: YES (Vitest + jsdom + globals)
- **Automated tests**: Tests AFTER refactor
- **Framework**: Vitest (configured in `vite.config.ts`)
- **If TDD**: N/A — tests added after implementation

### QA Policy

Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright — Navigate, interact, assert DOM, screenshot
- **API/Backend**: Use Bash (curl / node REPL) — Import, call functions, compare output
- **Library/Module**: Use Bash (bun/node REPL) — Import, call functions, compare output

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation — types, hook, small components, ALL parallel):
├── T1: Create src/types/packet.ts domain types [quick]
├── T2: Create src/hooks/usePacketForm.ts custom hook [quick]
├── T3: Extract PreparationChecklist to src/components/packet/ [quick]
└── T4: Extract NoticeOfHearingPrint to src/components/packet/ [quick]

Wave 2 (Core Extraction — depends on Wave 1):
├── T5: Extract PacketDetail to src/components/packet/PacketDetail.tsx [deep]
└── T6: Refactor HearingPacketsPage.tsx — lean list view only [unspecified-high]

Wave 3 (Polish + Performance — depends on Wave 2):
├── T7: Fix useEffect anti-pattern in PacketDetail with usePacketForm hook [deep]
├── T8: Add useMemo / React.memo optimizations [quick]
└── T9: Extract inline print styles + accessibility fixes [quick]

Wave 4 (Tests — depends on Wave 3):
├── T10: Tests for PreparationChecklist [quick]
├── T11: Tests for PacketDetail form interactions [unspecified-high]
└── T12: Tests for HearingPacketsPage list view [unspecified-high]

Wave FINAL (After ALL — 4 parallel reviews, then user okay):
├── F1: Plan compliance audit (oracle)
├── F2: Code quality review (unspecified-high)
├── F3: Real manual QA (unspecified-high + playwright)
└── F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay

Critical Path: T1 → T2 → T5 → T6 → T8 → T12 → F1–F4 → user okay
Parallel Speedup: ~60% faster than sequential
Max Concurrent: 4 (Wave 1)
```

### Dependency Matrix

| Task  | Depends On     | Blocks          |
| ----- | -------------- | --------------- |
| T1    | —              | T2, T5, T7      |
| T2    | T1             | T5, T7          |
| T3    | —              | T12             |
| T4    | —              | T12             |
| T5    | T1, T2         | T6, T7, T8, T11 |
| T6    | T5             | T8, T12         |
| T7    | T1, T2, T5     | T11             |
| T8    | T5, T6         | T12             |
| T9    | T4, T5         | T11             |
| T10   | T3             | —               |
| T11   | T5, T7, T9     | —               |
| T12   | T3, T4, T6, T8 | —               |
| F1–F4 | ALL            | —               |

### Agent Dispatch Summary

- **Wave 1**: 4 tasks → `quick` (T1–T4)
- **Wave 2**: 2 tasks → `deep` (T5), `unspecified-high` (T6)
- **Wave 3**: 3 tasks → `deep` (T7), `quick` (T8), `quick` (T9)
- **Wave 4**: 3 tasks → `quick` (T10), `unspecified-high` (T11), `unspecified-high` (T12)
- **FINAL**: 4 tasks → `oracle` (F1), `unspecified-high` (F2), `unspecified-high` (F3), `deep` (F4)

---

## TODOs

- [ ] T1. **Create `src/types/packet.ts` — Domain Type Definitions**

  **What to do**:
  - Create `src/types/packet.ts` with the following interfaces:
    - `PacketSummary` — fields from `PACKET_LIST_COLUMNS` in `packetService.ts` (id, hearing_date, packet_status, assigned_to, case_number, program_code, packet_type, notes, hearing_time, hearing_location, bates_start, bates_end, admin_fee, deleted_at, created_at, updated_at)
    - `PacketFull` — extends `PacketSummary` with full columns (generated_at, chronology_snapshot, hearing_order_data, selected_report_ids, selected_photo_ids, checklist_data, enforcement_flags, selected_reports, selected_photos, inspector_signature, manager_signature, revision_notes, status_history)
    - `PacketWithRelations` — `PacketFull` + nested `complaint: ComplaintSummary`, `location: Location`, `inspector: Inspector`, `inspections: Inspection[]`
    - `EnforcementFlags` — already exists inline in HearingPacketsPage.tsx; move here
    - `StatusHistoryEntry` — already exists inline; move here
    - `ChecklistCompletion` — `Record<number, boolean>`
  - Replace `any` usage in `packetService.ts` return types with these new types
  - Ensure `ComplaintSummary` is imported from `@/types/complaint` where needed

  **Must NOT do**:
  - Do NOT change `packetService.ts` method signatures (only return type annotations)
  - Do NOT add Zod validation (out of scope)
  - Do NOT modify database schema

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: Pure type definitions, no logic, low risk

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T2, T3, T4)
  - **Blocks**: T2, T5, T7
  - **Blocked By**: None

  **References**:
  - `src/services/packetService.ts:PACKET_LIST_COLUMNS` and `PACKET_FULL_COLUMNS` — field definitions
  - `src/pages/HearingPacketsPage.tsx:81` — `type Packet = any` (replace with proper type)
  - `src/pages/HearingPacketsPage.tsx:83-90` — `StatusHistoryEntry` interface (move to types file)
  - `src/pages/HearingPacketsPage.tsx:150-155` — `EnforcementFlags` interface (move to types file)
  - `src/types/complaint.ts:11` — `ComplaintSummary` type to import

  **Acceptance Criteria**:
  - [ ] `src/types/packet.ts` exists and exports all listed interfaces
  - [ ] `packetService.ts` uses `PacketSummary[]` instead of `any[]` for `getAll` return
  - [ ] `packetService.ts` uses `PacketFull` instead of `any` for `getById` return
  - [ ] `npm run build` passes with zero new errors
  - [ ] No `any` types remain in `packetService.ts` return annotations

  **QA Scenarios**:

  ```
  Scenario: Types compile correctly
    Tool: Bash
    Preconditions: None
    Steps:
      1. Run `npx tsc --noEmit`
    Expected Result: Zero TypeScript errors, zero new warnings
    Evidence: .sisyphus/evidence/t1-typecheck.log

  Scenario: Types are importable
    Tool: Bash
    Preconditions: None
    Steps:
      1. Run `node -e "import('./src/types/packet.ts').then(m => console.log('OK'))"`
    Expected Result: No module resolution errors
    Evidence: .sisyphus/evidence/t1-import.log
  ```

  **Commit**: YES (groups with T2–T4)
  - Message: `refactor(packets): add packet types, usePacketForm hook, extract checklist and print components`
  - Files: `src/types/packet.ts`, `src/services/packetService.ts`

- [ ] T2. **Create `src/hooks/usePacketForm.ts` — Custom Form State Hook**

  **What to do**:
  - Create `src/hooks/usePacketForm.ts` that encapsulates the form state currently managed by 8+ `useState` + `useEffect` in `PacketDetail`
  - The hook should:
    - Accept a `packet: PacketFull | undefined` as input
    - Return an object with: `formState`, `updateField(key, value)`, `resetForm(packet)`, `isDirty`, `hasErrors`
  - Use `useReducer` or a single `useState` object (NOT 8 separate `useState` calls)
  - Preserve exact behavior: default values (`packet_status ?? "Not Started"`, empty string fallbacks, JSON.parse for `enforcement_flags` and `checklist_data`)

  **Must NOT do**:
  - Do NOT use `useEffect` to sync individual state values from packet prop
  - Do NOT change the form field names or default values
  - Do NOT add validation logic (out of scope)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: Hook extraction, pure logic refactor, well-defined scope

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1, T3, T4)
  - **Blocks**: T5, T7
  - **Blocked By**: T1

  **References**:
  - `src/pages/HearingPacketsPage.tsx:391-406` — current useState declarations
  - `src/pages/HearingPacketsPage.tsx:408-433` — current useEffect syncing pattern
  - `src/pages/HearingPacketsPage.tsx:491-501` — handleSave field list

  **Acceptance Criteria**:
  - [ ] `src/hooks/usePacketForm.ts` exists and exports the hook
  - [ ] Hook manages all 8+ fields with a single state mechanism (useReducer or useState<object>)
  - [ ] No `useEffect` used to sync from packet prop
  - [ ] `npm run build` passes
  - [ ] `npm run test` — existing tests still pass

  **QA Scenarios**:

  ```
  Scenario: Hook initializes with defaults
    Tool: Bash (node REPL)
    Preconditions: None
    Steps:
      1. Create test script importing usePacketForm
      2. Call with undefined packet
      3. Assert formState.status === "Not Started"
      4. Assert formState.notes === ""
    Expected Result: All defaults match current behavior
    Evidence: .sisyphus/evidence/t2-hook-defaults.log

  Scenario: Hook updates individual fields
    Tool: Bash (node REPL)
    Preconditions: None
    Steps:
      1. Import hook, render with test packet
      2. Call updateField("status", "Under Review")
      3. Assert formState.status === "Under Review"
      4. Assert isDirty === true
    Expected Result: Field updates correctly, dirty flag set
    Evidence: .sisyphus/evidence/t2-hook-updates.log
  ```

  **Commit**: YES (groups with T1, T3, T4)

- [ ] T3. **Extract `PreparationChecklist` to `src/components/packet/PreparationChecklist.tsx`**

  **What to do**:
  - Extract the `PreparationChecklist` component (lines ~169–294 in current file) to its own file
  - Move constants `getFirstWednesdayOfCurrentMonth` to the component file or a utility
  - Preserve all existing behavior: milestone rendering, deadline calculation, overdue detection, completion counting
  - Export as named export: `export function PreparationChecklist({ ... })`
  - Add `React.memo` wrapper for performance
  - Add basic prop types using the types from `src/types/packet.ts` (`ChecklistCompletion`)

  **Must NOT do**:
  - Do NOT change milestone labels, deadlines, or logic
  - Do NOT change styling (keep existing Tailwind classes)
  - Do NOT remove the component from the original file yet (do that in T6)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: Pure extraction, no logic changes

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1, T2, T4)
  - **Blocks**: T12
  - **Blocked By**: None

  **References**:
  - `src/pages/HearingPacketsPage.tsx:169-294` — current PreparationChecklist component
  - `src/types/packet.ts` (from T1) — `ChecklistCompletion` type

  **Acceptance Criteria**:
  - [ ] `src/components/packet/PreparationChecklist.tsx` exists with identical behavior
  - [ ] Component is wrapped with `React.memo`
  - [ ] No logic changes from original
  - [ ] `npm run build` passes

  **QA Scenarios**:

  ```
  Scenario: Component renders milestones
    Tool: Bash (node REPL + React Testing Library)
    Preconditions: None
    Steps:
      1. Render with hearingDate="2026-06-15" and completion={{}}
      2. Assert 6 milestones rendered
      3. Assert first milestone label is "Post Notice of Hearing"
    Expected Result: All 6 milestones displayed with correct dates
    Evidence: .sisyphus/evidence/t3-checklist-render.png

  Scenario: Overdue milestone shows warning
    Tool: Bash (node REPL + React Testing Library)
    Preconditions: None
    Steps:
      1. Render with hearingDate="2024-01-01" (past date)
      2. Assert overdue styling applied
    Expected Result: Overdue milestones show destructive color and "X days overdue" text
    Evidence: .sisyphus/evidence/t3-checklist-overdue.png
  ```

  **Commit**: YES (groups with T1, T2, T4)

- [ ] T4. **Extract `NoticeOfHearingPrint` to `src/components/packet/NoticeOfHearingPrint.tsx`**

  **What to do**:
  - Extract the `NoticeOfHearingPrint` component (lines ~297–364) to its own file
  - Preserve the inline `<style>` tag exactly (style extraction happens in T9)
  - Preserve all props: `data`, `onClose`
  - Use `PacketWithRelations` type from `src/types/packet.ts` for the `data` prop (instead of `any`)
  - Export as named export

  **Must NOT do**:
  - Do NOT change print styles yet (T9 handles that)
  - Do NOT change the Suspense/lazy loading pattern
  - Do NOT remove from original file yet (T6)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: Pure extraction, no logic changes

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1, T2, T3)
  - **Blocks**: T12
  - **Blocked By**: None

  **References**:
  - `src/pages/HearingPacketsPage.tsx:297-364` — current NoticeOfHearingPrint component
  - `src/types/packet.ts` (from T1) — `PacketWithRelations` type

  **Acceptance Criteria**:
  - [ ] `src/components/packet/NoticeOfHearingPrint.tsx` exists with identical behavior
  - [ ] `data` prop uses `PacketWithRelations` instead of `any`
  - [ ] `npm run build` passes

  **QA Scenarios**:

  ```
  Scenario: Component accepts typed props
    Tool: Bash (node REPL)
    Preconditions: None
    Steps:
      1. Import component and PacketWithRelations type
      2. Create mock data matching PacketWithRelations shape
      3. Verify no type errors
    Expected Result: TypeScript accepts the mock data
    Evidence: .sisyphus/evidence/t4-types.log
  ```

  **Commit**: YES (groups with T1–T3)

- [ ] T5. **Extract `PacketDetail` to `src/components/packet/PacketDetail.tsx`**

  **What to do**:
  - Extract the `PacketDetail` component (lines ~367–1283) to its own file
  - Replace all `any` types with proper types from `src/types/packet.ts`
  - Replace the 8-state `useEffect` sync with the `usePacketForm` hook from T2
  - Keep all tab content logic, status transitions, revision notes, action buttons
  - Import `PreparationChecklist` and `NoticeOfHearingPrint` from their new locations
  - Preserve role-based conditional rendering (`isManagerRole`, status-based UI)
  - Preserve all mutation handlers: `handleSave`, `handleSendToReview`, `handleReturnForRevision`, `handleChecklistToggle`
  - Target: < 400 lines (currently ~900 lines)
  - Extract helper functions `parseStatusHistory`, `fmtAuditTime`, `ACTION_LABEL` to a utility file or keep inline if short

  **Must NOT do**:
  - Do NOT change tab structure or tab values ("packet", "notice", "chrono", "evidence", "order")
  - Do NOT change status transition logic ("Not Started" → "In Progress" → "Under Review" → "Complete")
  - Do NOT remove `HearingOrderEditor` lazy import or `Suspense` wrappers
  - Do NOT change the `useQuery` / `useMutation` patterns

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []
  - Reason: Large component extraction with type refactoring and hook integration — requires careful behavior preservation

  **Parallelization**:
  - **Can Run In Parallel**: YES (within Wave 2)
  - **Parallel Group**: Wave 2 (with T6)
  - **Blocks**: T6, T7, T8, T11
  - **Blocked By**: T1, T2

  **References**:
  - `src/pages/HearingPacketsPage.tsx:367-1283` — current PacketDetail component
  - `src/types/packet.ts` (T1) — all packet types
  - `src/hooks/usePacketForm.ts` (T2) — form state hook
  - `src/components/packet/PreparationChecklist.tsx` (T3) — imported checklist
  - `src/components/packet/NoticeOfHearingPrint.tsx` (T4) — imported print overlay
  - `src/pages/HearingPacketsPage.tsx:435-445` — updateMutation pattern to preserve
  - `src/pages/HearingPacketsPage.tsx:475-488` — handleChecklistToggle pattern

  **Acceptance Criteria**:
  - [ ] `src/components/packet/PacketDetail.tsx` exists and compiles
  - [ ] File size < 400 lines
  - [ ] All `any` types replaced with proper types
  - [ ] `usePacketForm` hook is used (no 8-state useEffect sync)
  - [ ] All tabs render correctly
  - [ ] Status transitions work (send to review, return for revision, save)
  - [ ] `npm run build` passes
  - [ ] `npm run test` — existing tests pass

  **QA Scenarios**:

  ```
  Scenario: PacketDetail renders all tabs
    Tool: Playwright
    Preconditions: Dev server running (`npm run dev`)
    Steps:
      1. Navigate to /enforcement/hearings
      2. Click on any packet in the list
      3. Assert "Packet Details" tab is active by default
      4. Click "Notice" tab — assert Notice content visible
      5. Click "Chronology" tab — assert ChronologyEditorTab renders
      6. Click "Attachments" tab — assert AttachmentsEvidenceTab renders
    Expected Result: All 4 tabs (5 if Complete) render without errors
    Evidence: .sisyphus/evidence/t5-tabs.png

  Scenario: Status transition flow
    Tool: Playwright
    Preconditions: Dev server running, packet in "In Progress" status
    Steps:
      1. Open packet detail for an "In Progress" packet
      2. Click "Send to Review" button
      3. Assert status badge changes to "Under Review"
      4. Assert "Return for Revision" section appears (for manager role)
    Expected Result: Status updates correctly, UI reflects new state
    Evidence: .sisyphus/evidence/t5-status-flow.png

  Scenario: Save changes persists data
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Open packet detail
      2. Change Case Number to "TEST-123"
      3. Click "Save Changes"
      4. Assert toast "Packet updated" appears
      5. Refresh page
      6. Assert Case Number still shows "TEST-123"
    Expected Result: Changes persist across refresh
    Evidence: .sisyphus/evidence/t5-save-persist.png
  ```

  **Commit**: YES (groups with T6)
  - Message: `refactor(packets): extract PacketDetail and slim down HearingPacketsPage`

- [ ] T6. **Refactor `HearingPacketsPage.tsx` — Lean List View Only**

  **What to do**:
  - Remove `PacketDetail`, `PreparationChecklist`, `NoticeOfHearingPrint` from this file
  - Import them from their new locations
  - Keep only: list view rendering, status filtering, packet selection/routing, export to Excel, PDF viewer modal
  - Add `React.memo` to the packet list row rendering (memoize the `packets.map` callback or extract a `PacketListItem` component)
  - Add `useMemo` for `selected` calculation (currently recalculates on every render)
  - Replace `any` types with `PacketSummary` from `src/types/packet.ts`
  - Target: < 400 lines (currently 1,593 lines)
  - Keep `baseRoute` prop logic for embeddability

  **Must NOT do**:
  - Do NOT change the list columns or column widths (col-span-2, col-span-4, etc.)
  - Do NOT change the mobile/desktop responsive grid
  - Do NOT change the export to Excel column configuration
  - Do NOT change routing (`/enforcement/hearings/:id`)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  - Reason: Large file reduction, requires careful deletion and import management

  **Parallelization**:
  - **Can Run In Parallel**: YES (within Wave 2)
  - **Parallel Group**: Wave 2 (with T5)
  - **Blocks**: T8, T12
  - **Blocked By**: T5

  **References**:
  - `src/pages/HearingPacketsPage.tsx:1286-1593` — main page component to retain
  - `src/types/packet.ts` (T1) — `PacketSummary` type
  - `src/components/packet/PacketDetail.tsx` (T5) — imported detail component

  **Acceptance Criteria**:
  - [ ] `HearingPacketsPage.tsx` < 400 lines
  - [ ] List renders correctly with all columns
  - [ ] Status filter works
  - [ ] Packet selection opens detail panel
  - [ ] Export to Excel works
  - [ ] `npm run build` passes
  - [ ] `npm run test` — existing tests pass

  **QA Scenarios**:

  ```
  Scenario: List view renders packets
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Navigate to /enforcement/hearings
      2. Assert packet list visible with columns: Hearing Date, Case #, Address, Status
      3. Assert status filter dropdown works
    Expected Result: List renders with correct columns and filtering
    Evidence: .sisyphus/evidence/t6-list-view.png

  Scenario: Packet selection opens detail
    Tool: Playwright
    Preconditions: Dev server running, packets exist
    Steps:
      1. Click on a packet row
      2. Assert detail panel opens on the right (xl:w-1/2)
      3. Assert PacketDetail component rendered
      4. Click same packet again — assert detail panel closes
    Expected Result: Toggle selection works correctly
    Evidence: .sisyphus/evidence/t6-selection-toggle.png

  Scenario: Export to Excel
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Click "Export" button
      2. Assert file download initiated (check download event or network tab)
    Expected Result: Excel file generated with correct columns
    Evidence: .sisyphus/evidence/t6-export.png
  ```

  **Commit**: YES (groups with T5)

- [ ] T7. **Integrate `usePacketForm` Hook into `PacketDetail`**

  **What to do**:
  - In `src/components/packet/PacketDetail.tsx`, replace the manual `useState` + `useEffect` sync with the `usePacketForm` hook from T2
  - Update all form input bindings to use `formState` and `updateField` from the hook
  - Ensure `handleSave` uses the hook's `formState` instead of individual state variables
  - Ensure checklist toggle updates the hook state and triggers mutation correctly
  - Verify `isDirty` flag behavior (if implemented in hook)

  **Must NOT do**:
  - Do NOT change any UI markup in this task (pure state-management refactor)
  - Do NOT change the mutation payloads (field names must match current API)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []
  - Reason: Critical behavior preservation — form state management is the core of this component

  **Parallelization**:
  - **Can Run In Parallel**: NO (must complete after T5, before T11)
  - **Parallel Group**: Wave 3
  - **Blocks**: T11
  - **Blocked By**: T1, T2, T5

  **References**:
  - `src/hooks/usePacketForm.ts` (T2) — the hook to integrate
  - `src/components/packet/PacketDetail.tsx` (T5) — current state management to replace

  **Acceptance Criteria**:
  - [ ] `PacketDetail.tsx` uses `usePacketForm` hook
  - [ ] No individual `useState` calls for form fields remain
  - [ ] No `useEffect` syncing from `packet` prop remains
  - [ ] All form fields update correctly
  - [ ] Save mutation sends correct payload
  - [ ] `npm run build` passes
  - [ ] `npm run test` passes

  **QA Scenarios**:

  ```
  Scenario: Form fields update without useEffect sync
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Open packet detail
      2. Change Case Number, Hearing Time, Hearing Location
      3. Click Save
      4. Assert toast "Packet updated" appears
      5. Refresh page
      6. Assert all three fields show updated values
    Expected Result: All fields persist correctly without useEffect anti-pattern
    Evidence: .sisyphus/evidence/t7-form-updates.png
  ```

  **Commit**: YES (groups with T8, T9)
  - Message: `refactor(packets): usePacketForm integration, memoization, style extraction`

- [ ] T8. **Add `useMemo` / `React.memo` Performance Optimizations**

  **What to do**:
  - In `HearingPacketsPage.tsx`: wrap `packets.map` callback with `useCallback`, memoize `selected` with `useMemo`
  - In `PacketDetail.tsx`: memoize tab content rendering where possible (e.g., `Notice` tab content, `Packet Details` form fields)
  - In `PreparationChecklist.tsx`: already has `React.memo` from T3 — verify it's working
  - In `NoticeOfHearingPrint.tsx`: already memoized or simple enough
  - Add `useMemo` for `STATUS_BADGE` lookup (currently computed inline)
  - Add `useMemo` for `badgeCls` in list items
  - Verify no re-renders triggered by parent state changes that don't affect children

  **Must NOT do**:
  - Do NOT add `useMemo` everywhere indiscriminately (only where profiling or code review shows benefit)
  - Do NOT change component output or behavior
  - Do NOT add `useCallback` to event handlers that don't cause child re-renders

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: Performance tuning with clear, measurable criteria

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T7, T9)
  - **Parallel Group**: Wave 3
  - **Blocks**: T12
  - **Blocked By**: T5, T6

  **References**:
  - `src/pages/HearingPacketsPage.tsx:1455-1468` — `packets.map` callback
  - `src/pages/HearingPacketsPage.tsx:1321-1324` — `selected` useMemo opportunity
  - `src/components/packet/PacketDetail.tsx` — tab content rendering

  **Acceptance Criteria**:
  - [ ] `selected` uses `useMemo`
  - [ ] List row callback uses `useCallback`
  - [ ] `STATUS_BADGE` lookups use `useMemo` where applicable
  - [ ] `React.memo` applied to `PacketDetail` props (if beneficial)
  - [ ] `npm run build` passes
  - [ ] `npm run test` passes

  **QA Scenarios**:

  ```
  Scenario: List does not re-render on irrelevant state changes
    Tool: Playwright
    Preconditions: Dev server running, React DevTools Profiler or console.log
    Steps:
      1. Open /enforcement/hearings
      2. Trigger a state change that doesn't affect list (e.g., open/close detail panel)
      3. Verify list items do not re-render (use React DevTools Profiler)
    Expected Result: List items stable across unrelated state changes
    Evidence: .sisyphus/evidence/t8-perf-profile.png
  ```

  **Commit**: YES (groups with T7, T9)

- [ ] T9. **Extract Inline Print Styles + Accessibility Fixes**

  **What to do**:
  - Extract the inline `<style>` tag from `NoticeOfHearingPrint.tsx` to a dedicated CSS file: `src/components/packet/NoticeOfHearingPrint.css`
  - Import the CSS file in the component
  - Ensure print media queries work correctly after extraction
  - Add `aria-label` attributes to icon-only buttons in `PacketDetail` (PDF view, download)
  - Add `aria-expanded` to the collapsible "Return for Revision" section
  - Add `aria-expanded` to the "Status History" collapsible section
  - Ensure all `<button>` elements have explicit `type="button"` where missing
  - Add `htmlFor` / `id` associations to checkbox groups in enforcement flags and proposed actions

  **Must NOT do**:
  - Do NOT change print output visually (pixel-perfect preservation)
  - Do NOT add new UI elements
  - Do NOT change color schemes or Tailwind classes

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: CSS extraction + minor a11y improvements, low risk

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T7, T8)
  - **Parallel Group**: Wave 3
  - **Blocks**: T11
  - **Blocked By**: T4, T5

  **References**:
  - `src/components/packet/NoticeOfHearingPrint.tsx` (T4) — inline style tag to extract
  - `src/components/packet/PacketDetail.tsx` (T5) — buttons needing aria-labels
  - `src/components/packet/PreparationChecklist.tsx` (T3) — checklist buttons already have type="button"

  **Acceptance Criteria**:
  - [ ] `src/components/packet/NoticeOfHearingPrint.css` exists with identical styles
  - [ ] Print preview looks identical to before (visual regression check)
  - [ ] All icon-only buttons have `aria-label`
  - [ ] All collapsible sections have `aria-expanded`
  - [ ] All checkbox groups have proper `htmlFor`/`id` associations
  - [ ] `npm run build` passes

  **QA Scenarios**:

  ```
  Scenario: Print styles work after extraction
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Open packet detail
      2. Click "Notice of Hearing" button
      3. Assert print overlay opens with correct styling
      4. Trigger browser print dialog
      5. Assert print preview shows correctly formatted document
    Expected Result: Print output visually identical to pre-refactor
    Evidence: .sisyphus/evidence/t9-print-preview.png

  Scenario: Accessibility attributes present
    Tool: Bash (grep)
    Preconditions: None
    Steps:
      1. Run `grep -r "aria-label" src/components/packet/PacketDetail.tsx`
      2. Run `grep -r "aria-expanded" src/components/packet/PacketDetail.tsx`
      3. Assert matches found for icon buttons and collapsible sections
    Expected Result: Accessibility attributes added to all target elements
    Evidence: .sisyphus/evidence/t9-a11y-check.log
  ```

  **Commit**: YES (groups with T7, T8)

- [ ] T10. **Tests for `PreparationChecklist`**

  **What to do**:
  - Create `src/components/packet/__tests__/PreparationChecklist.test.tsx`
  - Test rendering: correct number of milestones, correct labels, correct deadline dates
  - Test interaction: clicking milestone toggles completion state
  - Test overdue detection: past hearing date shows overdue styling
  - Test empty state: no hearing date shows placeholder message
  - Test completion counter: "X of Y complete" badge updates correctly
  - Mock `onToggle` callback and verify it's called with correct milestone ID

  **Must NOT do**:
  - Do NOT test internal implementation details (e.g., specific CSS class names)
  - Do NOT add snapshot tests
  - Do NOT test date-fns internals

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`tdd`]
  - Reason: Testing-library patterns, well-scoped component with clear inputs/outputs

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T11, T12)
  - **Parallel Group**: Wave 4
  - **Blocks**: None
  - **Blocked By**: T3

  **References**:
  - `src/components/packet/PreparationChecklist.tsx` (T3) — component to test
  - `src/components/packet/__tests__/DraftUploadPanel.test.tsx` — existing test pattern in same directory
  - `src/services/__tests__/aiService.test.ts` — mock pattern with `vi.hoisted()` + `vi.mock()`

  **Acceptance Criteria**:
  - [ ] Test file exists and runs with `npm run test -- src/components/packet/__tests__/PreparationChecklist.test.tsx`
  - [ ] All tests pass
  - [ ] Coverage > 80% for the component
  - [ ] `npm run test` (full suite) still passes

  **QA Scenarios**:

  ```
  Scenario: Test suite passes
    Tool: Bash
    Preconditions: None
    Steps:
      1. Run `npm run test -- src/components/packet/__tests__/PreparationChecklist.test.tsx`
    Expected Result: All tests pass, 0 failures
    Evidence: .sisyphus/evidence/t10-test-results.log
  ```

  **Commit**: YES (groups with T11, T12)
  - Message: `test(packets): add tests for PreparationChecklist, PacketDetail, HearingPacketsPage`

- [ ] T11. **Tests for `PacketDetail` Form Interactions**

  **What to do**:
  - Create `src/components/packet/__tests__/PacketDetail.test.tsx`
  - Test rendering: all tabs render, correct initial values from packet prop
  - Test form interactions: changing Case Number, Program Code, Hearing Time, Hearing Location
  - Test checkbox interactions: Proposed Actions toggles, Enforcement Flags toggles
  - Test save: clicking Save calls update mutation with correct payload
  - Test status transitions: "Send to Review" button triggers status change
  - Test revision flow: "Return for Revision" section expands, requires notes, triggers mutation
  - Mock `useQuery` and `useMutation` from `@tanstack/react-query` using `vi.mock`
  - Mock `useAuth` to provide different roles for role-based tests

  **Must NOT do**:
  - Do NOT test internal hook implementation (test through UI interactions only)
  - Do NOT test `ChronologyEditorTab` or `AttachmentsEvidenceTab` internals (they're separate components)
  - Do NOT test lazy-loaded components (`HearingPacketPreview`, `HearingOrderEditor`)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`tdd`]
  - Reason: Complex component with many interactions, requires thorough mocking

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T10, T12)
  - **Parallel Group**: Wave 4
  - **Blocks**: None
  - **Blocked By**: T5, T7, T9

  **References**:
  - `src/components/packet/PacketDetail.tsx` (T5, T7) — component to test
  - `src/components/packet/__tests__/ComplianceReviewView.test.tsx` — existing test pattern
  - `src/context/AuthContext.tsx` — `useAuth` hook to mock
  - `src/services/__tests__/aiService.test.ts` — `vi.hoisted()` + `vi.mock()` pattern

  **Acceptance Criteria**:
  - [ ] Test file exists and runs
  - [ ] All tests pass
  - [ ] Coverage > 80% for the component
  - [ ] Role-based conditional rendering tested (manager vs inspector views)
  - [ ] `npm run test` (full suite) still passes

  **QA Scenarios**:

  ```
  Scenario: Test suite passes
    Tool: Bash
    Preconditions: None
    Steps:
      1. Run `npm run test -- src/components/packet/__tests__/PacketDetail.test.tsx`
    Expected Result: All tests pass, 0 failures
    Evidence: .sisyphus/evidence/t11-test-results.log
  ```

  **Commit**: YES (groups with T10, T12)

- [ ] T12. **Tests for `HearingPacketsPage` List View**

  **What to do**:
  - Create `src/pages/__tests__/HearingPacketsPage.test.tsx`
  - Test rendering: list view renders with correct columns, status filter dropdown works
  - Test selection: clicking packet row opens detail panel, clicking again closes it
  - Test filtering: selecting status from dropdown filters the list
  - Test empty state: "No hearing packets found" message renders when no packets
  - Test loading state: skeleton loaders render during data fetch
  - Mock `packetService.getAll` using `vi.mock('@/services/packetService')`
  - Mock `useAuth` for user role

  **Must NOT do**:
  - Do NOT test `PacketDetail` internals (already tested in T11)
  - Do NOT test routing/navigation internals (React Router is mocked)
  - Do NOT test export to Excel (browser download is hard to test in jsdom)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`tdd`]
  - Reason: Page-level component with data fetching, requires service mocking

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T10, T11)
  - **Parallel Group**: Wave 4
  - **Blocks**: None
  - **Blocked By**: T3, T4, T6, T8

  **References**:
  - `src/pages/HearingPacketsPage.tsx` (T6) — page component to test
  - `src/services/__tests__/importService.test.ts` — service mock pattern
  - `src/services/__tests__/aiService.test.ts` — `vi.hoisted()` + `vi.mock()` pattern

  **Acceptance Criteria**:
  - [ ] Test file exists and runs
  - [ ] All tests pass
  - [ ] Coverage > 80% for the page component
  - [ ] `npm run test` (full suite) still passes

  **QA Scenarios**:

  ```
  Scenario: Test suite passes
    Tool: Bash
    Preconditions: None
    Steps:
      1. Run `npm run test -- src/pages/__tests__/HearingPacketsPage.test.tsx`
    Expected Result: All tests pass, 0 failures
    Evidence: .sisyphus/evidence/t12-test-results.log
  ```

  **Commit**: YES (groups with T10, T11)

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [ ] F1. **Plan Compliance Audit** — `oracle`
      Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in `.sisyphus/evidence/`. Compare deliverables against plan.
      Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
      Run `tsc --noEmit` + `npm run lint` + `npm run test`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, `console.log` in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp).
      Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill if UI)
      Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (features working together, not isolation). Test edge cases: empty state, invalid input, rapid actions. Save to `.sisyphus/evidence/final-qa/`.
      Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
      For each task: read "What to do", read actual diff (`git log --oneline`, `git diff`). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
      Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **T1–T4**: `refactor(packets): add packet types, usePacketForm hook, extract checklist and print components`
- **T5–T6**: `refactor(packets): extract PacketDetail and slim down HearingPacketsPage`
- **T7–T9**: `refactor(packets): usePacketForm integration, memoization, style extraction`
- **T10–T12**: `test(packets): add tests for PreparationChecklist, PacketDetail, HearingPacketsPage`
- **F1–F4**: `chore(packets): final verification and cleanup`

---

## Success Criteria

### Verification Commands

```bash
# Type check
npx tsc --noEmit
# Expected: 0 errors, 0 warnings

# Lint
npm run lint
# Expected: 0 problems

# Tests
npm run test
# Expected: all tests pass (existing + new)

# Build
npm run build
# Expected: build succeeds
```

### Final Checklist

- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass
- [ ] No `any` types in new/extracted code
- [ ] No `@ts-ignore` in new/extracted code
- [ ] `HearingPacketsPage.tsx` < 400 lines
- [ ] Each extracted component < 400 lines
- [ ] Evidence files exist for every task's QA scenarios
