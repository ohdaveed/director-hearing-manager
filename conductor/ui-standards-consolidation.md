# UI Standards and Rule Consolidation Spec

## Background & Motivation

The project currently has overlapping instruction files (`GEMINI.md`, `CLAUDE.md`, `AGENTS.md`) which can confuse AI agents and lead to inconsistent implementations. Additionally, there are several "rogue" UI components that duplicate the functionality of standard shadcn/ui components but live outside the `src/components/ui/` directory.

## Objective

Establish a single source of truth for project rules (`AGENTS.md`) and enforce strict adherence to a centralized, standardized UI component library (`src/components/ui/`).

## Scope

1.  **Documentation Consolidation**: Reduce `GEMINI.md`, `CLAUDE.md`, and `.github/copilot-instructions.md` to simple pointers to `AGENTS.md` and their respective MCP server configurations.
2.  **`AGENTS.md` Enhancement**: Add explicit UI standards mandating the use of `src/components/ui/` primitives and strictly using `lucide-react` icons.
3.  **UI Component Cleanup**:
    - Remove duplicate non-standard components (`src/components/dashboard/SectionHeader.tsx`, `src/components/StatCard.tsx`, `src/components/MetricBar.tsx`).
    - Refactor affected files (e.g., `MonthlyIntakeWidget.tsx`, `QualityChecksPanel.tsx`, `UpcomingHearingsPanel.tsx`) to use the standardized versions in `src/components/ui/`.

## Implementation Steps

### Phase 1: Rule Consolidation

- Overwrite `GEMINI.md` to point to `AGENTS.md` (retaining only MCP configs).
- Overwrite `CLAUDE.md` to point to `AGENTS.md` (retaining only MCP configs).
- Overwrite `.github/copilot-instructions.md` to point to `AGENTS.md`.
- Update `AGENTS.md` to include a clear "UI Conventions" section explicitly prohibiting the creation of custom component wrappers when a shadcn equivalent exists.

### Phase 2: UI Component Migration

- Update `MonthlyIntakeWidget.tsx`, `QualityChecksPanel.tsx`, and `UpcomingHearingsPanel.tsx` to import and use `<SectionHeader />` from `src/components/ui/section-header.tsx`.
- Delete `src/components/dashboard/SectionHeader.tsx`.
- Delete `src/components/StatCard.tsx` (already replaced by `src/components/ui/stat-card.tsx` in pages).
- Delete `src/components/MetricBar.tsx` (if unused) or replace usage with `src/components/ui/metric-progress.tsx`.

### Phase 3: Verification

- Run `npm run lint` and `npm run build` to verify no import errors or typing issues persist.
- Run `npm run test` to ensure existing tests pass.

## Alternatives Considered

- _Keep duplicate components but rename them:_ Rejected, as it perpetuates fragmentation and makes global design updates harder.
- _Move custom components to `ui/`:_ Rejected, as standard versions already exist and the goal is to reduce parallel implementations.
