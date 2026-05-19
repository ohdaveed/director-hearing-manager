# Director Hearing Manager (Zite)

> Enterprise case-management system for SFDPH Environmental Health Division (HHVC program).
> Automates Director's Hearing Packet compilation for SF Health Code Article 11 enforcement.

## Quick Start (Commands)

- `vp dev` (or `npm run dev`) — Vite dev server (port 5173)
- `vp build` (or `npm run build`) — `tsc && vp build` (typecheck + bundle)
- `vp lint` (or `npm run lint`) — `eslint . --report-unused-disable-directives --max-warnings 0`
- `vp test` (or `npm run test`) — Vitest (configured inside `vite.config.ts`)
- `vp preview` (or `npm run preview`) — preview production build
- `CI=true vp test -- --coverage` — coverage report (target >80% for new code)

## Technology Stack

React 18, TypeScript ^5.9.3 (strict), Vite+ (vp CLI), Tailwind CSS 4.3,
Radix UI + @base-ui/react, Lucide React, Framer Motion, Supabase (PostgreSQL + Auth Helpers),
TanStack React Query 5, Zod, react-hook-form, sonner, Anthropic SDK,
Vitest + React Testing Library (jsdom, globals: true)

## Architecture — Information Architecture

| Route              | Page                                       | Roles           |
| ------------------ | ------------------------------------------ | --------------- |
| `/dashboard`       | DashboardPage / InspectorDashboardPage     | All             |
| `/complaints`      | ComplaintsPage → ComplaintEntryPage        | All             |
| `/inspections`     | InspectionFormPage / InspectionHistoryPage | All             |
| `/enforcement`     | EnforcementPage                            | PM, Super Admin |
| `/hearings`        | HearingPacketsPage                         | All             |
| `/draft-analysis`  | DraftPacketAnalysisPage                    | All             |
| `/documents`       | DocumentLibraryPage                        | All             |
| `/all-locations`   | AllLocationsPage → LocationPage            | All             |

Entry: `src/main.tsx` → `App.tsx` (BrowserRouter > AuthProvider > AppContent)
Route guards live in `App.tsx` (role-based nav filtering + redirect), not per-page.
Role impersonation (Super Admin only) is held in local `AppShell` state and never persisted.

### Core Data Flow

Complaint → Inspection(s) → Violations → Chronology → Hearing Packet

### Hearing Packet Pipeline

1. Inspector files a complaint and runs inspections (violations attached per inspection).
2. Program Manager escalates to the Enforcement queue.
3. Packet assembly: exhibits uploaded, chronology built, AI-extracted violations merged via `importService`.
4. Packet statuses: `Not Started → In Progress → Under Review → Complete → Submitted`
5. `pdfExport.ts` / `@react-pdf/renderer` generate print-ready packet documents.

### Services (src/services/)

- `complaintService`, `inspectionService`, `locationService` — CRUD for core entities
- `packetService`, `exhibitService`, `chronoService` — Hearing Packet assembly pipeline
- `aiService` — Claude API calls for PDF ingestion and violation extraction
- `importService` — Import Past Inspections wizard (parse → extract → seed chronology)
- `packetMapperService` — maps raw DB rows to typed packet structures for rendering/export
- `userService` — Supabase Auth and profile management
- `wordService` — Word document parsing (using mammoth)
- `pdfService` — PDF parsing (using pdfjs-dist)
- `packetAnalysisService` — Analysis of packet compliance
- `modelSelector` — AI model selection logic (Anthropic, OpenAI, Vertex AI)
- `documentService` — Document library management

**CRITICAL: PostgREST Join Hints**
Due to multiple foreign keys on some tables, always use explicit join hints in `.select()` calls.
Example: `.select('*, inspections!location_uuid(*)')` to disambiguate which FK to use.

## Directory Structure

- `src/pages/` — Route-level components
- `src/components/ui/` — Shadcn/UI primitives (Radix + Tailwind)
- `src/components/packet/` — Hearing Packet document components (print-ready React)
- `src/components/packet/printUtils.tsx` — Print formatting utilities
- `src/services/` — Database queries + external APIs
- `src/hooks/` — Custom React hooks
- `src/context/` — Global state (`AuthContext` / `AuthProvider`)
- `src/types/` — TypeScript type definitions (`complaint.ts`, `database.ts`)
- `src/utils/` — Utility functions (`sfhcArticle11.ts`, `validationRules.ts`)
- `src/config/` — Configuration (`documentTemplates.ts` — source of truth for legal boilerplate)
- `src/lib/` — Client init (`supabase.ts`)
- `src/test/setup.ts` — Vitest setup file

## Database

- **Schema**: `schema.sql` (12+ tables, UUID PKs for most, BIGINT for `inspections`, RLS on all tables)
- **Types**: `src/types/database.ts` is the authoritative source for database interfaces.
- **Migrations**: `migrations/` numbered `001a_`–`003a_` (idempotent — uses `IF NOT EXISTS`/`DROP IF EXISTS`)
- RLS policies are defined in `migrations/001c_rls_policies.sql` and `001d_rls_remaining_and_fks.sql`
- All tables have `created_at`/`updated_at` with auto-update trigger; most have `deleted_at` soft-delete
- Run migrations via Supabase CLI (`supabase db push`) — never mutate schema directly
- Linked skill: `supabase-postgres-best-practices` (see `skills-lock.json`)

## TypeScript Rules (Team Conventions)

