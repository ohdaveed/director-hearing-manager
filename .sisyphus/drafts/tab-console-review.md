# Draft: Tab Console Error Review

## Original Request

Plan a review of each tab to ensure there are no console errors.

## App Architecture (Discovered)

### Navigation Tabs (6 main)

1. **Dashboard** → `/dashboard` (DashboardPage / InspectorDashboardPage)
2. **Complaints** → `/complaints`, `/complaints/new`, `/complaints/:id`, `/complaints/import` (ComplaintsPage, ComplaintEntryPage, ImportComplaintsPage)
3. **Inspections** → `/inspections`, `/inspections/new`, `/inspections/:complaintId` (InspectionHistoryPage, InspectionFormPage)
4. **Enforcement** → `/enforcement`, `/enforcement/hearings`, `/enforcement/hearings/:id` (EnforcementPage) — PM + Super Admin only
5. **Director's Hearings** → `/hearings`, `/hearings/:id` (HearingPacketsPage)
6. **Locations** → `/all-locations`, `/locations/:locationRecordId` (AllLocationsPage, LocationPage)

### Other Routes

- `/profile` → ProfilePage
- `/user-management` → UserManagementPage
- `/login`, `/signup` → LoginPage, SignUpPage

### Roles

- Inspector, Admin, Program Manager, Super Admin
- Enforcement tab ONLY visible to Program Manager + Super Admin
- Role-based data scoping on HearingPacketsPage for Inspectors

### Existing console.error calls in codebase

- `src/context/AuthContext.tsx:115` — "Error creating user profile"
- `src/context/AuthContext.tsx:124` — "Error fetching user profile"
- `src/services/aiService.ts:57` — "Failed to parse AI response"

## Test Infrastructure (Discovered)

- **Framework**: Vitest + React Testing Library (jsdom, globals: true)
- **Existing tests**: 4 files (aiService, importService, wordService, DraftUploadPanel)
- **E2E**: Playwright available via npx (Chromium installed at ~/.cache/ms-playwright)
- **Dev server**: `npm run dev` (Vite, port 5173)
- **Supabase**: .env populated with VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
- **Webapp-testing skill**: Available with `with_server.py` helper script
- **No e2e tests currently exist**

## User Decisions (Confirmed)

- **Route scope**: Nav tabs + key sub-routes (Dashboard, Complaints list/new/:id/import, Inspections list/new/:complaintId, Enforcement enforcement/hearings, Hearings list/:id, Locations list/:locationRecordId)
- **Roles**: All 4 roles (Inspector, Admin, Program Manager, Super Admin)
- **Log level**: Errors only (console.error + uncaught exceptions)
- **Auth approach**: Mock auth via Playwright (intercept Supabase localStorage session tokens)

## Routes to Test per Role

### Inspector (visible: 5 tabs)

- `/dashboard` → InspectorDashboardPage
- `/complaints` → ComplaintsPage (list)
- `/complaints/new` → ComplaintEntryPage
- `/inspections` → InspectionHistoryPage
- `/hearings` → HearingPacketsPage
- `/hearings/:id` → HearingPacketsPage
- `/all-locations` → AllLocationsPage

### Admin (visible: 5 tabs, different dashboard)

- `/dashboard` → DashboardPage
- `/complaints` → ComplaintsPage
- `/complaints/new` → ComplaintEntryPage
- `/inspections` → InspectionHistoryPage
- `/hearings` → HearingPacketsPage
- `/all-locations` → AllLocationsPage

### Program Manager (visible: 6 tabs including Enforcement)

- `/dashboard` → DashboardPage
- `/complaints` → ComplaintsPage
- `/complaints/import` → ImportComplaintsPage
- `/inspections` → InspectionHistoryPage
- `/enforcement` → EnforcementPage
- `/enforcement/hearings` → EnforcementPage
- `/hearings` → HearingPacketsPage
- `/all-locations` → AllLocationsPage

### Super Admin (visible: 6 tabs)

- Same as Program Manager + `/user-management` (not in nav)
- Role preview/impersonation feature available

## Technical Decisions

- **Approach**: Playwright script with `page.on("console")` event listener, managed via `with_server.py`
- **Tool**: webapp-testing skill with `console_logging.py` pattern
- **Server**: `npm run dev` (Vite, port 5173)
- **Mock auth**: Inject Supabase session into localStorage
- **Script language**: Python (Playwright sync API) via with_server.py
- **Evidence**: Per-role console output files + screenshots
