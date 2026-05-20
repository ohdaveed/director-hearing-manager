# Workflow Efficiency Optimization

## TL;DR

> **Quick Summary**: Optimize the Director's Hearing Manager app by auto-linking complaint addresses to existing locations, adding arrow-based keyboard navigation across the tri-panel layout, and improving information density to reduce scrolling and mouse dependency.
>
> **Deliverables**:
>
> - Auto-link hook that queries locations on complaint load and links exact matches
> - Suggestion chip UI for near-match addresses
> - Global keyboard navigation system (↑/↓ for list, Tab for panels, / for search, Enter to activate)
> - Keyboard shortcut hints integrated into the UI
> - Layout improvements: expandable description default, denser panel headers, reduced vertical scrolling
>
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 → Task 4 → Task 7 → Final Verification

---

## Context

### Original Request

Workflow efficiency evaluation identified three friction points: manual address duplication, high mouse dependency, and fragmented data layouts. Optimization needed via automated lookup, hotkey bindings, and macro-driven UI controls.

### Interview Summary

**Key Discussions**:

- Priority order: Auto-link → Hotkeys → Layout (auto-link has highest ROI at ~12-18s saved per complaint)
- Auto-link threshold: Exact match only (case-insensitive, trimmed). Near-matches show a suggestion chip.
- Hotkey scheme: Arrow-based (↑/↓ cycle items, Tab between panels, Enter to activate, / for search focus)
- Test strategy: Tests after implementation (not TDD)
- Scope exclusion: No database schema changes

**Research Findings**:

- `locationService.search()` queries Supabase `locations` table via `ilike` on address and location_id — NOT an external API
- `ComplaintDetailView.tsx` (923 lines) has the "Search and link a location" UI at lines 340-389
- `handleLinkLocation()` calls `linkLocationMutation.mutate(locationId)` — existing mutation infrastructure
- No global keyboard shortcut system exists — only `onKeyDown` for Enter in `ComplaintListItem`
- `ActionAssignmentPanel` has an `expandTrigger` prop pattern for Alt+1/Alt+2
- `DescriptionText` component handles truncation with "Show more"

### Guardrails Applied

- **No database schema changes**: All features are application-layer only
- **Existing Supabase table only**: No new APIs, no external services
- **Arrow-based hotkeys**: Not vim-style, for accessibility
- **Exact match only for auto-link**: Fuzzy matches shown as suggestions, never auto-linked

---

## Work Objectives

### Core Objective

Reduce per-complaint processing time by eliminating redundant address entry, enabling keyboard-driven navigation, and improving information density in the detail view.

### Concrete Deliverables

- `src/hooks/useAutoLinkLocation.ts` — Custom hook for auto-linking logic
- `src/hooks/useKeyboardNavigation.ts` — Custom hook for global keyboard shortcuts
- `src/components/LocationSuggestionChip.tsx` — Suggestion chip for near-match addresses
- Updated `ComplaintDetailView.tsx` — Auto-link integration, keyboard hints, layout improvements
- Updated `ComplaintsPage.tsx` — Keyboard navigation wiring
- Updated `ComplaintListItem.tsx` — Arrow key cycling
- Test files for all new hooks and components

### Definition of Done

- [ ] Complaints with exact address matches auto-link without user interaction
- [ ] Near-matches show a suggestion chip that links in one click
- [ ] ↑/↓ keys cycle through complaint list items
- [ ] Tab moves focus between panels
- [ ] / focuses the location search input when no location is linked
- [ ] Enter activates selected items (open detail, trigger action)
- [ ] Description section expanded by default (or smart-truncated with immediate reveal)
- [ ] All tests pass (`npm run test`)
- [ ] Lint clean (`npm run lint`)
- [ ] Build passes (`npm run build`)

### Must Have

- Auto-link on exact address match (case-insensitive, trimmed)
- Suggestion chip for single near-match results
- Arrow key cycling in complaint list
- Tab panel-to-panel navigation
- / key focuses search input
- Enter key activates selected item
- Keyboard shortcut legend/tooltip visible in UI

### Must NOT Have (Guardrails)

- Database schema changes (migrations, new columns, new tables)
- External API integrations (SF PIM, geocoding services)
- Vim-style hotkeys (J/K/H/L)
- Auto-linking on fuzzy/partial matches (only exact for auto, suggestions for near)
- Visual redesign (colors, fonts, component library changes)
- Changes to the authentication or role system

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed. No exceptions.

### Test Decision

- **Infrastructure exists**: YES (Vitest + React Testing Library)
- **Automated tests**: YES (tests after implementation)
- **Framework**: Vitest

