# Component Modularization Plan

## Objective

Refactor the monolithic `ComplaintEntryPage.tsx` and `InspectionFormPage.tsx` by fully separating state/logic from presentation. This will be achieved by extracting state management into custom hooks and integrating existing but unused modular UI components, reducing file size and improving maintainability without altering existing functionality.

**Crucially, all UI refactoring will strictly adhere to the project's `shadcn/ui` guidelines (e.g., using `FieldGroup`/`Field`, `Card` composition, and semantic classes).**

## Key Files & Context

- **Target Pages:**
  - `src/pages/ComplaintEntryPage.tsx` (1934 lines)
  - `src/pages/InspectionFormPage.tsx` (1135 lines)
- **Extracted Components to Integrate:**
  - `src/components/complaint-form/*` (e.g., `ComplainantSection`, `DetailsSection`)
  - `src/components/narrative/*`
  - `src/components/violation/*`
- **New Hook Files:**
  - `src/hooks/useComplaintForm.ts`
  - `src/hooks/useInspectionForm.ts`

## Implementation Steps

### Phase 1: Custom Hook Extraction

1. **`useComplaintForm`**: Extract the `react-hook-form` setup, `zod` validation schema execution, demo data generation, and API mutations from `ComplaintEntryPage.tsx` into a reusable custom hook.
2. **`useInspectionForm`**: Extract the local state (`FormState`), draft storage logic, auto-violation generation, area group constants, and API mutations from `InspectionFormPage.tsx` into a reusable custom hook.

### Phase 2: Complaint Page Modularization

1. Update `ComplaintEntryPage.tsx` to invoke `useComplaintForm`.
2. Replace inline monolithic form sections with the existing components in `src/components/complaint-form/`.
3. Pass state, handlers, and form control objects down to the modular components via props or a form provider.
4. **shadcn/ui Audit:** Ensure the integrated components utilize `shadcn/ui` properly (e.g., `FieldGroup` for form layouts, no raw divs with `space-y-*`).

### Phase 3: Inspection Page Modularization

1. Update `InspectionFormPage.tsx` to invoke `useInspectionForm`.
2. Replace inline violation and narrative sections with existing components in `src/components/violation/` and `src/components/narrative/`.
3. Wire up photo upload and violation rows to the new hook's state handlers.
4. **shadcn/ui Audit:** Verify proper use of components like `Card`, `Badge`, and `Separator` within the extracted UI blocks.

### Phase 4: Cleanup & Verification

1. Remove all unused inline interfaces, constants, and helper functions from the page files.
2. Verify that `shadcn/ui` components are still used correctly according to project guidelines.

## Verification & Testing

1. **Type Checking:** Ensure `tsc --noEmit` passes after refactoring.
2. **Form Functionality:**
   - Verify Complaint creation, including validation errors and success states.
   - Verify Inspection draft saving, photo uploading, and final submission.
3. **Automated Tests:** Run existing tests (e.g., `InspectionFormPage.test.tsx`) to ensure no regressions. Update test imports if necessary.
