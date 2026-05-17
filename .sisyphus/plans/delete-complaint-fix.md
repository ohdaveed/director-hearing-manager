# Plan: Fix Delete Complaint Workflow

## TL;DR

> **Bug**: Delete complaint button either doesn't appear or fails with permission error.
> **Root Causes**:
>
> 1. Delete button only shows when `viewMode !== "readonly"` (line 825 in ComplaintDetailView.tsx)
> 2. RLS policy requires `assigned_to` = user's email OR Admin/Super Admin/Program Manager role
>    **Fix**: Allow Admin/Super Admin to delete any complaint, and ensure delete button appears for admins

---

## Context

### Current Behavior

**Button Visibility** (ComplaintDetailView.tsx line 825-857):

```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button
      variant="destructive"
      size="sm"
      className="gap-2 w-full mt-4 border-t border-border pt-4"
    >
      <Trash2 className="w-4 h-4" />
      Delete Complaint
    </Button>
  </AlertDialogTrigger>
  ...
</AlertDialog>
```

This is inside `actionsCard` which requires `canEditStatus || actionsSlot` (line 781), where `canEditStatus = viewMode !== "readonly"`.

**RLS Policy** (migrations/001c_rls_policies.sql lines 71-76):

```sql
CREATE POLICY "Assigned staff can update complaints"
  ON complaints FOR UPDATE
  USING (
    assigned_to = (SELECT email FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'Super Admin', 'Program Manager'))
  );
```

### Problem Analysis

1. **Button visibility**: If user is in "readonly" mode, they don't see the delete button
2. **RLS blocking**: If user is not the assigned inspector AND not Admin/Super Admin/Program Manager, the soft delete UPDATE fails with permission error

---

## Work Objectives

### Core Objective

Make delete complaint work for authorized users (Admins/Super Admins should always be able to delete).

### Concrete Deliverables

- Admin/Super Admin can always see and use delete button
- Delete operation succeeds for authorized users
- Proper error message shown for unauthorized attempts

### Definition of Done

- [x] Admin/Super Admin sees delete button on complaint detail
- [x] Admin/Super Admin can successfully delete a complaint
- [x] Non-admin users see appropriate error or no delete button

---

## Verification Strategy

### QA Scenarios

1. **Admin delete**: Login as Admin → Open complaint → Click Delete → Confirm → Complaint deleted
2. **Inspector non-assigned**: Login as Inspector not assigned to complaint → No delete button visible
3. **Inspector assigned**: Login as Inspector assigned to complaint → Delete button visible but may fail due to RLS

---

## Execution Strategy

```
Wave 1 (single task - fix delete workflow):
├── T1: Fix delete button visibility and add Admin delete policy
└── T2: Test delete workflow as admin

Critical Path: T1 → T2
```

---

## TODOs

- [ ] 1. **Fix delete complaint visibility and permissions** — `quick`

  **What to do**:
  1. **ComplaintDetailView.tsx**: Ensure delete button is visible for Admin/Super Admin regardless of viewMode

  2. **RLS Policy**: Add a DELETE policy that allows Admin/Super Admin to delete:

  ```sql
  CREATE POLICY "Admins can delete complaints"
    ON complaints FOR DELETE
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'Super Admin')));
  ```

  3. **Error handling**: Ensure the onError in deleteMutation shows a meaningful toast message

  **Must NOT do**:
  - Don't make delete available to all inspectors (only admins)
  - Don't change other complaint operations

  **Recommended Agent Profile**:

  > **Category**: `quick` — Simple permission fix
  > **Skills**: `supabase` (for RLS policies), `supabase-postgres-best-practices`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: T2

  **References**:
  - `src/components/ComplaintDetailView.tsx:240-250` — deleteMutation
  - `src/components/ComplaintDetailView.tsx:781-857` — actionsCard with delete button
  - `migrations/001c_rls_policies.sql:71-76` — UPDATE policy

  **Acceptance Criteria**:
  - [ ] Admin/Super Admin can see and use delete button
  - [ ] Delete succeeds for Admin/Super Admin
  - [ ] Non-admins see appropriate behavior (no button or error)

  **QA Scenarios**:

  \`\`\`
  Scenario: Admin can delete complaint
  Tool: Browser + Supabase
  Preconditions: Logged in as Admin
  Steps: 1. Navigate to /complaints and select a complaint 2. Look for delete button in the Actions card 3. Click Delete Complaint 4. Confirm in dialog 5. Check if redirected to /complaints 6. Verify complaint has deleted_at set in database
  Expected Result: Complaint soft-deleted (deleted_at timestamp set)
  Failure Indicators: Button not visible, or delete fails with error
  Evidence: .sisyphus/evidence/delete-complaint-admin.png

  Scenario: Non-admin cannot delete
  Tool: Browser
  Preconditions: Logged in as Inspector (not admin)
  Steps: 1. Navigate to /complaints and select a complaint 2. Check if Delete button is visible in Actions
  Expected Result: Delete button NOT visible (or if visible, delete fails with permission error)
  Failure Indicators: Button visible and delete succeeds for non-admin
  Evidence: .sisyphus/evidence/delete-complaint-nonadmin.png
  \`\`\`

  **Commit**: YES
  - Message: `fix(complaint): ensure Admin/Super Admin can delete complaints`
  - Files: `src/components/ComplaintDetailView.tsx`, migration for RLS policy
  - Pre-commit: `npm run lint -- src/components/ComplaintDetailView.tsx`

---

- [ ] 2. **Test delete workflow** — `unspecified-high`

  **What to do**:
  - Test as Admin user: should see delete button and successfully delete
  - Test as Inspector: should not see delete button (or see it but fail with proper error)

  **Commit**: NO (QA only)

---

## Success Criteria

- Admin/Super Admin can delete complaints
- Non-admin users cannot delete (RLS blocks or button not shown)
- No console errors on delete attempt