### QA Policy

Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright (webapp-testing skill) — Navigate, interact, assert DOM, screenshot
- **Hooks/Logic**: Use Bash (Vitest) — Run test files, assert pass/fail counts
- **API/Service**: Use Bash — Verify services return expected data shapes

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately - foundation + auto-link core):
├── Task 1: Auto-link hook + integration [deep]
├── Task 2: Location suggestion chip component [quick]
├── Task 3: Keyboard navigation hook [deep]
└── Task 4: Tests for auto-link [quick]

Wave 2 (After Wave 1 - UI wiring + layout):
├── Task 5: Wire keyboard hook into ComplaintsPage + ComplaintListItem [unspecified-high]
├── Task 6: Keyboard shortcut hints UI [visual-engineering]
├── Task 7: Layout improvements in ComplaintDetailView [unspecified-high]
└── Task 8: Tests for keyboard navigation [quick]

Wave 3 (After Wave 2 - polish + integration):
├── Task 9: Integration QA scenarios (all features together) [deep]
└── Task 10: Final polish — responsive hotkeys, edge cases, a11y [unspecified-high]

Wave FINAL (After ALL tasks — 4 parallel reviews):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay

Critical Path: Task 1 → Task 5 → Task 9 → F1-F4 → user okay
Parallel Speedup: ~50% faster than sequential
Max Concurrent: 4 (Wave 1)
```

### Dependency Matrix

| Task | Depends On | Blocks  |
| ---- | ---------- | ------- |
| 1    | -          | 4, 5    |
| 2    | -          | 5       |
| 3    | -          | 5, 6, 8 |
| 4    | 1          | 9       |
| 5    | 1, 2, 3    | 7       |
| 6    | 3          | 9       |
| 7    | 5          | 9       |
| 8    | 3          | 9       |
| 9    | 4, 6, 7, 8 | F1-F4   |
| 10   | 9          | F1-F4   |

### Agent Dispatch Summary

- **Wave 1**: 4 tasks — T1 → `deep`, T2 → `quick`, T3 → `deep`, T4 → `quick`
- **Wave 2**: 4 tasks — T5 → `unspecified-high`, T6 → `visual-engineering`, T7 → `unspecified-high`, T8 → `quick`
- **Wave 3**: 2 tasks — T9 → `deep`, T10 → `unspecified-high`
- **FINAL**: 4 tasks — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [ ] 1. Auto-link hook + integration

  **What to do**:
  - Create `src/hooks/useAutoLinkLocation.ts` — a hook that takes a complaint (with address field) and automatically queries `locationService.search()` when the complaint has no `locationid`
  - If exactly one result is found AND the address matches exactly (case-insensitive, trimmed), call `linkLocationMutation.mutate()` to auto-link
  - If multiple results or near-matches are found, store them in state for the suggestion chip to display
  - Return: `{ autoLinked: boolean, suggestions: Location[], isSearching: boolean }`
  - Integrate the hook into `ComplaintDetailView.tsx` — call it when complaint data loads and `!complaint.locationid`
  - Show a success toast when auto-link succeeds ("✓ Location auto-linked: 3668 Sutter St")
  - Handle errors gracefully — never block the UI if auto-link fails

  **Must NOT do**:
  - Do NOT modify the database schema
  - Do NOT add external API calls
  - Do NOT auto-link with fuzzy/partial matching — exact match only

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Tasks 4, 5
  - **Blocked By**: None (can start immediately)

  **References**:
  - `src/services/locationService.ts` — search method with `ilike` pattern matching
  - `src/components/ComplaintDetailView.tsx:216-260` — existing `debouncedLocationSearch` and `handleLinkLocation` patterns
  - `src/components/ComplaintDetailView.tsx:340-389` — current location search UI
  - `src/services/locationService.ts:18-31` — `LOCATION_LIST_COLUMNS` and search query structure

  **Acceptance Criteria**:
  - [ ] `src/hooks/useAutoLinkLocation.ts` created and imported
  - [ ] Hook queries `locationService.search()` with complaint address when `!locationid`
  - [ ] Exact match (case-insensitive, trimmed) triggers auto-link via `linkLocationMutation`
  - [ ] Non-exact matches stored in suggestions array
  - [ ] Success toast shown on auto-link
  - [ ] Error state does not block UI rendering

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Auto-link on exact address match
    Tool: Bash (Vitest)
    Preconditions: Complaint has address "3668 Sutter St" and no locationid
    Steps:
      1. Render component with complaint data where address matches exactly
      2. Verify linkLocationMutation.mutate was called with the matched location ID
      3. Verify success toast message appears
    Expected Result: Location is auto-linked, mutation called, toast shown
    Failure Indicators: Mutation not called, error toast shown, UI blocked
    Evidence: .sisyphus/evidence/task-1-auto-link-exact-match.txt

  Scenario: Suggestion shown for near-match address
    Tool: Bash (Vitest)
    Preconditions: Complaint has address "3668 Sutter" (partial) and no locationid
    Steps:
      1. Render component with complaint data where address partially matches
      2. Verify suggestions array contains the matching location(s)
      3. Verify no auto-link mutation was called
    Expected Result: Suggestions populated, no auto-link, user can click to link
    Failure Indicators: Auto-link triggered on partial match, suggestions empty
    Evidence: .sisyphus/evidence/task-1-suggestion-near-match.txt

  Scenario: No match found — graceful fallback
    Tool: Bash (Vitest)
    Steps:
      1. Render with address that has zero location matches
      2. Verify no mutation called, no suggestions, search input still visible
    Expected Result: UI falls back to manual search, no errors thrown
    Evidence: .sisyphus/evidence/task-1-no-match-fallback.txt
  ```

  **Commit**: YES (group with Task 2)
  - Message: `feat(auto-link): add useAutoLinkLocation hook and integration`
  - Files: `src/hooks/useAutoLinkLocation.ts`, `src/components/ComplaintDetailView.tsx`

