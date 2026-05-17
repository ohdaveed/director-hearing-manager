# Draft: Hearing Details Page Refactor

## Requirements (confirmed)

- Comprehensive overhaul of the Hearing Details / Hearing Packets page
- UI/UX improvements
- Performance optimization
- Code refactoring

## Target

- `src/pages/HearingPacketsPage.tsx` (1593 lines)
- Related: `src/services/packetService.ts`

## Key Issues Identified

1. **Monolithic File**: 1593 lines, 4 components (`HearingPacketsPage`, `PacketDetail`, `PreparationChecklist`, `NoticeOfHearingPrint`) + helper functions
2. **Type Safety**: `Packet` is typed as `any`; `(packet as any).complaint` used repeatedly
3. **Performance Anti-Patterns**: `useEffect` syncing 8+ state values from `packet` prop; no memoization on list items
4. **UI/UX Debt**: Inline print `<style>` tags, deeply nested JSX, `max-h-[calc(100vh-320px)]` hardcoded scroll areas
5. **Code Organization**: Business logic (status transitions, checklist toggling) mixed with presentation

## Test Infrastructure

- Vitest configured in `vite.config.ts` with jsdom + globals
- Existing tests: `src/services/__tests__/*.test.ts`, `src/components/packet/__tests__/*.test.tsx`
- **No tests exist for `HearingPacketsPage` or `packetService`**

## Technical Decisions

- **Test strategy**: Tests AFTER refactor (option 2) — refactor first, add tests to extracted components after
- **Agent-Executed QA**: Mandatory for ALL tasks regardless of test choice
- **Component extraction target**: `src/components/packet/` (existing pattern) or `src/components/hearing/` (new directory)

## Scope Boundaries

- INCLUDE: `HearingPacketsPage.tsx` decomposition, `PacketDetail` extraction, `PreparationChecklist` extraction, performance fixes, type safety, tests for extracted components
- EXCLUDE: Changes to packet document components (`src/components/packet/PacketNoticeOfHearing.tsx`, etc.), changes to `packetService.ts` API surface (only types), database schema changes

## Open Questions

- Should extracted components go in `src/components/packet/` or `src/components/hearing/`?