- No `any` (use `unknown` or a specific type)
- Named exports only — no default exports
- No type assertions (`as T`, `!`) without justification comment
- No `var`, no `public` modifier, no `#private` fields
- Single quotes for strings; explicit semicolons
- `@/` maps to `src/` (configured in `tsconfig.json` and `vite.config.ts`)
- Follow Google TypeScript Style Guide (see `conductor/code_styleguides/typescript.md`)

## UI Conventions

- Radix UI + `@base-ui/react` primitives in `src/components/ui/` (shadcn pattern; `components.json` is the registry config)
- Lucide React icons only
- `react-hook-form` + Zod schemas for forms — validate at the boundary
- `sonner` `<Toaster />` for toasts (`toast.*()` API)
- Data fetching: `useQuery` / `useMutation` from TanStack React Query (QueryClient initialized in `src/main.tsx`)

## RBAC Roles

Inspector, Admin, Program Manager, Super Admin
Route guards in `App.tsx`; impersonation via header banner (Super Admin only, never persisted)

## Legal Constraints

- SF Health Code Article 11 only (`src/utils/sfhcArticle11.ts` holds the authoritative list)
- `validationRules.ts` enforces this; never bypass it
- Document boilerplate in `src/config/documentTemplates.ts` — never hardcode legal text

<!--VITE PLUS START-->

## Vite+ Toolchain

- Use `vp` commands (`vp dev`, `vp build`, `vp test`, `vp lint`, `vp fmt`)
- Do NOT use pnpm/npm/yarn directly for dependency management; use `vp install` / `vp add` / `vp remove`
- Vitest is bundled — import test utilities from `vite-plus/test`, NOT from `vitest`
- Type-aware linting: `vp lint --type-aware` works out of the box

<!--VITE PLUS END-->

## Testing

- Vitest + React Testing Library with `jsdom` and `globals: true`
- Test files live in `__tests__/` next to the module they cover
- Mock pattern for Anthropic SDK: `vi.hoisted()` + `vi.mock('@anthropic-ai/sdk')` — see `src/services/__tests__/aiService.test.ts`
- Run coverage: `CI=true vp test -- --coverage`
- Target >80% coverage for new service/utility code

## Quality Gates

Before marking done: tests pass, coverage >80%, lint clean, code style guides followed

## Repo Quirks

- `eslint.config.js` exists (flat config format) — there is no `.eslintrc.*`. Note: `--ext` flag is not used with flat config.
- `prettier` is installed and used by `lint-staged` (configured in `package.json`)
- `husky` + `lint-staged` pre-commit hooks exist: run `eslint --fix`, `prettier --write`, and `npm run build`
- Environment vars prefixed `VITE_` (Vite convention); set in `.env` (gitignored), template in `.env.example`
- `postinstall` script copies `pdf.worker.min.mjs` to `public/`
- No CI workflows, no Docker

## Environment Variables

Runtime (Vite-prefixed, set in `.env` / `.env.local`):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Skills & MCP Servers

- Linked skills: `impeccable`, `shadcn`, `supabase-postgres-best-practices`, `using-superpowers` (see `skills-lock.json`)
- MCP servers: Playwright MCP (browser automation), PostgreSQL MCP (schema inspection)

## AI Agent Communication Protocol

This project uses a 4-tier system to keep AI agents informed about app progress and changes.

### Tier 1 — AGENTS.md (Static Context)

**This file.** The single source of truth for everything that doesn't change frequently:
commands, architecture, conventions, schema, quality gates. Update ONLY this file when
project structure or conventions change.

### Tier 2 — `.sisyphus/progress/current-status.md` (Dynamic State)

The living progress document. Records completed work, in-progress items, decisions,
gotchas, and breaking changes. Updated at the end of every work session.

**AI agents**: Read this FIRST at session start to understand current project state.

### Tier 3 — claude-mem (Cross-Session Memory)

Persistent observations across Claude Code sessions. See `.sisyphus/progress/CLAUDE-MEM.md`
for the recording guide. Use `observation_add` to persist decisions, patterns, and gotchas.

### Tier 4 — Git History (Permanent Record)

Meaningful commit messages + git notes for the permanent audit trail. Run `git log --oneline -20`
to see recent changes. Commit messages follow conventional commits format.

### Session Workflow

**Start of AI session:**

1. Read `.sisyphus/progress/current-status.md` — understand current state
2. Read `AGENTS.md` — refresh project context
3. Run `git log --oneline -20` — see recent changes
4. Run `vp install` if new dependencies may have been added
5. Begin work

**End of AI session:**

1. Update `.sisyphus/progress/current-status.md`:
   - Move completed items to "Recently Completed"
   - Update "In Progress" with current state
   - Add any "Key Decisions Made"
   - Add any "Changed Patterns / Gotchas"
   - Add any "Breaking Changes / Areas of Caution"
   - Set "Next Up" for the next session
2. If using Claude Code: record key decisions as claude-mem observations
   (see `.sisyphus/progress/CLAUDE-MEM.md` for format)
3. Commit changes with meaningful messages (conventional commits format)
4. Add git notes for complex changes (see `conductor/workflow.md` for format)

### Configuration Layers

AGENTS.md ← THE authoritative source of truth
├── CLAUDE.md ← "See AGENTS.md" + Claude-specific MCP/config notes
├── GEMINI.md ← "See AGENTS.md" + Gemini-specific MCP/config notes
└── .github/copilot-instructions.md ← "See AGENTS.md" + Copilot-specific notes

When project context changes → update ONLY AGENTS.md. All platforms pick it up.