- [ ] 2. Location suggestion chip component

  **What to do**:
  - Create `src/components/LocationSuggestionChip.tsx` — a small component that displays near-match locations with a one-click link button
  - Props: `suggestions: Location[]`, `onLink: (locationId: string) => void`, `isLinking: boolean`
  - Show as a compact banner below the location search area when suggestions exist
  - Each suggestion shows: address, location_id, facility type, and a "Link" button
  - Animate in with `framer-motion` slide-down
  - Wire into `ComplaintDetailView.tsx` — pass the `suggestions` from the `useAutoLinkLocation` hook

  **Must NOT do**:
  - Do NOT auto-link from the chip — user must click "Link" button
  - Do NOT modify database schema

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Task 5
  - **Blocked By**: None (can start immediately)

  **References**:
  - `src/components/ComplaintDetailView.tsx:369-389` — existing location result item pattern (address, location_id, facility_type, Link button)
  - `src/types/complaint.ts` — ComplaintSummary type definition
  - `src/services/locationService.ts:2-7` — LOCATION_LIST_COLUMNS for available fields

  **Acceptance Criteria**:
  - [ ] `src/components/LocationSuggestionChip.tsx` created
  - [ ] Renders suggestion list when suggestions array is non-empty
  - [ ] Each suggestion shows address, location ID, facility type
  - [ ] "Link" button calls `onLink` prop with the location ID
  - [ ] Shows loading state when `isLinking` is true
  - [ ] Animated entrance/exit with framer-motion

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Suggestion chip displays near-matches
    Tool: Bash (Vitest)
    Steps:
      1. Render LocationSuggestionChip with 2 suggestions
      2. Verify both suggestions are visible with correct addresses
      3. Click "Link" on first suggestion
      4. Verify onLink called with correct locationId
    Expected Result: Suggestions rendered, link callback fires with correct ID
    Evidence: .sisyphus/evidence/task-2-suggestion-display.txt

  Scenario: Empty suggestions — chip hidden
    Tool: Bash (Vitest)
    Steps:
      1. Render LocationSuggestionChip with empty suggestions array
      2. Verify no chip is rendered
    Expected Result: Component returns null when no suggestions
    Evidence: .sisyphus/evidence/task-2-empty-suggestions.txt
  ```

  **Commit**: YES (group with Task 1)
  - Message: `feat(auto-link): add LocationSuggestionChip component`
  - Files: `src/components/LocationSuggestionChip.tsx`

- [ ] 3. Keyboard navigation hook

  **What to do**:
  - Create `src/hooks/useKeyboardNavigation.ts` — a hook that manages keyboard-driven navigation across the complaint list and detail panels
  - Support: ↑/↓ to cycle complaint list items, Tab to move between panels (list → detail → actions), / to focus search input, Enter to activate selected item, Escape to return focus to list
  - Accept config: `{ listItemId: string, searchInputId?: string, onActivate: (id: string) => void, panelIds: string[] }`
  - Use `useEffect` to register global keydown listener, clean up on unmount
  - Manage a `focusedIndex` state for list cycling
  - Return `{ focusedIndex, setFocusedIndex, isKeyboardNavigating }` for visual feedback (highlight active item)
  - Handle edge cases: don't intercept when user is typing in an input/textarea (except / to focus search)
  - Handle modifier keys: don't interfere with Alt+1/Alt+2 existing shortcuts in ActionAssignmentPanel

  **Must NOT do**:
  - Do NOT use vim-style J/K keys — arrow keys only for accessibility
  - Do NOT override browser shortcuts (Ctrl+anything, Cmd+anything)
  - Do NOT intercept keyboard events inside form inputs (except / to focus search)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Tasks 5, 6, 8
  - **Blocked By**: None (can start immediately)

  **References**:
  - `src/components/ComplaintListItem.tsx:81` — existing `onKeyDown` for Enter key
  - `src/components/violation/ActionAssignmentPanel.tsx:77` — existing `expandTrigger` pattern for Alt+1/Alt+2
  - `src/pages/ComplaintsPage.tsx` — manages complaint list + detail + action panels
  - `src/pages/InspectorDashboardPage.tsx:70` — existing `onKeyDown` pattern for Enter activation

  **Acceptance Criteria**:
  - [ ] `src/hooks/useKeyboardNavigation.ts` created
  - [ ] ↑/↓ increments/decrements `focusedIndex`
  - [ ] Tab cycles through `panelIds` focusing each panel
  - [ ] / focuses search input element by ID
  - [ ] Enter calls `onActivate` with the focused item ID
  - [ ] Escape resets focus to list panel
  - [ ] Does NOT intercept when typing in input/textarea (except / to focus search)
  - [ ] Does NOT intercept Ctrl/Cmd modifier shortcuts
  - [ ] Cleans up event listener on unmount

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Arrow key navigation cycles through complaints
    Tool: Bash (Vitest)
    Steps:
      1. Render hook with 5 complaint IDs
      2. Simulate ArrowDown keydown
      3. Verify focusedIndex increments from 0 to 1
      4. Simulate ArrowDown 4 more times
      5. Verify focusedIndex wraps or stays at last item
      6. Simulate ArrowUp
      7. Verify focusedIndex decrements
    Expected Result: focusedIndex follows arrow key input, wraps correctly
    Evidence: .sisyphus/evidence/task-3-arrow-navigation.txt

  Scenario: Enter activates focused item
    Tool: Bash (Vitest)
    Steps:
      1. Render hook with list item IDs
      2. Simulate ArrowDown to focus index 2
      3. Simulate Enter
      4. Verify onActivate called with ID at index 2
    Expected Result: onActivate fires with correct item ID
    Evidence: .sisyphus/evidence/task-3-enter-activate.txt

  Scenario: Keyboard ignored inside form inputs
    Tool: Bash (Vitest)
    Steps:
      1. Render hook, then focus a text input
      2. Simulate ArrowDown inside the input
      3. Verify focusedIndex does NOT change
      4. Simulate / key
      5. Verify search input receives focus (special case)
    Expected Result: Arrow keys ignored in inputs, / still focuses search
    Evidence: .sisyphus/evidence/task-3-input-ignored.txt
  ```

  **Commit**: YES
  - Message: `feat(keyboard): add useKeyboardNavigation hook`
  - Files: `src/hooks/useKeyboardNavigation.ts`

