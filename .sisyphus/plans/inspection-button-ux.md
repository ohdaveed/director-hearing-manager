# Plan: Inspection Start Button UX Improvements

## TL;DR

> **Enhancement**: Improve the "Start Inspection" button UX on the Complaint Detail page (Fitts's Law, Hick's Law, Jakob's Law).
> **Changes**:
>
> 1. Place button prominently in upper-right area aligned with address heading
> 2. Disable button until location is linked AND inspector is assigned, with tooltip explanation
> 3. Pass complaint context (address, tenant notes) to inspection form via route state

---

## Context

### Current Implementation (`ComplaintDetailView.tsx`)

**Button Placement** (lines 903-918):

```tsx
{
  canStartInspection && (
    <Button onClick={handleStartInspection} className="gap-2 flex-shrink-0">
      {hasDraft ? <FileEdit /> : <FilePlus />} Start Inspection
    </Button>
  );
}
```

Currently positioned in header row alongside complaint info.

**Disabled Logic** (line 302):

```ts
const canStartInspection = viewMode === "inspector";
```

Only checks role — doesn't check location link or inspector assignment status.

**Navigation** (line 277):

```ts
const handleStartInspection = () => navigate(`/inspections/${complaint.id}`);
```

Only passes complaint ID — no context data forwarded.

### UX Principles to Apply

1. **Fitts's Law**: Large target in predictable location (upper-right quadrant)
2. **Hick's Law**: Minimize choices when action is impossible (disabled state with clear tooltip)
3. **Jakob's Law**: Seamless transitions with context preservation

---

## Work Objectives

### Core Objective

Make the "Start Inspection" action intuitive, discoverable, and seamless.

### Concrete Deliverables

1. Button repositioned to prominent upper-right position with larger touch target
2. Button disabled with tooltip until location linked AND inspector assigned
3. Inspection form pre-populated with complaint context (address, description)

### Definition of Done

- [ ] Button visible and prominent in upper-right of complaint header
- [ ] Button disabled with tooltip when location not linked
- [ ] Button disabled with tooltip when no inspector assigned
- [ ] Clicking navigates to inspection form with address pre-filled

---

## Verification Strategy

### QA Scenarios

**Scenario 1: Button visible and prominent (Fitts's Law)**

1. Open complaint detail page
2. Look for "Start Inspection" button in upper-right area
3. Verify it's a large, easily clickable target
4. **Pass**: Button is in upper-right, large enough, easily found

**Scenario 2: Disabled state with tooltip (Hick's Law)**

1. Open complaint with no location linked
2. Hover over disabled "Start Inspection" button
3. **Pass**: Tooltip shows "Please link a location and assign an inspector..."
4. Link a location but no inspector assigned
5. **Pass**: Button still disabled, tooltip updates to "Please assign an inspector..."
6. Assign an inspector
7. **Pass**: Button enabled

**Scenario 3: Context preservation (Jakob's Law)**

1. Open complaint with address "123 Main St" and description
2. Click "Start Inspection"
3. **Pass**: Inspection form opens with address "123 Main St" pre-filled
4. **Pass**: Description or notes visible in form

---

## Execution Strategy

```
Wave 1 (Single task - UX changes to ComplaintDetailView):
├── T1: Implement UX improvements in ComplaintDetailView.tsx
└── T2: Test workflow in browser

Critical Path: T1 → T2
Parallel Execution: NO
Max Concurrent: 1
```

---

## TODOs

- [ ] 1. **Implement UX improvements in ComplaintDetailView.tsx** — `visual-engineering`

  **What to do**:
  1. **Button Position** (lines 903-918):
     - Keep button in upper-right of the header card
     - Make button larger with more padding
     - Use high-contrast solid fill color (primary blue)
     - Align horizontally with the address heading

  2. **Disabled State Logic** (around line 302):

     ```ts
     const canStartInspection =
       viewMode === "inspector" &&
       !!complaint.locationid &&
       !!complaint.assigned_to;
     const inspectionTooltip = !complaint.locationid
       ? "Please link a location to start an inspection"
       : !complaint.assigned_to
         ? "Please assign an inspector to start an inspection"
         : "";
     ```

  3. **Tooltip on Disabled Button**:
     - Add `title` attribute or use a tooltip component
     - When disabled, show explanation of what's missing

  4. **Navigation with Context** (line 277):

     ```ts
     const handleStartInspection = () =>
       navigate(`/inspections/${complaint.id}`, {
         state: {
           address: complaint.address,
           description: detail?.description,
           complaintId: complaint.id,
         },
       });
     ```

  5. **InspectionFormPage updates** (src/pages/InspectionFormPage.tsx):
     - Read `location.state` to pre-populate form fields if passed
     - Use `useLocation` hook to get passed state
     - Pre-fill address field if passed via state

  **Must NOT do**:
  - Don't change the inspection save logic (already fixed)
  - Don't modify other pages unnecessarily
  - Don't add excessive animations or complexity

  **Recommended Agent Profile**:

  > **Category**: `visual-engineering` — UI/UX changes to existing component
  > **Skills**: `impeccable` (for design quality), `tailwind-design-system` (for consistent styling)
  > **Reason**: This is primarily a UI positioning and state management change

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1
  - **Blocks**: T2 (QA testing)
  - **Blocked By**: None

  **References**:
  - `src/components/ComplaintDetailView.tsx:903-918` — Current button placement
  - `src/components/ComplaintDetailView.tsx:302` — canStartInspection logic
  - `src/pages/InspectionFormPage.tsx:260-332` — Form load and state initialization
  - `src/types/complaint.ts:11-27` — ComplaintSummary type

  **Acceptance Criteria**:
  - [ ] Button is in upper-right of complaint header, large and prominent
  - [ ] Button disabled when no location linked, shows tooltip on hover
  - [ ] Button disabled when no inspector assigned, shows tooltip on hover
  - [ ] Button enabled only when both location linked AND inspector assigned
  - [ ] Clicking navigates to inspection form with address pre-filled

  **QA Scenarios**:

  \`\`\`
  Scenario: Button placement verification
  Tool: Browser
  Preconditions: Dev server running, logged in as inspector
  Steps: 1. Navigate to /complaints and select a complaint 2. Look at the complaint detail header area 3. Find the "Start Inspection" button 4. Visually assess its position and size
  Expected Result: Button is in upper-right area, aligned with address, large enough to be easily clickable
  Failure Indicators: Button is hidden, too small, or in unexpected location
  Evidence: .sisyphus/evidence/inspection-button-placement.png

  Scenario: Disabled button with no location
  Tool: Browser + Playwright
  Preconditions: Complaint with no location linked
  Steps: 1. Open complaint detail 2. Find "Start Inspection" button 3. Hover over button 4. Check if button is disabled and has tooltip
  Expected Result: Button is grayed out, shows tooltip "Please link a location to start an inspection"
  Failure Indicators: Button is enabled, or no tooltip shown
  Evidence: .sisyphus/evidence/inspection-button-disabled-location.png

  Scenario: Disabled button with location but no inspector
  Tool: Browser + Playwright
  Preconditions: Complaint with location linked but no inspector assigned
  Steps: 1. Link a location to the complaint 2. Refresh page 3. Find "Start Inspection" button 4. Hover over button
  Expected Result: Button is grayed out, shows tooltip "Please assign an inspector to start an inspection"
  Failure Indicators: Button is enabled, or tooltip still mentions location
  Evidence: .sisyphus/evidence/inspection-button-disabled-inspector.png

  Scenario: Enabled button with context
  Tool: Browser
  Preconditions: Complaint with location linked and inspector assigned
  Steps: 1. Ensure location is linked and inspector is assigned 2. Open complaint detail 3. Click "Start Inspection" 4. Verify inspection form opens 5. Check if address field is pre-filled
  Expected Result: Button enabled, clicking opens form with address pre-filled
  Failure Indicators: Button still disabled, or address not pre-filled
  Evidence: .sisyphus/evidence/inspection-button-enabled-context.png
  \`\`\`

  **Commit**: YES
  - Message: `feat(inspection-ui): improve Start Inspection button UX - placement, disabled states, tooltip, context preservation`
  - Files: `src/components/ComplaintDetailView.tsx`, `src/pages/InspectionFormPage.tsx`
  - Pre-commit: `npm run lint -- src/components/ComplaintDetailView.tsx src/pages/InspectionFormPage.tsx`

---

- [ ] 2. **QA Testing - verify all scenarios pass** — `unspecified-high`

  **What to do**:
  - Start dev server: `npm run dev`
  - Open browser to http://localhost:5173
  - Test all 4 scenarios from T1 acceptance criteria
  - Verify button placement, disabled states, tooltips, and context preservation

  **Must NOT do**:
  - Don't skip any of the 4 scenarios

  **Recommended Agent Profile**:

  > **Category**: `unspecified-high` — Hands-on browser testing
  > **Skills**: `webapp-testing` (Playwright for verification)

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (final task)
  - **Blocks**: None
  - **Blocked By**: T1

  **References**:
  - T1 acceptance criteria for all expected behaviors

  **Acceptance Criteria**:
  - [ ] All 4 scenarios from T1 QA pass

  **Commit**: NO (QA only)

---

## Final Verification Wave

- [ ] F1. **Code Quality Review** — `unspecified-high`
      Run `npm run lint` and `npm run build`. Review changed files for proper disabled state handling and tooltip display.
      Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | VERDICT`

---

## Success Criteria

### Verification Commands

```bash
npm run lint -- src/components/ComplaintDetailView.tsx src/pages/InspectionFormPage.tsx  # Expected: 0 errors
npm run build  # Expected: PASS
```

### Final Checklist

- [ ] Button prominent in upper-right, aligned with address heading
- [ ] Button disabled when no location linked (with tooltip)
- [ ] Button disabled when no inspector assigned (with tooltip)
- [ ] Button enabled only when both conditions met
- [ ] Clicking navigates to form with address pre-filled
