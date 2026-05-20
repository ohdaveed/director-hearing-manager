# Inspection Form UX & Architecture Improvements

## TL;DR

> Fix the unresponsive "Fill Demo Data" button, group Areas Inspected into sub-categories, improve dark-mode contrast for checkboxes and labels, default Corrective Actions to collapsed, and add a sticky bottom action bar for primary buttons.

**Deliverables**:

- `InspectionFormPage.tsx` — fixed demo data, grouped areas, sticky action bar
- `ActionAssignmentPanel.tsx` — default collapsed, improved contrast
- `ViolationRow.tsx` — improved checkbox label contrast

**Estimated Effort**: Medium
**Parallel Execution**: YES — 3 waves
**Critical Path**: Demo data fix (Wave 1) → Visual improvements (Wave 2) → Sticky bar (Wave 3) → Verification

---

## Context

### Original Request

User identified 5 specific issues with the inspection form interface:

1. **Fill Demo Data button is completely unresponsive** — the `demo` object is empty `{}`
2. **Form requires excessive vertical scrolling** — needs better visual grouping and multi-column layout
3. **Areas Inspected has 13 flat buttons** — should be grouped by sub-category (Exterior, Interior, Common Areas)
4. **Corrective Actions sections are expanded by default** — should be collapsed, with better visual separation
5. **Dark mode contrast issues** — checkbox labels and action text use `text-muted-foreground` which fails WCAG AA on dark backgrounds
6. **Primary action buttons at bottom** — need sticky positioning for accessibility during long forms

### Research Findings

