# Baseline Errors Fix Plan

## Objective

Resolve all ~356 lint and type-checking baseline errors in the project to ensure `vp lint` and `vp build` (type-check) pass cleanly, adhering to the quality gates defined in `AGENTS.md`.

## Key Files & Context

- **Configurations**: `eslint.config.js`
- **Restricted Imports**: `src/main.tsx`, `src/pages/ComplaintEntryPage.tsx`
- **React Refresh Warnings**: `src/pages/ProfilePage.tsx`
- **Effect State Updates**: `src/components/ChronologyEditorTab.tsx`, `src/hooks/usePacketReviewStatus.ts`, `src/pages/EscalationQueuePage.tsx`, `src/pages/ProfilePage.tsx`
- **Type Violations (`any`)**: Widespread across `src/pages/`, `src/services/`, `src/components/`, `src/utils/`, and `src/types/`.

## Implementation Steps

### Phase 1: Configuration & Structural Fixes

1. **ESLint Configuration**: Update `eslint.config.js` to add `"supabase/functions/**"` and `"tailwind.config.ts"` to the `ignores` array, resolving `parserOptions.project` errors.
2. **Restricted Imports**: Change default React imports (`import React from "react"`) to named imports (e.g., `import { useState } from "react"`) in `src/main.tsx` and `src/pages/ComplaintEntryPage.tsx`.
3. **React Refresh**: Extract `SIGNATURE_STYLES`, `SignatureStyleKey`, and `getSignatureFont` from `src/pages/ProfilePage.tsx` into a new file `src/constants/signatureStyles.ts` and update imports.

### Phase 2: React Query Refactoring

Refactor the following components to use `@tanstack/react-query` instead of manual `useEffect` + `setState` data fetching, resolving the `react-hooks/set-state-in-effect` errors:

1. **ChronologyEditorTab.tsx**: Replace the manual `load` function and `useEffect` with `useQuery` for fetching chronology data. Initialize local draft state using the query data during render.
2. **EscalationQueuePage.tsx**: Refactor `setHearingStatus` and related state syncing in `useEffect` by deriving state during render or leveraging React Query cache.
3. **ProfilePage.tsx**: Update signature state initialization to derive from the `user` context directly during render, eliminating the sync `useEffect`.
4. **usePacketReviewStatus.ts**: Refactor polling logic to use React Query's `refetchInterval` instead of manual interval and state setting in `useEffect`.

### Phase 3: Automated 'Any' Type Replacement

1. **Scripted Replacement**: Create and run a Node.js script to automatically find and replace all instances of `: any` with `: unknown` across all `.ts` and `.tsx` files in the `src/` directory.
2. **TypeScript Compilation Fixes**: Run `tsc --noEmit` and manually fix the resulting compilation errors where `unknown` cannot be implicitly cast. Focus on replacing `unknown` with specific types (e.g., interfaces from `src/types/`) or `Record<string, unknown>` where applicable.

## Verification & Testing

- Run `npm run lint` and verify exactly 0 warnings and errors.
- Run `npm run build` (which includes `tsc`) to ensure all types compile successfully.
- Run `npm run test` to verify no regressions in business logic.
