# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # TypeScript check + Vite production build
npm run lint         # ESLint (zero warnings allowed)
npm test             # Vitest in watch mode
CI=true npm test     # Single-run test pass (use in CI / non-interactive)
npx vitest run src/services/__tests__/aiService.test.ts  # Run a single test file
```

Husky + lint-staged runs ESLint and Prettier on staged `.ts`/`.tsx` files at commit time. If a pre-commit hook fails, fix the issue and create a **new** commit—never amend to work around a hook failure.

## Architecture

### 5-Pillar Navigation

The app is a role-gated SPA (`src/App.tsx`) with five main destinations:

| Route            | Page                                       | Roles           |
| ---------------- | ------------------------------------------ | --------------- |
| `/dashboard`     | DashboardPage / InspectorDashboardPage     | All             |
| `/complaints`    | ComplaintsPage → ComplaintEntryPage        | All             |
| `/inspections`   | InspectionFormPage / InspectionHistoryPage | All             |
| `/enforcement`   | EnforcementPage → HearingPacketsPage       | PM, Super Admin |
| `/all-locations` | AllLocationsPage → LocationPage            | All             |

`AuthContext` (`src/context/AuthContext.tsx`) wraps the whole app and exposes `user`, `session`, and `isLoading` via Supabase Auth. Role impersonation (Super Admin only) is held in local `AppShell` state and never persisted.

### Data Layer

All Supabase access goes through service modules in `src/services/`:

- `complaintService`, `inspectionService`, `locationService` — CRUD for core entities
- `packetService`, `exhibitService`, `chronoService` — Hearing Packet assembly pipeline
- `aiService` — Claude API calls for PDF ingestion and violation extraction
- `importService` — orchestrates the Import Past Inspections wizard (parse → extract → seed chronology)
- `packetMapperService` — maps raw DB rows to typed packet structures for rendering/export

Server state is managed with **TanStack React Query**. Mutations should invalidate the relevant query keys so UI stays in sync.

### Hearing Packet Pipeline

The central workflow: `Complaint → Inspection(s) → Enforcement Escalation → Hearing Packet`.

1. Inspector files a complaint and runs inspections (violations attached per inspection).
2. Program Manager escalates to the Enforcement queue.
3. A Hearing Packet is assembled: exhibits are uploaded, a chronology is built, and AI-extracted violations from historical PDFs are merged in via `importService`.
4. The packet moves through statuses: `Not Started → In Progress → Under Review → Complete → Submitted`.
5. `pdfExport.ts` / `@react-pdf/renderer` generate print-ready packet documents.

### Code Citations & Legal Constraints

**All violation codes must be San Francisco Health Code (SFHC) Article 11 only.** California state codes are prohibited by design (`src/utils/sfhcArticle11.ts` holds the authoritative list). The `validationRules.ts` utility enforces this; never bypass it.

### Component Conventions

- UI primitives come from **Radix UI** (`@radix-ui/*`) wrapped with local components in `src/components/ui/` (shadcn pattern — `components.json` is the registry config).
- Icons: **Lucide React** only.
- Forms: **react-hook-form** + **Zod** schemas. All form shapes should be validated at the boundary.
- Toasts: `<Toaster />` from `sonner` — call `toast.*()` for user feedback.
- Complex packet-specific components live in `src/components/packet/`.

### TypeScript Rules (from `conductor/code_styleguides/typescript.md`)

- **No `any`** — use `unknown` or a specific type.
- **Named exports only** — no default exports.
- **No type assertions** (`as T`, `!`) unless unavoidable with a comment explaining why.
- **No `var`**, no `public` modifier, no `#private` fields.
- Single quotes for strings; explicit semicolons.

### Environment Variables

The app reads two Vite env vars at runtime:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Set these in `.env.local` for local development.

## Database

`schema.sql` is the canonical schema. Incremental migrations live in `migrations/` (numbered `001a`, `001b`, …). Run migrations via the Supabase CLI (`supabase db push`) — never mutate the schema directly.

RLS policies are defined in `migrations/001c_rls_policies.sql` and `001d_rls_remaining_and_fks.sql`. Any new table must have RLS enabled and matching policies before shipping.

## Testing

Tests use **Vitest** + **@testing-library/react** with `jsdom`. Test files live under `src/**/__tests__/` next to the code they cover. Target >80% coverage for new service/utility code. Run coverage with:

```bash
CI=true npm test -- --coverage
```