- [ ] 4. Tests for auto-link

  **What to do**:
  - Create `src/hooks/__tests__/useAutoLinkLocation.test.ts`
  - Test exact match triggers auto-link
  - Test partial match populates suggestions without auto-linking
  - Test no match leaves suggestions empty
  - Test error handling — locationService.search throws, UI still renders
  - Test already-linked complaint — hook does NOT search (skip when locationid exists)
  - Mock `locationService.search` and `linkLocationMutation`

  **Must NOT do**:
  - Do NOT test with real Supabase connections
  - Do NOT modify production code

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Task 1)
  - **Parallel Group**: Wave 2 (after Task 1 completes)
  - **Blocks**: Task 9
  - **Blocked By**: Task 1

  **References**:
  - `src/hooks/useAutoLinkLocation.ts` — the hook being tested (from Task 1)
  - `src/services/__tests__/importService.test.ts` — existing mock pattern for Supabase services
  - `src/services/__tests__/aiService.test.ts` — existing mock pattern for AI service

  **Acceptance Criteria**:
  - [ ] Test file created: `src/hooks/__tests__/useAutoLinkLocation.test.ts`
  - [ ] `npm run test -- src/hooks/__tests__/useAutoLinkLocation.test.ts` → PASS

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: All auto-link tests pass
    Tool: Bash
    Steps:
      1. Run `npm run test -- src/hooks/__tests__/useAutoLinkLocation.test.ts`
      2. Verify 0 failures
    Expected Result: All tests pass
    Evidence: .sisyphus/evidence/task-4-auto-link-tests.txt
  ```

  **Commit**: YES
  - Message: `test(auto-link): add useAutoLinkLocation tests`
  - Files: `src/hooks/__tests__/useAutoLinkLocation.test.ts`

- [ ] 5. Wire keyboard hook into ComplaintsPage and ComplaintListItem

  **What to do**:
  - Integrate `useKeyboardNavigation` into `ComplaintsPage.tsx`
  - Pass `focusedIndex` and `isKeyboardNavigating` to `ComplaintListItem` for visual highlight
  - Add `tabIndex={0}` and `id` attributes to list items, detail panel, and action panel for focus management
  - Wire ↑/↓ to scroll the list and visually highlight the focused item
  - Wire Enter to select the focused complaint (same as clicking)
  - Wire / to focus the search/filter bar
  - Wire Escape to return focus to the list
  - Update `ComplaintListItem.tsx` to accept and apply `isFocused` prop for keyboard highlight styling
  - Add `role="listbox"` and `role="option"` for accessibility

  **Must NOT do**:
  - Do NOT remove mouse/touch interaction — keyboard is additive
  - Do NOT add vim-style J/K keys

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Tasks 1, 2, 3)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 7
  - **Blocked By**: Tasks 1, 2, 3

  **References**:
  - `src/pages/ComplaintsPage.tsx` — main page managing complaint list and detail panels
  - `src/components/ComplaintListItem.tsx` — individual list item component (line 40-46 for props)
  - `src/hooks/useKeyboardNavigation.ts` — the hook from Task 3
  - `src/components/violation/ActionAssignmentPanel.tsx:77` — existing `expandTrigger` pattern reference

  **Acceptance Criteria**:
  - [ ] Arrow keys navigate complaint list in ComplaintsPage
  - [ ] Focused item has visual highlight (ring/background change)
  - [ ] Enter opens focused complaint in detail panel
  - [ ] / focuses search bar
  - [ ] Escape returns focus to list
  - [ ] Keyboard navigation does not interfere with typing in form fields
  - [ ] `role="listbox"` and `role="option"` added for accessibility

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Arrow keys navigate complaint list
    Tool: Playwright (webapp-testing skill)
    Preconditions: App running at localhost:5173, logged in, at /complaints
    Steps:
      1. Navigate to /complaints
      2. Press ArrowDown key
      3. Verify first complaint item has visual highlight
      4. Press ArrowDown again
      4. Verify second complaint item highlighted
      5. Press ArrowUp
      6. Verify first complaint highlighted again
    Expected Result: Arrow keys cycle through complaints with visible highlight
    Failure Indicators: No highlight appears, wrong item highlighted, focus lost
    Evidence: .sisyphus/evidence/task-5-arrow-navigation.png

  Scenario: Enter opens complaint detail
    Tool: Playwright (webapp-testing skill)
    Steps:
      1. Navigate to /complaints
      2. Press ArrowDown to highlight a complaint
      3. Press Enter
      4. Verify detail panel shows the selected complaint
    Expected Result: Selected complaint opens in detail panel
    Evidence: .sisyphus/evidence/task-5-enter-opens-detail.png

  Scenario: / focuses search bar
    Tool: Playwright (webapp-testing skill)
    Steps:
      1. Navigate to /complaints
      2. Press /
      3. Verify focus is on the search/filter input
    Expected Result: Search input is focused
    Evidence: .sisyphus/evidence/task-5-slash-focuses-search.png
  ```

  **Commit**: YES
  - Message: `feat(keyboard): wire navigation into ComplaintsPage and ComplaintListItem`
  - Files: `src/pages/ComplaintsPage.tsx`, `src/components/ComplaintListItem.tsx`

