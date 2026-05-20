# Implementation Plan: Refactor Dashboard Widgets (Comprehensive)

## Objective

Refactor dashboard components to replace raw `div` layout containers with appropriate `shadcn/ui` components (Card, Separator, Accordion, etc.), ensuring design-system consistency and improved semantics.

## Affected Components

- `UpcomingHearingsPanel.tsx`
- `InspectorWorkloadWidget.tsx`
- `MonthlyIntakeWidget.tsx`
- `StatusDistributionWidget.tsx`
- `TopCategoriesWidget.tsx`

## Refactoring Guidelines

- **Use Semantic Components**: Instead of just `Card`, evaluate if `Tabs`, `Accordion`, or `Collapsible` components provide a better user experience for content-heavy or interactive widgets.
- **Improve Spacing**: Leverage `shadcn`'s standard spacing patterns (e.g., `flex`, `gap-*`, `CardContent` padding) instead of manual `p-*`, `m-*` or `space-y-*` classes.
- **Enhance Visual Hierarchy**: Use `Separator` for clear content boundaries, and `Skeleton` for loading states.
- **Accessibility**: Ensure that replaced `div` structures (e.g., in interactive widgets) maintain or improve semantic accessibility.

## Implementation Steps

1. For each identified component:
   - Perform a structural analysis.
   - Select the most appropriate semantic component (e.g., `Card` for content blocks, `Tabs` for multi-view widgets, `Accordion` for lists).
   - Refactor layout, applying standard spacing props.
   - Clean up existing manual padding/margin/layout classes.

## Verification

- Visual consistency check across the dashboard.
- Verification of component functionality (e.g., ensuring click states or toggles still work).
- Final build/test check.
