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

| Route             | Page                                       | Roles           |
| ----------------- | ------------------------------------------ | --------------- |
| `/dashboard`      | DashboardPage / InspectorDashboardPage     | All             |
| `/complaints`     | ComplaintsPage → ComplaintEntryPage        | All             |
| `/inspections`    | InspectionFormPage / InspectionHistoryPage | All             |
| `/enforcement`    | EnforcementPage                            | PM, Super Admin |
| `/hearings`       | HearingPacketsPage                         | All             |
| `/draft-analysis` | DraftPacketAnalysisPage                    | All             |
| `/documents`      | DocumentLibraryPage                        | All             |
| `/all-locations`  | AllLocationsPage → LocationPage            | All             |

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
Example: `.select('*, inspections!location_id(*)')` to disambiguate which FK to use.

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

- **Schema as Code**: The desired state lives in `sql/schema.sql` (one-file-per-object in `sql/`).
  - `sql/types/` — ENUM type definitions
  - `sql/tables/` — Table definitions (one file per table)
  - `sql/functions/` — PostgreSQL functions
  - `sql/views/` — Database views
  - `sql/indexes/` — All indexes
  - `sql/extensions/` — Extensions (uuid-ossp, pg_trgm, vector)
- **Types**: `src/types/database.ts` is the authoritative source for database interfaces.
- **Migrations**: `migrations/` — managed by Atlas CLI (run `atlas migrate diff <name>` to generate)
- **RLS policies**: Defined in `migrations/001c_rls_policies.sql` and `001d_rls_remaining_and_fks.sql`
- **Schema management with Atlas**:
  - `npm run db:diff -- <name> -- --dev-url '<dev-db-url>'` — generate a new migration from schema changes
  - `npm run db:lint -- --dev-url '<dev-db-url>'` — lint the latest migration for safety issues
  - `npm run db:apply` — apply pending migrations to the database
  - `npm run db:validate -- --dev-url '<dev-db-url>'` — validate that schema files are parseable
  - `npm run db:inspect -- --url '<target-db-url>'` — inspect live database
  - Config: `atlas.hcl` — defines the `director_hearing_manager` env
  - Every Atlas command that computes diffs needs `--dev-url` (clean Postgres database for diff computation)
  - Set `ATLAS_DATABASE_URL` in your `.env` file (see `.env.example`)
- All tables have `created_at`/`updated_at` with auto-update trigger; most have `deleted_at` soft-delete
- Run migrations via Atlas (`npm run db:apply`) — never mutate schema directly
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

- **Source of Truth**: `src/components/ui/` contains all base primitives (Radix UI + `@base-ui/react`).
- **Standardized Usage**: ALWAYS use the primitives in `src/components/ui/`. NEVER create duplicate or "custom" versions of existing shadcn/ui components (e.g., `StatCard`, `SectionHeader`, `MetricBar`) outside this directory.
- **Composition**: Prefer composing existing components over building custom ones.
- **Icons**: Use `lucide-react` icons exclusively.
- **Form Patterns**: Use `react-hook-form` + Zod schemas for forms; validate at the boundary.
- **Toasts**: Use `sonner` via the `toast.*()` API.
- **Data Fetching**: Use `useQuery` / `useMutation` from TanStack React Query.
- **No Direct Styling Overrides**: Avoid raw Tailwind colors or manual CSS when a semantic component exists.

## RBAC Roles

Inspector, Admin, Program Manager, Super Admin
Route guards in `App.tsx`; impersonation via header banner (Super Admin only, never persisted)

## Legal Constraints

- SF Health Code Article 11 only (`src/utils/sfhcArticle11.ts` holds the authoritative list)
- `validationRules.ts` enforces this; never bypass it
- Document boilerplate in `src/config/documentTemplates.ts` — never hardcode legal text

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

## Testing

- Vitest + React Testing Library with `jsdom` and `globals: true`
- Test files live in `__tests__/` next to the module they cover
- Mock pattern for Anthropic SDK: `vi.hoisted()` + `vi.mock('@anthropic-ai/sdk')` — see `src/services/__tests__/aiService.test.ts`
- Run coverage: `CI=true vp test -- --coverage`
- Target >80% coverage for new service/utility code

## Code Review Process

### Automated Review Mandate (The Contrarian Reviewer)

To prevent "performative agreement" and ensure architectural integrity, all code implementations MUST be audited using the "Contrarian Reviewer" prompt.

- **Requirement:** Before marking any task as complete, invoke a review subagent using the system prompt defined in `conductor/code-reviewer-prompt.md`.
- **Goal:** Instead of checking if the code works, the reviewer must find exactly three ways the implementation diverges from the patterns in `AGENTS.md` or introduces a pattern that wasn't reconciled in the plan.
- **Remediation:** All three identified violations MUST be addressed or formally reconciled in the track's `plan.md` before the task can be considered "Done".

### UX Audit

- Use `node scripts/run-audit.js <file-path>` to proactively audit components against enterprise UX standards (Hick's, Fitts's, and Jakob's Laws).
- **Mandate:** Always run this audit on new UI components before requesting a review from the "Contrarian Reviewer" subagent.

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
- `VITE_ANTHROPIC_API_KEY` — used by `aiService` and browser-side model fallback logic.
- `VITE_OPENAI_API_KEY` — used by `modelSelector` for OpenAI fallback logic.

Local tooling / non-Vite values:

- `ATLAS_DATABASE_URL` — target database URL for Atlas schema commands.
- `GEMINI_API_KEY` — used by local AI audit scripts.

Templates:

- `.env.example` documents manual `.env` values.
- `.env.pass.template.example` is the committed Proton Pass example for the local `scripts/populate-env.cjs` workflow.
- `.env.template.pass` is an alternate Proton Pass template spelling for tooling that expects suffix-based pass templates; copy it to `.env.pass.template` before running `npm run env:inject`.

## Skills & MCP Servers

- Linked skills: `impeccable`, `shadcn`, `supabase-postgres-best-practices`, `using-superpowers` (see `skills-lock.json`)
- MCP servers: Playwright MCP (browser automation), PostgreSQL MCP (schema inspection)

### Context7 Reconciliation Protocol

When utilizing Context7 for library documentation or best practices, you MUST reconcile generic advice with our local architecture using `ctx7-manifest.json` as the source of truth for mappings and constraints:

1. **Library Mapping:** Use the `libraryId` pinned in `ctx7-manifest.json` for all documentation queries.
2. **Version Match:** Verify the Context7 library version matches our `package.json` exactly.
3. **UI Primitives:** Prefer our local `src/components/ui/` Shadcn primitives over generic component examples.
4. **Database Queries:** Adapt generic SQL or ORM queries to use our specific Atlas/Supabase join hints (as defined in the Architecture section).
5. **Local Trumps Generic:** If Context7 best practices conflict with rules defined in this `AGENTS.md` file or the `reconciliationNotes` in `ctx7-manifest.json`, the local rules take absolute precedence.

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
for the recording guide.

**Note on Tools**:

- **Claude Code**: Use `observation_add` to persist decisions, patterns, and gotchas.
- **Gemini CLI**: Use `replace` or `write_file` to record observations directly into
  `.sisyphus/progress/current-status.md` (Tier 2) or project documentation.
  There is no `observation_add` tool in Gemini CLI.

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
