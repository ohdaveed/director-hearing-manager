# Plan: Component Modularization & UI Efficiency

## TL;DR

> **Quick Summary**: Refactor and modularize key UI components in the Director Hearing Manager app to follow shadcn/ui principles, improve efficiency, and enhance reuse.
>
> **Deliverables**:
>
> - Refactored `StatCard`, `MetricProgress`, `CollapsibleSection` in `src/components/ui/`.
> - Modularized `NarrativeSection` sub-components in `src/components/narrative/`.
> - Generic `SectionHeader` in `src/components/ui/`.
>
> **Estimated Effort**: Short
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Base components -> Refactored UI -> Modularized Logic

---

## Context

### Original Request

Ensure components are modular and efficient except for components being imported by other packages or deeply ingrained in app logic.

### Interview Summary

**Key Discussions**:

- Identified candidates: `StatCard`, `MetricBar`, `CollapsibleSection`, `SectionHeader`, `NarrativeSection`.
- Exclusions: Page-level components and complex state machines.

### Metis Review (Self-Clearance)

**Identified Gaps** (addressed):

- Need to ensure `shadcn` CLI is used to add base primitives.
- Need to maintain existing animations from `framer-motion` while using Radix primitives where beneficial.

---

## Work Objectives

### Core Objective

Transform custom UI components into modular, composable shadcn-style components located in `src/components/ui/` or specialized sub-directories.

### Concrete Deliverables

- `src/components/ui/stat-card.tsx`
- `src/components/ui/metric-progress.tsx`
- `src/components/ui/collapsible-section.tsx`
- `src/components/ui/section-header.tsx`
- `src/components/narrative/` directory with modularized narrative parts.

### Definition of Done

- [ ] Components moved/refactored and verified in dashboard and inspection flows.
- [ ] No regression in layout or existing functionality.
- [ ] Typescript errors resolved in affected files.

---

## Verification Strategy

### QA Policy

Every task includes agent-executed QA scenarios using Playwright or manual checks via screenshots.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately - base primitives + simple UI):
├── Task 1: Add card, progress, collapsible via shadcn CLI [quick]
├── Task 2: Implement src/components/ui/stat-card.tsx [quick]
└── Task 3: Implement src/components/ui/metric-progress.tsx [quick]

Wave 2 (After Wave 1 - refactoring and moving):
├── Task 4: Refactor CollapsibleSection using ui/collapsible [quick]
├── Task 5: Move SectionHeader to ui/ and generalize [quick]
└── Task 6: Update DashboardPage to use new ui/ components [quick]

Wave 3 (After Wave 2 - narrative modularization):
├── Task 7: Extract SummaryField from NarrativeSection [quick]
├── Task 8: Extract ObservationsList from NarrativeSection [unspecified-high]
└── Task 9: Extract CorrectiveActionsForm from NarrativeSection [unspecified-high]

Wave FINAL (After ALL tasks — 4 parallel reviews):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Manual QA - Visual check (unspecified-high)
└── Task F4: Scope fidelity check (deep)
```

---\n\n## TODOs\n\n- [ ] 1. Add shadcn primitives\n\n **What to do**:\n - Run `npx shadcn@latest add card progress collapsible`.\n - Ensure `src/components/ui/` contains the new components.\n\n **Recommended Agent Profile**:\n - **Category**: `quick`\n - **Skills**: [`shadcn`]\n\n **Acceptance Criteria**:\n - [ ] `src/components/ui/card.tsx` exists.\n - [ ] `src/components/ui/progress.tsx` exists.\n - [ ] `src/components/ui/collapsible.tsx` exists.\n\n- [ ] 2. Implement stat-card.tsx\n\n **What to do**:\n - Create `src/components/ui/stat-card.tsx` following shadcn composition patterns.\n - Port logic from `src/components/StatCard.tsx` but use `Card` and `CardContent` internally.\n - Use `cva` for accent variants (red, yellow, green, blue, purple).\n\n **Recommended Agent Profile**:\n - **Category**: `visual-engineering`\n - **Skills**: [`shadcn`]\n\n **Acceptance Criteria**:\n - [ ] `src/components/ui/stat-card.tsx` exports `StatCard` and `StatCardProps`.\n - [ ] Supports `accent`, `icon`, `to`, `onClick` props.\n\n- [ ] 3. Implement metric-progress.tsx\n\n **What to do**:\n - Create `src/components/ui/metric-progress.tsx` wrapping the shadcn `Progress` primitive.\n - Include label and value display logic from `src/components/MetricBar.tsx`.\n - Use `cva` for accent colors.\n\n **Recommended Agent Profile**:\n - **Category**: `visual-engineering`\n - **Skills**: [`shadcn`]\n\n **Acceptance Criteria**:\n - [ ] `src/components/ui/metric-progress.tsx` exists.\n - [ ] Replaces `MetricBar` functionality with better modularity.\n\n- [ ] 4. Refactor CollapsibleSection\n\n **What to do**:\n - Refactor `src/components/CollapsibleSection.tsx` (or move to `ui/collapsible-section.tsx`) to use the Radix-based `Collapsible` primitive from `ui/collapsible.tsx`.\n - Maintain `framer-motion` for the height animation if requested, or use CSS transitions for better efficiency.\n\n **Recommended Agent Profile**:\n - **Category**: `visual-engineering`\n - **Skills**: [`shadcn`]\n\n **Acceptance Criteria**:\n - [ ] Works identically but uses standard primitives.\n - [ ] Accessibility (ARIA attributes) verified.\n\n- [ ] 5. Move SectionHeader to ui/\n\n **What to do**:\n - Move `src/components/dashboard/SectionHeader.tsx` to `src/components/ui/section-header.tsx`.\n - Generalize the component so it can be used outside of dashboards.\n\n **Recommended Agent Profile**:\n - **Category**: `quick`\n\n **Acceptance Criteria**:\n - [ ] `src/components/ui/section-header.tsx` exists.\n - [ ] All imports updated.\n\n- [ ] 6. Update DashboardPage imports\n\n **What to do**:\n - Update `src/pages/DashboardPage.tsx` and `src/pages/InspectorDashboardPage.tsx` to use the new modular components from `@/components/ui/`.\n\n **Recommended Agent Profile**:\n - **Category**: `quick`\n\n- [ ] 7. Modularize NarrativeSection\n\n **What to do**:\n - Create `src/components/narrative/` directory.\n - Extract `SummaryField`, `ObservationsList`, and `CorrectiveActionsForm` from `src/components/NarrativeSection.tsx` into separate files.\n - Ensure `NarrativeSection.tsx` just composes these new parts.\n\n **Recommended Agent Profile**:\n - **Category**: `unspecified-high`\n - **Skills**: [`shadcn`]\n\n **Acceptance Criteria**:\n - [ ] `NarrativeSection.tsx` is reduced in size by at least 60%.\n - [ ] Prop drilling is minimized using shared types or context where appropriate.\n\n---\n\n## Final Verification Wave
...

## Commit Strategy

- **1**: `feat(ui): add shadcn primitives and move stat-card`
- **2**: `refactor(ui): update metrics and collapsible components`
- **3**: `refactor(narrative): modularize narrative section`

## Success Criteria

### Final Checklist

- [ ] Components are modular and reusable.
- [ ] Visual regression check passed.
- [ ] Build and Lint clean.