- [ ] 6. Keyboard shortcut hints UI

  **What to do**:
  - Create `src/components/KeyboardShortcutsHint.tsx` — a floating overlay that shows available keyboard shortcuts
  - Show a small "? keyboard" button in the bottom-right corner of ComplaintsPage
  - On click or press "?" key, show a lightweight modal/popover listing all shortcuts:
    - ↑/↓ — Navigate complaints
    - Enter — Open complaint
    - Tab — Switch panels
    - / — Focus search
    - Esc — Return to list
  - Use Radix UI Popover for the hints overlay
  - Add subtle keyboard icon hints next to interactive elements (search input shows "/ " badge, status dropdown shows "E" hint)
  - Conditionally show hints only on Complaints page (not globally)

  **Must NOT do**:
  - Do NOT create a global shortcuts system — this is ComplaintsPage-specific
  - Do NOT use vim-style key labels (J/K/H/L)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Task 3)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 9
  - **Blocked By**: Task 3

  **References**:
  - `src/components/ui/popover.tsx` — Radix UI Popover component
  - `src/pages/ComplaintsPage.tsx` — where to mount the hint overlay
  - `src/hooks/useKeyboardNavigation.ts` — the hook from Task 3

  **Acceptance Criteria**:
  - [ ] `src/components/KeyboardShortcutsHint.tsx` created
  - [ ] "?" button visible in bottom-right of ComplaintsPage
  - [ ] Click or "?" key shows shortcuts overlay with all listed shortcuts
  - [ ] Overlay can be dismissed by clicking outside or pressing Esc
  - [ ] Shortcut badges ("/", "E") appear next to relevant UI elements

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Keyboard shortcut overlay displays and dismisses
    Tool: Playwright (webapp-testing skill)
    Steps:
      1. Navigate to /complaints
      2. Click the "?" keyboard button
      3. Verify overlay appears with all shortcuts listed
      4. Press Esc
      5. Verify overlay dismisses
    Expected Result: Overlay shows and hides correctly
    Evidence: .sisyphus/evidence/task-6-shortcut-overlay.png
  ```

  **Commit**: YES
  - Message: `feat(keyboard): add shortcuts hint overlay`
  - Files: `src/components/KeyboardShortcutsHint.tsx`, `src/pages/ComplaintsPage.tsx`

- [ ] 7. Layout improvements in ComplaintDetailView

  **What to do**:
  - In `ComplaintDetailView.tsx`, change the `DescriptionText` truncation behavior: expand by default (show full description without requiring "Show more" click), or increase the threshold from current value to show more text
  - Reduce vertical padding/margins in the detail panel sections to improve information density
  - Make the "Case Chronology" panel collapsible but expanded by default
  - Move the status change action closer to the complaint header (reduce vertical travel distance)
  - Reduce whitespace in the "Complaint Info" section — compact the field layout
  - Ensure the "Search and link a location" section (when visible) is more compact — reduce spacing between the warning, input, and results

  **Must NOT do**:
  - Do NOT change colors, fonts, or visual design
  - Do NOT remove any existing functionality
  - Do NOT change component library (Radix UI, Tailwind)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Task 5 for keyboard wiring)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 9
  - **Blocked By**: Task 5

  **References**:
  - `src/components/ComplaintDetailView.tsx` — the main detail view (923 lines)
  - `src/components/ComplaintDetailView.tsx:340-389` — location search section
  - `src/components/ComplaintChronologyPanel.tsx` — chronology panel
  - `src/utils/sanitizeText.ts` — text sanitization utility
  - Current Tailwind spacing patterns used throughout the file

  **Acceptance Criteria**:
  - [ ] Description text shows more content by default (increased threshold or auto-expanded)
  - [ ] Vertical spacing reduced in complaint info section
  - [ ] Status change action visible without scrolling in most cases
  - [ ] Location search section more compact
  - [ ] All existing functionality preserved

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Description shows more text by default
    Tool: Playwright (webapp-testing skill)
    Steps:
      1. Navigate to a complaint with a long description
      2. Verify more text is visible without clicking "Show more"
      3. If truncation still exists, verify the threshold is higher than before
    Expected Result: More description text visible, less need to click "Show more"
    Evidence: .sisyphus/evidence/task-7-description-visibility.png

  Scenario: Status change action accessible with less scrolling
    Tool: Playwright (webapp-testing skill)
    Steps:
      1. Navigate to a complaint
      2. Verify status change dropdown is visible or reachable with minimal scrolling
    Expected Result: Status dropdown visible within 1 scroll of initial view
    Evidence: .sisyphus/evidence/task-7-status-accessibility.png
  ```

  **Commit**: YES
  - Message: `feat(layout): improve ComplaintDetailView density`
  - Files: `src/components/ComplaintDetailView.tsx`

