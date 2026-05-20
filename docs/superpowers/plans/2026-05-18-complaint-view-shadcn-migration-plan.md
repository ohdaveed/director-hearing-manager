# Complaint View shadcn Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the migration of `ComplaintDetailView.tsx` and `ComplaintChronologyPanel.tsx` to `shadcn/ui` components and standards.

**Architecture:** Install missing `alert` and `table` components. Refactor existing views to use `Alert`, `Table`, `Label`, and `Collapsible` components, replacing raw HTML and fixing spacing to use `gap`-based layout.

**Tech Stack:** React, Tailwind CSS, shadcn/ui, Lucide Icons.

---

### Task 1: Install Missing shadcn Components

**Files:**

- Create: `src/components/ui/alert.tsx`
- Create: `src/components/ui/table.tsx`

- [ ] **Step 1: Install alert component**

Run: `npx shadcn@latest add alert`

- [ ] **Step 2: Install table component**

Run: `npx shadcn@latest add table`

- [ ] **Step 3: Verify installation**

Run: `ls src/components/ui/alert.tsx src/components/ui/table.tsx`
Expected: Both files exist.

---

### Task 2: Migrate Description Section to Collapsible

**Files:**

- Modify: `src/components/ComplaintDetailView.tsx`

- [ ] **Step 1: Update imports**

```tsx
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
```

- [ ] **Step 2: Refactor DescriptionText component**

Replace the current `DescriptionText` component with one using `Collapsible`. Use the `isLong` logic to determine if the trigger should be shown.

- [ ] **Step 3: Verify visual behavior**

Ensure the "Show more/less" functionality still works as expected.

---

### Task 3: Migrate Location Section to Alert and Label

**Files:**

- Modify: `src/components/ComplaintDetailView.tsx`

- [ ] **Step 1: Update imports**

```tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
```

- [ ] **Step 2: Replace "No location linked" warning**

Replace the raw `div` with `Alert`. Use `variant="warning"` if available, otherwise style it consistently.

- [ ] **Step 3: Fix spacing in Location section**

Replace `space-y-*` with `flex flex-col gap-*`.

---

### Task 4: Migrate Responsible Party Section to Label and Fix Spacing

**Files:**

- Modify: `src/components/ComplaintDetailView.tsx`

- [ ] **Step 1: Replace raw labels**

Replace `<label>` with `<Label>` in the edit form.

- [ ] **Step 2: Fix spacing**

Replace `space-y-3` with `flex flex-col gap-3`.

---

### Task 5: Migrate Actions Card to Alert and Fix Spacing

**Files:**

- Modify: `src/components/ComplaintDetailView.tsx`

- [ ] **Step 1: Replace blocking violations warning**

Replace the raw `div` with `Alert variant="destructive"`. Use `AlertTitle` and `AlertDescription`.

- [ ] **Step 2: Fix spacing**

Replace `space-y-5` and `space-y-2` with appropriate `gap` classes.

---

### Task 6: Migrate ComplaintChronologyPanel to shadcn Table

**Files:**

- Modify: `src/components/ComplaintChronologyPanel.tsx`

- [ ] **Step 1: Update imports**

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
```

- [ ] **Step 2: Replace raw table**

Replace `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` with their `shadcn` equivalents.

- [ ] **Step 3: Fix spacing**

Ensure the container and cell spacing follows `shadcn` standards.

- [ ] **Step 4: Verify layout**

Ensure the table remains responsive and looks correct on mobile.

---

### Task 7: Final Cleanup and Verification

**Files:**

- Modify: `src/components/ComplaintDetailView.tsx`
- Modify: `src/components/ComplaintChronologyPanel.tsx`

- [ ] **Step 1: Check for remaining space-y/space-x**

Run: `grep -E "space-y-|space-x-" src/components/ComplaintDetailView.tsx src/components/ComplaintChronologyPanel.tsx`
Expected: No matches (or only those that are intentional/unavoidable).

- [ ] **Step 2: Verify lint and build**

Run: `npm run lint && npm run build`
Expected: No errors related to the changes.
