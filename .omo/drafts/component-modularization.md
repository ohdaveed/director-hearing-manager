# Draft: Component Modularization & Efficiency

## Requirements (confirmed)

- Modularize UI components for reuse and efficiency.
- Follow shadcn/ui principles and composition patterns.
- Exclude components imported by other packages or deeply ingrained in app logic (complex state machines/page-level).

## Technical Decisions

- Use shadcn/ui CLI to add base components (Card, Collapsible, etc.).
- Move generic UI components to `src/components/ui/`.
- Use `class-variance-authority` (cva) for variants.
- Use `cn()` utility for conditional classes.
- Extract sub-sections from large components like `NarrativeSection`.

## Research Findings

- `StatCard.tsx` is a prime candidate for `ui/` with `Card` composition.
- `MetricBar.tsx` can be refactored to `MetricProgress` using shadcn `Progress`.
- `CollapsibleSection.tsx` should use Radix-based `Collapsible`.
- `NarrativeSection.tsx` is too large and should be split into `SummaryField`, `ObservationsList`, and `CorrectiveActionsForm`.

## Scope Boundaries

- INCLUDE: `StatCard`, `MetricBar`, `CollapsibleSection`, `SectionHeader`, `NarrativeSection` sub-components.
- EXCLUDE: `ChronologyEditorTab`, `InspectionImportWizard`, `DraftPacketAnalysisPage` (deeply ingrained/page-level).
- EXCLUDE: Components from `@radix-ui` or other external libraries imported directly in `App.tsx`.

## Open Questions

- Should `NarrativeSection` sub-components stay in `src/components/` or a new sub-folder? (Decision: Use `src/components/narrative/` for its sub-components).