**Fill Demo Data** ([InspectionFormPage.tsx:515-520](file:///home/parallax/director-hearing-manager/src/pages/InspectionFormPage.tsx#L515-L520)):

```typescript
const demo = {}; // EMPTY — does nothing
setForm((prev) => (prev ? { ...prev, ...demo } : prev));
```

The button's onClick calls `fillInspectionDemoData` but the function spreads an empty object over state. Toast says "filled in" but zero fields change.

**Areas Inspected** ([InspectionFormPage.tsx:52-66](file:///home/parallax/director-hearing-manager/src/pages/InspectionFormPage.tsx#L52-L66)):
Flat array of 13 strings rendered as toggle buttons in a flex-wrap row. No categorization.

**Corrective Actions** ([ActionAssignmentPanel.tsx:56](file:///home/parallax/director-hearing-manager/src/components/violation/ActionAssignmentPanel.tsx#L56)):
`const [collapsed, setCollapsed] = useState(false);` — starts expanded. Panels do have collapse capability.

**Dark Mode Contrast Issues**:

- `ActionAssignmentPanel.tsx` line 143: unselected action text uses `text-muted-foreground` on `bg-card` — ratio ~3.8:1 (fails WCAG AA)
- `ViolationRow.tsx` line 586: checkbox label "Owner" uses `text-muted-foreground font-semibold text-[10px]` — poor contrast on dark card bg

**Sticky Action Bar** ([InspectionFormPage.tsx:918-956](file:///home/parallax/director-hearing-manager/src/pages/InspectionFormPage.tsx#L918-L956)):
Buttons are in a static flex row at the bottom with `pt-4 pb-10`. No sticky/fixed positioning. Users must scroll to bottom to access Save/Submit.

---

## Work Objectives

### Core Objective

Transform the inspection form from a long, flat, scroll-heavy interface into a well-grouped, accessible, scannable form with functional demo data and persistent action access.

### Concrete Deliverables

1. Fill Demo Data button populates: inspection type, 6 areas, summary, 2 global observations, 2 violations
2. Areas Inspected rendered in 4 sub-category groups with small headers
3. Unselected action text uses `text-foreground/80` instead of `text-muted-foreground`
4. Checkbox party labels ("Owner"/"Tenant") use `text-foreground` instead of `text-muted-foreground`
5. ActionAssignmentPanel defaults to `collapsed = true`
6. Bottom action bar uses `sticky bottom-0` or `fixed` positioning with backdrop blur

### Definition of Done

- [ ] `npm run build` passes
- [ ] `npm run test` passes (33/33)
- [ ] LSP diagnostics clean on all modified files
- [ ] Fill Demo Data button visibly changes form fields when clicked

### Must Have

- Demo data must include at least: inspection_type, areasInspected, summary, globalObservations, violations
- Areas must be grouped into at least 3 categories
- Contrast fixes must not break existing visual hierarchy (selected vs unselected must still be distinguishable)
- Sticky bar must not overlap content on mobile

### Must NOT Have

- Do NOT change global theme colors (affects entire app)
- Do NOT remove existing CollapsibleSection behavior
- Do NOT add new dependencies

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed.

### Test Decision

- **Infrastructure exists**: YES (Vitest)
- **Automated tests**: No new tests needed (UI-only changes)
- **Agent-Executed QA**: ALWAYS — verify by reading file and checking LSP/build

### QA Policy

Every task includes Agent-Executed QA Scenarios. Evidence saved to `.sisyphus/evidence/`.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation — can start immediately):
├── Task 1: Fix Fill Demo Data button [quick]
├── Task 2: Group Areas Inspected by sub-category [quick]
└── Task 3: Fix dark mode contrast in ActionAssignmentPanel [quick]

Wave 2 (After Wave 1 — visual polish):
├── Task 4: Fix dark mode contrast in ViolationRow [quick]
├── Task 5: Default Corrective Actions to collapsed [quick]
└── Task 6: Add sticky bottom action bar [quick]

Wave 3 (After Wave 2 — integration + verification):
├── Task 7: Build + test verification [quick]
└── Task 8: LSP diagnostics verification [quick]

Wave FINAL (Review):
├── Task F1: Code quality review (unspecified-high)
└── Task F2: Scope fidelity check (deep)
```

### Agent Dispatch Summary

- **Wave 1**: 3 tasks → all `quick` (single-file focused changes)
- **Wave 2**: 3 tasks → all `quick` (single-file focused changes)
- **Wave 3**: 2 tasks → `quick` (verification commands)
- **FINAL**: 2 review tasks

---

## TODOs

- [x] 1. Fix Fill Demo Data button

  **What to do**:
  - Replace empty `const demo = {}` with a populated `Partial<FormState>` object
  - Set `inspection_type: "Routine"`
  - Set `areasInspected` to 6 common areas: Hallways, Bathroom, Garbage Area, Front/Backyard, Lobby, Staircase
  - Set `summary` to a realistic 2-sentence inspection summary
  - Set `globalObservations` to 2 entries: property access note + owner presence note
  - Build 2 demo violations using `newViolation()` + `VIOLATION_TYPES.find()`:
    - "Sanitation||Garbage / Refuse / Waste / Debris" with location "Garbage Area"
    - "Pests, Vermin & Animals||Rodents" with location "Hallways / Common Areas"
  - Each violation must have: `correctiveAction`, `dueDate` (via `calcDueDate`), `responsibleParty: "Owner"`, `ownerActions: [defaultCorrectiveAction]`

  **Must NOT do**:
  - Do NOT modify the toast message or button styling
  - Do NOT change the function signature
  - Do NOT use `any` types

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 2, 3)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `InspectionFormPage.tsx:515-520` — current broken implementation
  - `InspectionFormPage.tsx:114-141` — `buildAutoViolations` pattern for creating violations
  - `InspectionFormPage.tsx:176-189` — `newViolation()` factory function
  - `src/components/violationTypes.ts` — VIOLATION_TYPES array for valid keys

  **Acceptance Criteria**:
  - [ ] After clicking "Fill Demo Data", form fields are visibly populated
  - [ ] `npm run build` passes
  - [ ] LSP diagnostics clean

  **QA Scenarios**:

  ```
  Scenario: Fill Demo Data populates fields
    Tool: Read file
    Preconditions: File edited
    Steps:
      1. Read fillInspectionDemoData function
      2. Verify demo object has non-empty values for inspection_type, areasInspected, summary, violations
      3. Verify violations array has 2 items with valid violationKey strings
    Expected Result: All fields populated; no TypeScript errors
    Evidence: .sisyphus/evidence/task-1-demo-data.txt
  ```

---

- [x] 2. Group Areas Inspected into sub-categories

  **What to do**:
  - Create an `AREA_GROUPS` constant mapping categories to area arrays:
    - Exterior: "Alleyway/Easement", "Front/Backyard", "Garage/Driveway", "Roof"
    - Interior: "Basement", "Bathroom", "Hallways", "Laundry Room", "Lightwells", "Lobby", "Staircase"
    - Common: "Garbage Area"
    - Other: "Other"
  - In the Areas Inspected `CollapsibleSection`, replace the flat `AREAS.map(...)` with grouped sections
  - Each group renders as a sub-section with a small header (e.g., `<p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Exterior</p>`)
  - Keep the same toggle button styling and behavior (`toggleArea`)
  - Use `gap-4` between groups, `gap-2` within group

  **Must NOT do**:
  - Do NOT change the `AREAS` constant (preserve backward compatibility)
  - Do NOT change the `toggleArea` function
  - Do NOT change the form state structure

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 1, 3)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `InspectionFormPage.tsx:52-66` — `AREAS` constant
  - `InspectionFormPage.tsx:765-782` — current Areas Inspected rendering
  - `InspectionFormPage.tsx:393-402` — `toggleArea` function

  **Acceptance Criteria**:
  - [ ] Areas render in 4 visually separated groups
  - [ ] Toggle behavior unchanged (clicking still adds/removes from `areasInspected`)
  - [ ] LSP diagnostics clean

  **QA Scenarios**:

  ```
  Scenario: Areas grouped by category
    Tool: Read file
    Preconditions: File edited
    Steps:
      1. Read Areas Inspected section rendering
      2. Verify at least 3 group headers exist (Exterior, Interior, etc.)
      3. Verify toggle buttons still call toggleArea(area)
    Expected Result: Grouped layout with preserved functionality
    Evidence: .sisyphus/evidence/task-2-area-groups.txt
  ```

---

- [x] 3. Fix dark mode contrast in ActionAssignmentPanel

  **What to do**:
  - In `renderActionItem`, change unselected text class from `text-muted-foreground` to `text-foreground/80`
  - Keep selected text as `text-foreground font-medium`
  - This preserves visual hierarchy while ensuring WCAG AA compliance (ratio > 4.5:1)

  **Must NOT do**:
  - Do NOT change selected item styling
  - Do NOT change background colors
  - Do NOT change the component structure

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 1, 2)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `ActionAssignmentPanel.tsx:141-147` — unselected text styling

  **Acceptance Criteria**:
  - [ ] Unselected action text uses `text-foreground/80`
  - [ ] Selected action text still uses `text-foreground font-medium`
  - [ ] LSP diagnostics clean

  **QA Scenarios**:

  ```
  Scenario: Contrast improved
    Tool: Read file
    Preconditions: File edited
    Steps:
      1. Read renderActionItem function
      2. Verify unselected className contains "text-foreground/80"
      3. Verify selected className contains "text-foreground font-medium"
    Expected Result: Text classes updated, hierarchy preserved
    Evidence: .sisyphus/evidence/task-3-contrast.txt
  ```

---

- [x] 4. Fix dark mode contrast in ViolationRow checkbox labels

  **What to do**:
  - In ViolationRow.tsx, find the two `<span className="text-muted-foreground font-semibold text-[10px]">` labels for "Owner" and "Tenant"
  - Change both to `text-foreground font-semibold text-[10px]`
  - These appear inside the custom observation corrective action checkboxes (lines ~586 and ~608)

  **Must NOT do**:
  - Do NOT change the Checkbox component itself
  - Do NOT change other `text-muted-foreground` usages (e.g., helper text, secondary labels)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 1-3)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `ViolationRow.tsx:586-588` — Owner label
  - `ViolationRow.tsx:608-610` — Tenant label

  **Acceptance Criteria**:
  - [ ] Both party labels use `text-foreground`
  - [ ] LSP diagnostics clean

---

- [x] 5. Default Corrective Actions to collapsed

  **What to do**:
  - In `ActionAssignmentPanel.tsx`, change `const [collapsed, setCollapsed] = useState(false);` to `useState(true);`
  - This makes Owner/Management and Tenant panels start collapsed when a violation is first expanded

  **Must NOT do**:
  - Do NOT remove the expand/collapse toggle functionality
  - Do NOT change other state initializations

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 1-4)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `ActionAssignmentPanel.tsx:56` — collapsed state

  **Acceptance Criteria**:
  - [ ] Panels start collapsed (`collapsed` initial state is `true`)
  - [ ] Clicking header or chevron still expands/collapses
  - [ ] LSP diagnostics clean

---

- [x] 6. Add sticky bottom action bar

  **What to do**:
  - In `InspectionFormPage.tsx`, replace the static bottom button row (lines 918-956) with a sticky bottom bar:
  - Wrap the button row in a `<div className="sticky bottom-0 z-40 bg-card/95 backdrop-blur-sm border-t border-border shadow-2xl -mx-3 sm:-mx-6 px-3 sm:px-6 py-3">`
  - Keep the same 3 buttons: Save Draft, Print, Submit
  - Add a spacer div (`<div className="h-16" />`) after the sticky bar so content isn't hidden behind it
  - On mobile, buttons should remain touch-friendly (min 44px height)

  **Must NOT do**:
  - Do NOT change button onClick handlers or disabled states
  - Do NOT remove the existing button styling
  - Do NOT use `fixed` positioning (causes mobile viewport issues)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO — should wait for Tasks 1-5 to avoid merge conflicts in InspectionFormPage.tsx
  - **Blocks**: None
  - **Blocked By**: Tasks 1, 2

  **References**:
  - `InspectionFormPage.tsx:918-956` — current bottom button row
  - `ComplaintDetailView.tsx:882-931` — existing sticky mobile action bar pattern

  **Acceptance Criteria**:
  - [ ] Action bar sticks to bottom of viewport while scrolling
  - [ ] Buttons remain functional (Save, Print, Submit)
  - [ ] No content is hidden behind the bar on mobile
  - [ ] LSP diagnostics clean

  **QA Scenarios**:

  ```
  Scenario: Sticky bar persists during scroll
    Tool: Read file
    Preconditions: File edited
    Steps:
      1. Read bottom button section
      2. Verify container uses "sticky bottom-0" class
      3. Verify spacer div exists after bar
      4. Verify all 3 buttons preserved with correct onClick handlers
    Expected Result: Sticky positioning with preserved functionality
    Evidence: .sisyphus/evidence/task-6-sticky-bar.txt
  ```

---

- [x] 7. Build + test verification

  **What to do**:
  - Run `npm run build`
  - Run `npm run test -- --run`
  - Capture output as evidence

  **Acceptance Criteria**:
  - [ ] `npm run build` exits 0
  - [ ] `npm run test -- --run` shows 33/33 pass

---

- [x] 8. LSP diagnostics verification

  **What to do**:
  - Check `InspectionFormPage.tsx` for errors
  - Check `ActionAssignmentPanel.tsx` for errors
  - Check `ViolationRow.tsx` for errors

  **Acceptance Criteria**:
  - [ ] Zero errors on all 3 files

---

## Final Verification Wave

- [x] F1. **Code Quality Review** — `unspecified-high`
  - Result: APPROVE
  - tsc --noEmit: Passed (no errors)
  - any types: Pre-existing only (not introduced by changes)
  - console.log: None found in modified files
  - No AI slop patterns detected
    Run `tsc --noEmit` + check for `any` types, unused imports, console.log. Verify no AI slop patterns (excessive comments, over-abstraction).

- [x] F2. **Scope Fidelity Check** — `deep`
  - Result: APPROVE
  - Task 1: Demo data populated correctly with inspection_type, areasInspected, summary, globalObservations, violations
  - Task 2: AREA_GROUPS with 4 categories, grouped rendering implemented
  - Task 3: Unselected text uses text-foreground/80, selected uses text-foreground font-medium
  - Task 4: Both Owner and Tenant labels use text-foreground
  - Task 5: collapsed initialized to true
  - Task 6: Sticky bar with correct classes and spacer div
  - No scope creep detected
    Read each task's "What to do" and compare to actual diff. Verify no scope creep.

---

## Commit Strategy

Single commit for all changes:

```
feat(inspection): Improve form UX — demo data, grouped areas, contrast, sticky bar

- Fix Fill Demo Data button: populate with realistic inspection data
- Group Areas Inspected into Exterior/Interior/Common/Other categories
- Improve dark mode contrast: use text-foreground/80 for unselected actions
- Default Corrective Actions panels to collapsed state
- Add sticky bottom action bar for Save/Print/Submit
```

---

## Success Criteria

### Verification Commands

```bash
npm run build          # Expected: exits 0
npm run test -- --run  # Expected: 33 pass
```

### Final Checklist

- [ ] Fill Demo Data button populates all key fields
- [ ] Areas Inspected grouped by category
- [ ] Dark mode contrast meets WCAG AA
- [ ] Corrective Actions default collapsed
- [ ] Sticky action bar functional
- [ ] All tests pass
- [ ] LSP clean
