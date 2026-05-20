# Design Doc: Complaint View shadcn Migration

## Goal

Migrate `ComplaintDetailView.tsx` and `ComplaintChronologyPanel.tsx` to fully utilize `shadcn/ui` components and adhere to `shadcn` styling principles (layout, spacing, components).

## Context

Recent work has already migrated several sections of the `ComplaintDetailView` to `shadcn` Cards and Badges. This design completes the migration by addressing remaining raw HTML elements, custom spacing, and missing standard components.

## Architecture & Components

### 1. Component Installation

Install the following missing `shadcn/ui` components:

- `alert`
- `table`

### 2. ComplaintDetailView.tsx Migration

- **Description Section**: Refactor `DescriptionText` to use `Collapsible`.
- **InfoRow**: Continue using the current pattern but ensure spacing is `gap`-based.
- **Location Section**:
  - Replace the "No location linked" raw `div` with the `Alert` component (`variant="warning"` if available, or default with warning styling).
  - Ensure search results and skeleton loading states use consistent `shadcn` spacing (`gap-*`).
- **Responsible Party Section**:
  - Replace raw `label` elements with the `Label` component.
  - Refactor form layout to use `flex flex-col gap-3` instead of `space-y-3`.
- **Inspection History**:
  - Use the "Card-based pattern" for the empty state.
- **Actions Card**:
  - Replace the blocking violations warning `div` with `Alert` (`variant="destructive"`).
  - Fix spacing to use `gap-*`.

### 3. ComplaintChronologyPanel.tsx Migration

- **Table**: Replace the raw HTML `table` with `shadcn` `Table` components:
  - `Table`
  - `TableHeader`
  - `TableBody`
  - `TableRow`
  - `TableHead`
  - `TableCell`
- **Spacing**: Ensure all container spacing is `gap`-based.
- **Empty State**: Refine the card-based empty state to be consistent with `ComplaintDetailView`.

## Styling & Layout

- **No `space-x-*` or `space-y-*`**: Use `flex gap-*` or `grid gap-*`.
- **Semantic Colors**: Use `bg-background`, `text-muted-foreground`, etc.
- **Consistent Icons**: Ensure all icons in buttons use `data-icon` and no manual sizing if possible (per `shadcn` icon rules, though some existing code uses `w-4 h-4`).

## Testing Strategy

- **Visual Verification**: Manually verify the UI layout and responsiveness.
- **Functionality**: Ensure the "Show more/less" toggle (now `Collapsible`), location search, and status updates still function correctly.
- **No Regressions**: Verify that the delete confirmation dialog and other existing `shadcn` components continue to work.

## Success Criteria

- No raw `table` or `label` elements in the targeted files.
- No `space-y-*` or `space-x-*` classes.
- Full use of `Alert` for warnings.
- Passing build and lint checks.