- [ ] 8. Tests for keyboard navigation

  **What to do**:
  - Create `src/hooks/__tests__/useKeyboardNavigation.test.ts`
  - Test arrow key cycling (↑/↓)
  - Test Tab panel focus cycling
  - Test / key focuses search input
  - Test Enter calls activate callback
  - Test Escape returns to list
  - Test keyboard ignored inside form inputs
  - Test Ctrl/Cmd modifier keys don't trigger shortcuts
  - Test list wrapping (ArrowDown at last item wraps to first, etc.)

  **Must NOT do**:
  - Do NOT test with real DOM rendering (unit test the hook only)
  - Do NOT modify production code

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Task 3)
  - **Parallel Group**: Wave 2 (after Task 3 completes)
  - **Blocks**: Task 9
  - **Blocked By**: Task 3

  **References**:
  - `src/hooks/useKeyboardNavigation.ts` — the hook being tested (from Task 3)
  - `src/services/__tests__/aiService.test.ts` — mock pattern reference

  **Acceptance Criteria**:
  - [ ] Test file created: `src/hooks/__tests__/useKeyboardNavigation.test.ts`
  - [ ] `npm run test -- src/hooks/__tests__/useKeyboardNavigation.test.ts` → PASS

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: All keyboard navigation tests pass
    Tool: Bash
    Steps:
      1. Run `npm run test -- src/hooks/__tests__/useKeyboardNavigation.test.ts`
      2. Verify 0 failures
    Expected Result: All tests pass
    Evidence: .sisyphus/evidence/task-8-keyboard-tests.txt
  ```

  **Commit**: YES
  - Message: `test(keyboard): add useKeyboardNavigation tests`
  - Files: `src/hooks/__tests__/useKeyboardNavigation.test.ts`

- [ ] 9. Integration QA scenarios (all features together)

  **What to do**:
  - Create end-to-end integration test file: `src/__tests__/workflow-integration.test.tsx`
  - Test the full auto-link workflow: load complaint → address matches → auto-links → shows success toast
  - Test the full keyboard workflow: navigate list → select complaint → Tab to detail → / to search → Esc to return
  - Test layout improvements: description visibility, status accessibility
  - Test edge cases: already-linked complaint doesn't re-search, keyboard while typing in input, rapid arrow key presses
  - Cross-feature integration: auto-link + keyboard nav together don't conflict

  **Must NOT do**:
  - Do NOT test with real Supabase — mock all service calls
  - Do NOT add new features — this is testing only

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Tasks 4, 6, 7, 8)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 4, 6, 7, 8

  **References**:
  - All previous task deliverables
  - `src/pages/ComplaintsPage.tsx` — integration point
  - `src/components/ComplaintDetailView.tsx` — integration point

  **Acceptance Criteria**:
  - [ ] Integration test file created
  - [ ] All integration tests pass
  - [ ] `npm run test` passes all tests including integration tests

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Auto-link doesn't conflict with keyboard navigation
    Tool: Playwright (webapp-testing skill)
    Steps:
      1. Navigate to complaint that will auto-link
      2. While auto-link is processing, press ArrowDown
      3. Verify keyboard navigation still works during auto-link
      4. After auto-link completes, verify keyboard continues working
    Expected Result: Both features work independently and together
    Evidence: .sisyphus/evidence/task-9-integration-qa.png

  Scenario: Already-linked complaint skips auto-search
    Tool: Playwright (webapp-testing skill)
    Steps:
      1. Navigate to complaint that already has a linked location
      2. Verify no search request is made
      3. Verify suggestion chip is not shown
      4. Verify "View Location" link is present
    Expected Result: Auto-link hook skips entirely for linked complaints
    Evidence: .sisyphus/evidence/task-9-no-re-search.png

  Scenario: Keyboard ignored in form inputs
    Tool: Playwright (webapp-testing skill)
    Steps:
      1. Navigate to /complaints
      2. Click inside the search filter input
      3. Type letters — verify they appear in the input
      4. Press / — verify search input receives focus
      5. Press ArrowDown — verify it does NOT change complaint focus
    Expected Result: Arrow keys don't interfere with typing; / still works
    Evidence: .sisyphus/evidence/task-9-keyboard-in-inputs.png
  ```

  **Commit**: YES
  - Message: `test(integration): add cross-feature workflow integration tests`
  - Files: `src/__tests__/workflow-integration.test.tsx`

- [ ] 10. Final polish — responsive keyboard handling, edge cases, a11y

  **What to do**:
  - Ensure keyboard navigation works on mobile/responsive layouts (Tab through panels)
  - Add `aria-activedescendant` to list container for screen reader support
  - Ensure focus indicators are visible (Tailwind `ring` classes on items with `isKeyboardNavigating`)
  - Handle rapid key presses (debounce ArrowDown/ArrowUp to prevent skipping)
  - Detect `prefers-reduced-motion` for animation-heavy shortcuts
  - Add `keyboardNavigation: false` prop to disable hook when on mobile viewport or when a modal/dialog is open
  - Test that auto-link hook properly cleans up (no memory leaks from subscriptions)

  **Must NOT do**:
  - Do NOT add fundamentally new features
  - Do NOT change the visual design system

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Task 9)
  - **Parallel Group**: Wave 3
  - **Blocks**: F1-F4
  - **Blocked By**: Task 9

  **References**:
  - `src/hooks/useKeyboardNavigation.ts` — the hook to polish
  - `src/hooks/useAutoLinkLocation.ts` — the hook to verify cleanup
  - Tailwind `ring` classes documentation for focus indicators
  - `prefers-reduced-motion` CSS media query

  **Acceptance Criteria**:
  - [ ] Keyboard navigation has visible focus indicators (ring/highlight)
  - [ ] Screen reader aria attributes present on list container and items
  - [ ] Rapid key presses don't cause skipping (debounced)
  - [ ] Hook disabled when modal or dialog is open
  - [ ] Auto-link hook properly cleans up on unmount
  - [ ] All tests still pass

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Focus indicators visible during keyboard navigation
    Tool: Playwright (webapp-testing skill)
    Steps:
      1. Navigate to /complaints
      2. Press ArrowDown
      3. Verify focused item has a visible ring/highlight
      4. Take screenshot showing the focused state
    Expected Result: Clear visual indication of focused item
    Evidence: .sisyphus/evidence/task-10-focus-indicator.png

  Scenario: Rapid key presses don't skip items
    Tool: Bash (Vitest)
    Steps:
      1. Fire 5 rapid ArrowDown events (< 50ms apart)
      2. Verify focusedIndex moves from 0 to 5 (not jumping to last item)
    Expected Result: Each key press increments by 1, no skipping
    Evidence: .sisyphus/evidence/task-10-rapid-keys.txt

  Scenario: Hook cleanup on unmount
    Tool: Bash (Vitest)
    Steps:
      1. Render hook, verify event listener attached
      2. Unmount
      3. Verify event listener removed (no memory leak)
    Expected Result: Clean unmount with no orphan event listeners
    Evidence: .sisyphus/evidence/task-10-hook-cleanup.txt
  ```

  **Commit**: YES
  - Message: `polish: responsive keyboard handling, a11y, edge cases`
  - Files: `src/hooks/useKeyboardNavigation.ts`, `src/components/ComplaintDetailView.tsx`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
>
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**

- [ ] F1. **Plan Compliance Audit** — `oracle`
      Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
      Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
      Run `tsc --noEmit` + `npm run lint` + `npm run test`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names.
      Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `webapp-testing` skill)
      Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (auto-link + keyboard nav + layout). Test edge cases: no location match, multiple matches, already-linked complaint, keyboard with no complaint selected. Save to `.sisyphus/evidence/final-qa/`.
      Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
      For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
      Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **1**: `feat(auto-link): add useAutoLinkLocation hook and integrate` - src/hooks/useAutoLinkLocation.ts, src/components/ComplaintDetailView.tsx, src/services/locationService.ts
- **2**: `feat(auto-link): add LocationSuggestionChip component` - src/components/LocationSuggestionChip.tsx
- **3**: `feat(keyboard): add useKeyboardNavigation hook` - src/hooks/useKeyboardNavigation.ts
- **4**: `test(auto-link): add tests for useAutoLinkLocation` - src/hooks/**tests**/useAutoLinkLocation.test.ts
- **5**: `feat(keyboard): wire navigation into ComplaintsPage and ComplaintListItem` - src/pages/ComplaintsPage.tsx, src/components/ComplaintListItem.tsx
- **6**: `feat(keyboard): add shortcut hints overlay` - src/components/KeyboardShortcutsHint.tsx, src/pages/ComplaintsPage.tsx
- **7**: `feat(layout): improve ComplaintDetailView density` - src/components/ComplaintDetailView.tsx
- **8**: `test(keyboard): add tests for useKeyboardNavigation` - src/hooks/**tests**/useKeyboardNavigation.test.ts
- **9**: `test(integration): add cross-feature integration tests` - src/**tests**/workflow-integration.test.tsx
- **10**: `polish: responsive keyboard handling, a11y, edge cases` - src/hooks/useKeyboardNavigation.ts, src/components/ComplaintDetailView.tsx

---

## Success Criteria

### Verification Commands

```bash
npm run build   # Expected: clean build, no TS errors
npm run lint     # Expected: 0 errors, 0 warnings
npm run test     # Expected: all tests pass (including new ones)
```

### Final Checklist

- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass
