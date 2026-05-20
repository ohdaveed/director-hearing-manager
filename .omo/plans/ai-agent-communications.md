# AI Agent Communication System

## TL;DR

> **Quick Summary**: Create a unified 4-tier system that keeps all AI coding agents (Claude Code, Copilot, Gemini, OpenCode) automatically informed about app progress and changes — eliminating duplicated config files and providing a living progress document.
>
> **Deliverables**:
>
> - Consolidated `AGENTS.md` as the single authoritative source of truth
> - Thin platform-specific wrappers (`CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`) referencing AGENTS.md
> - `.sisyphus/progress/current-status.md` — living progress document template
> - `.sisyphus/progress/CLAUDE-MEM.md` — claude-mem observation pattern guide
> - Documented start/end-of-session workflow in AGENTS.md
>
> **Estimated Effort**: Short (5-7 files, all markdown)
> **Parallel Execution**: YES — 2 waves
> **Critical Path**: Consolidate AGENTS.md → Append workflow section → Final verification

---

## Context

### Original Request

User asked: "whats the best way to update all ai agents of app progress and changes" — seeking a systematic approach to keep all AI coding assistants context-aware without manual duplication.

### Interview Summary

**Key Discussions**:

- Project currently has 4 AI config files with significant content overlap (AGENTS.md, CLAUDE.md, GEMINI.md, copilot-instructions.md)
- These drift out of sync because updating all 4 is tedious and error-prone
- Existing `.sisyphus/` system provides good infrastructure (plans, drafts, notepads, boulder, run-continuation)
- claude-mem plugin available but not actively configured for cross-session memory
- User wants the full 4-tier "all of it" solution

**Research Findings**:

| File                    | Lines | Redundancy                                                              |
| ----------------------- | ----- | ----------------------------------------------------------------------- |
| AGENTS.md               | ~100  | Has Vite+ section, architecture, commands, conventions — PARTIAL source |
| CLAUDE.md               | ~99   | Overlaps AGENTS.md on architecture, commands, testing, TypeScript rules |
| GEMINI.md               | ~115  | Overlaps AGENTS.md on tech stack, architecture, conventions             |
| copilot-instructions.md | ~230  | Overlaps AGENTS.md on architecture, development conventions, patterns   |

Files with no significant overlap: conductor/workflow.md (legacy, 353 lines — separate from this effort)

---

## Work Objectives

### Core Objective

Create a maintainable system where updating ONE file (AGENTS.md) keeps ALL AI agents informed, supplemented by a living progress document for dynamic state and a claude-mem pattern for cross-session memory persistence.

### Concrete Deliverables

- Consolidated `AGENTS.md` — commands, architecture, conventions, schema, quality gates, AI workflow
- Thinned `CLAUDE.md` — references AGENTS.md + Claude-specific notes only
- Thinned `GEMINI.md` — references AGENTS.md + Gemini-specific notes only
- Thinned `.github/copilot-instructions.md` — references AGENTS.md + Copilot-specific notes only
- `.sisyphus/progress/current-status.md` — living progress document template with completed/in-progress/decisions/gotchas sections
- `.sisyphus/progress/CLAUDE-MEM.md` — guide for recording observations to claude-mem
- AGENTS.md gets a new "AI Agent Communication Protocol" section documenting the full workflow

### Definition of Done

- [ ] `vp lint` passes after all file changes
- [ ] AGENTS.md contains ALL essential project context (no missing sections from current files)
- [ ] CLAUDE.md, GEMINI.md, copilot-instructions.md all start with "See AGENTS.md" reference
- [ ] `.sisyphus/progress/` directory exists with both template files present
- [ ] All file references in AGENTS.md resolve correctly (no dead links)
- [ ] Workflow section is clear enough for a new AI agent to follow

### Must Have

- AGENTS.md must contain ALL essential context from the current 4 files (nothing lost)
- Thin wrappers must preserve any platform-specific configuration (tool references, MCP configs)
- Progress template must be practical — something an agent will actually update at session end
- Workflow must be clear enough that a new AI agent reading AGENTS.md can follow it

### Must NOT Have (Guardrails)

- NO modification to `conductor/workflow.md` (legacy, leave it)
- NO changes to application code (.ts, .tsx, .js, etc.)
- NO CI/CD setup, no external service configuration
- NO new UI components or dashboards
- NO deletion of platform config files — they stay as thin wrappers for backward compat

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed.
> Acceptance criteria requiring "user manually tests/confirms" are FORBIDDEN.

### Test Decision

- **Infrastructure exists**: YES (Vitest)
- **Automated tests**: None needed for documentation/config work
- **Verification method**: File existence checks, content pattern matching, lint compliance

### QA Policy

Every task MUST include agent-executed QA scenarios. Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **File verification**: Use `grep` or `ast_grep_search` to assert specific patterns exist in modified files
- **Lint verification**: Run `vp lint` to ensure no lint errors introduced
- **Reference resolution**: Verify all internal file references resolve (files exist at referenced paths)

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (5 parallel — Tasks 2–4 do NOT depend on Task 1):
├── Task 1: Consolidate AGENTS.md as single source of truth [deep]
│   (Blocks only Task 6 — Tasks 2–4 thin existing files independently)
├── Task 2: Thin CLAUDE.md to reference AGENTS.md [quick]
├── Task 3: Thin GEMINI.md to reference AGENTS.md [quick]
├── Task 4: Thin copilot-instructions.md to reference AGENTS.md [quick]
└── Task 5: Create .sisyphus/progress/ directory + templates [quick]

Wave 2 (2 parallel — depend on Wave 1 complete):
├── Task 6: Append AI Agent Communication Protocol to AGENTS.md [writing]
│   (Depends on Task 1 — needs the `<!-- AI-AGENT-COMMUNICATION-PROTOCOL-PLACEHOLDER -->` comment in AGENTS.md)
└── Task 7: Write initial progress entry in current-status.md [quick]
    (Depends on Task 5 — needs .sisyphus/progress/ to exist)

Wave FINAL (4 parallel reviews):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Content completeness review (unspecified-high)
├── Task F3: File reference validation (unspecified-low)
└── Task F4: Scope fidelity check (deep)
→ Present results → Get explicit user okay
```

### Dependency Matrix

> **Notation**: `TASK: Blocks N | Parallel with: M, N, ...` — a task blocks another task when it must complete before the other can start; tasks listed as "parallel with" can run concurrently in the same wave.

- **1**: Blocks 6 | Parallel with: 2, 3, 4, 5
- **2**: Blocks F1-F4 | Parallel with: 1, 3, 4, 5
- **3**: Blocks F1-F4 | Parallel with: 1, 2, 4, 5
- **4**: Blocks F1-F4 | Parallel with: 1, 2, 3, 5
- **5**: Blocks 7, F1-F4 | Parallel with: 1, 2, 3, 4
- **6**: Blocks F1-F4 | Blocked by: 1
- **7**: Blocks F1-F4 | Blocked by: 5

> **Rollback**: If consolidation loses content, `git checkout HEAD~1 -- AGENTS.md CLAUDE.md GEMINI.md .github/copilot-instructions.md` restores the originals. Git history is the rollback mechanism.

### Agent Dispatch Summary

- **Wave 1**: 5 agents — 1× `deep`, 4× `quick`
- **Wave 2**: 2 agents — 1× `writing`, 1× `quick`
- **FINAL**: 4 agents — 1× `oracle`, 1× `unspecified-high`, 1× `unspecified-low`, 1× `deep`

---

### Pre-Execution Sanity Check (Run BEFORE Wave 0)

> **vp lint note**: `vp lint` runs ESLint on `.ts`/`.tsx` files. For this plan (documentation-only),
> it will be a no-op for most tasks — but it still serves as a sanity check for any accidental
> code edits and validates the markdown files are at least well-formed.

**Wave 0 (directory setup — run once before all tasks):**

```bash
mkdir -p .sisyphus/evidence
```

This creates `.sisyphus/evidence/` as a Wave 0 prerequisite so no task depends on another
having created it.

**Baseline capture** (run once, before Wave 1 starts):

**Steps**:

```bash
mkdir -p .sisyphus/evidence
wc -l AGENTS.md CLAUDE.md GEMINI.md .github/copilot-instructions.md \
  2>&1 | tee .sisyphus/evidence/baseline-line-counts.txt
```

**Expected format of output** (example):

```
  100 AGENTS.md
   99 CLAUDE.md
  115 GEMINI.md
  230 .github/copilot-instructions.md
```

Save this output to `.sisyphus/evidence/baseline-line-counts.txt`. After all tasks complete, run the same command again — AGENTS.md should be larger (consolidated), the other three should be significantly smaller (thinned).

---

## TODOs

- [ ] 1. **Consolidate AGENTS.md as single source of truth**

  **What to do**:
  **Replace** the entire contents of `AGENTS.md` in the project root with the structure below.
  This is a full overwrite — nothing from the existing AGENTS.md is preserved except the
  `<!-- AI-AGENT-COMMUNICATION-PROTOCOL-PLACEHOLDER -->` comment (inserted exactly as written)
  and the `<!--VITE PLUS START-->` / `<!--VITE PLUS END-->` markers. All other content comes
  fresh from reading all four source files.

  New structure:

  ```
  # Director Hearing Manager (Zite)

  > Enterprise case-management system for SFDPH Environmental Health Division (HHVC program).
  > Automates Director's Hearing Packet compilation for SF Health Code Article 11 enforcement.

  ## Quick Start (Commands)
  - `npm run dev` — Vite dev server (port 5173)
  - `npm run build` — `tsc && vp build` (typecheck + bundle)
  - `npm run lint` — `eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0`
  - `npm run test` — Vitest (configured inside `vite.config.ts`)
  - `npm run preview` — preview production build
  - `CI=true npm test -- --coverage` — coverage report (target >80% for new code)

  ## Technology Stack
  React 18, TypeScript ^5.9.3 (strict), Vite+ (vp CLI), Tailwind CSS 3.4,
  Radix UI + @base-ui/react, Lucide React, Framer Motion, Supabase (PostgreSQL + Auth Helpers),
  TanStack React Query 5, Zod, react-hook-form, sonner, Anthropic SDK,
  Vitest + React Testing Library (jsdom, globals: true)

  ## Architecture — 5 Pillars

  | Route            | Page                                       | Roles           |
  | ---------------- | ------------------------------------------ | --------------- |
  | `/dashboard`     | DashboardPage / InspectorDashboardPage     | All             |
  | `/complaints`    | ComplaintsPage → ComplaintEntryPage        | All             |
  | `/inspections`   | InspectionFormPage / InspectionHistoryPage | All             |
  | `/enforcement`   | EnforcementPage → HearingPacketsPage       | PM, Super Admin |
  | `/all-locations` | AllLocationsPage → LocationPage            | All             |

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

  ## Directory Structure
  - `src/pages/` — Route-level components
  - `src/components/ui/` — Shadcn/UI primitives (Radix + Tailwind)
  - `src/components/packet/` — Hearing Packet document components (print-ready React)
  - `src/components/packet/printUtils.tsx` — Print formatting utilities
  - `src/services/` — Database queries + external APIs
  - `src/hooks/` — Custom React hooks
  - `src/context/` — Global state (`AuthContext` / `AuthProvider`)
  - `src/types/` — TypeScript type definitions (e.g. `ComplaintSummary` in `src/types/complaint.ts`)
  - `src/utils/` — Utility functions (`sfhcArticle11.ts`, `validationRules.ts`)
  - `src/config/` — Configuration (`documentTemplates.ts` — source of truth for legal boilerplate)
  - `src/lib/` — Client init (`supabase.ts`)
  - `src/test/setup.ts` — Vitest setup file

  ## Database
  - Schema: `schema.sql` (12 tables, UUID PKs, RLS on all tables)
  - Migrations: `migrations/` numbered `001a_`–`001d_` (idempotent — uses `IF NOT EXISTS`/`DROP IF EXISTS`)
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
  - Do NOT use pnpm/npm/yarn directly; use `vp install` / `vp add` / `vp remove`
  - Vitest is bundled — import test utilities from `vite-plus/test`, NOT from `vitest`
  - Type-aware linting: `vp lint --type-aware` works out of the box
  <!--VITE PLUS END-->

  ## Testing
  - Vitest + React Testing Library with `jsdom` and `globals: true`
  - Test files live in `__tests__/` next to the module they cover
  - Mock pattern for Anthropic SDK: `vi.hoisted()` + `vi.mock('@anthropic-ai/sdk')` — see `src/services/__tests__/aiService.test.ts`
  - Run coverage: `CI=true npm test -- --coverage`
  - Target >80% coverage for new service/utility code

  ## Quality Gates
  Before marking done: tests pass, coverage >80%, lint clean, code style guides followed

  ## Repo Quirks
  - `eslint.config.js` exists (flat config format) — there is no `.eslintrc.*`
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
  <!-- AI-AGENT-COMMUNICATION-PROTOCOL-PLACEHOLDER -->
  ```

  **Intentional corrections** — the current AGENTS.md contains three factual inaccuracies that MUST be fixed:
  - **Bad**: `(no eslint config file exists)` → **Fix**: `eslint.config.js` (flat config format) DOES exist. Note that there is NO `.eslintrc.*` file — the project uses the new flat config format instead.
  - **Bad**: `no Prettier` → **Fix**: Prettier IS installed (`package.json` devDependencies + `lint-staged` runs `prettier --write` on staged files). There is no standalone `.prettierrc` file — Prettier respects defaults + ESLint config for formatting.
  - **Bad**: `no pre-commit hooks` → **Fix**: Husky IS configured (`"prepare": "husky"` in `package.json`; `.husky/pre-commit` exists). The hook runs `lint-staged` which lints and formats staged files.

  **Vite+ markers**: The `<!--VITE PLUS START-->` and `<!--VITE PLUS END-->` HTML comment markers MUST be preserved in the consolidated AGENTS.md. These markers delineate the Vite+ auto-generated section and are part of the toolchain protocol. The Vite+ content (commands, pitfalls, review checklist) moves into the main body of AGENTS.md but the markers stay as-is.

  **Critical preservation checklist** — ensure NOTHING is lost from current files:
  - [ ] Vite+ section from AGENTS.md (all commands, pitfalls, review checklist)
  - [ ] Architecture details from CLAUDE.md (5-pillar nav table, data layer services, hearing packet pipeline, packet statuses)
  - [ ] Development conventions from copilot-instructions.md (code org, type safety, components/hooks patterns, services pattern, document generation, QueryClient setup)
  - [ ] Project context from GEMINI.md (SFDPH HHVC program, regulatory compliance, key data entities)
  - [ ] MCP server references (Playwright, PostgreSQL)
  - [ ] Quality gates from AGENTS.md (tests, coverage, lint, style guides)
  - [ ] Repo quirks (path alias, test locations, Vitest globals, Anthropic mock pattern, env var prefix, husky/lint-staged/prettier)
  - [ ] Environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
  - [ ] Skills references (`impeccable`, `shadcn`, `supabase-postgres-best-practices`, `using-superpowers`)
  - [ ] `postinstall` / PDF worker sync behavior

  **Must NOT do**:
  - Do NOT remove any Vite+ instructions (critical for build toolchain)
  - Do NOT remove the `skills-lock.json` reference
  - Do NOT add the `/impeccable` command reference unless it already exists in a current file (it does not)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Requires careful reading of 4 existing files, deduplication, and restructuring without losing information. High attention to detail needed.
  - **Skills**: `[]`
  - **Skills Evaluated but Omitted**: None needed for markdown editing

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4, 5)
  - **Blocks**: Task 6
  - **Blocked By**: None (can start immediately)

  **References**:
  - `AGENTS.md` — Current source (read entirely before rewriting)
  - `CLAUDE.md` — Contains architecture details to absorb
  - `GEMINI.md` — Contains project context and regulatory details
  - `.github/copilot-instructions.md` — Contains development conventions and patterns
  - `skills-lock.json` — Skills configuration reference
  - `src/utils/sfhcArticle11.ts` — Legal constraint reference
  - `src/config/documentTemplates.ts` — Document config pattern reference
  - `src/utils/validationRules.ts` — SFHC validation reference
  - `src/components/packet/printUtils.tsx` — Print utilities reference
  - `src/services/__tests__/aiService.test.ts` — Anthropic mock pattern reference

  **Acceptance Criteria**:

  **QA Scenarios**:

  ```
  Scenario: Placeholder comment is correctly inserted
    Tool: Bash (grep)
    Preconditions: AGENTS.md rewritten with placeholder comment
    Steps:
      1. grep "AI-AGENT-COMMUNICATION-PROTOCOL-PLACEHOLDER" AGENTS.md → expect EXACTLY 1 match
    Expected Result: Placeholder exists exactly once (enables Task 6 to find and replace it)
    Failure Indicators: Placeholder missing, or placeholder appears more than once
    Evidence: .sisyphus/evidence/task-1-placeholder.txt

  Scenario: AGENTS.md contains ALL essential sections
    Tool: Bash (grep)
    Preconditions: AGENTS.md has been rewritten
    Steps:
      1. grep "Quick Start" AGENTS.md → expect match
      2. grep "Technology Stack" AGENTS.md → expect match
      3. grep -E "5 Pillars|Architecture" AGENTS.md → expect match
      4. grep -E "Core Data Flow|Complaint → Inspection" AGENTS.md → expect match
      5. grep -E "Directory Structure|src/pages/" AGENTS.md → expect match
      6. grep -E "Database|schema.sql|migrations/" AGENTS.md → expect match
      7. grep -E "TypeScript Rules|No any" AGENTS.md → expect match
      8. grep -E "Vite\+|vp dev|vp test|vp lint" AGENTS.md → expect match (at least 3 of these)
      9. grep -E "RBAC|Inspector|Admin|Program Manager|Super Admin" AGENTS.md → expect match
      10. grep -E "SF Health Code Article 11|Legal Constraints" AGENTS.md → expect match
      11. grep "AI Agent Communication Protocol" AGENTS.md → expect match (placeholder at minimum)
      12. grep -E "Quality Gates|Before marking done" AGENTS.md → expect match
      13. grep "Repo Quirks" AGENTS.md → expect match
      14. grep "Environment Variables" AGENTS.md → expect match
      15. grep "Skills & MCP Servers" AGENTS.md → expect match
      16. grep "VITE PLUS START" AGENTS.md → expect match (1 occurrence)
      17. grep "VITE PLUS END" AGENTS.md → expect match (1 occurrence)
    Expected Result: All 17 grep patterns match
    Failure Indicators: Any grep returns no match
    Evidence: .sisyphus/evidence/task-1-agents-completeness.txt

  Scenario: No content lost from original files
    Tool: Bash (grep)
    Preconditions: AGENTS.md rewritten
    Steps:
      1. grep "react-hook-form" AGENTS.md → expect match (from copilot-instructions)
      2. grep -E "print-ready|hearing packet" AGENTS.md → expect match
      3. grep -E "5-pillar|five pillar" AGENTS.md → expect match (from GEMINI.md)
      4. grep -E "AuthContext|AuthProvider" AGENTS.md → expect match
      5. grep "Playwright" AGENTS.md → expect match
      6. grep "validationRules" AGENTS.md → expect match
      7. grep "postinstall" AGENTS.md → expect match
      8. grep "@base-ui/react" AGENTS.md → expect match
    Expected Result: All 8 content patterns present
    Evidence: .sisyphus/evidence/task-1-agents-retention.txt
  ```

  **Evidence to Capture**:
  - [ ] `.sisyphus/evidence/task-1-placeholder.txt` — Placeholder insertion confirmation
  - [ ] `.sisyphus/evidence/task-1-agents-completeness.txt` — All section grep results
  - [ ] `.sisyphus/evidence/task-1-agents-retention.txt` — Content retention grep results

  **Commit**: YES
  - Message: `docs(agents): consolidate AGENTS.md as single source of truth for AI agents`
  - Files: `AGENTS.md`
  - Pre-commit: `vp lint`

---

- [ ] 2. **Thin CLAUDE.md to reference AGENTS.md**

  **What to do**:
  Rewrite `CLAUDE.md` to be a thin wrapper that references AGENTS.md as the source of truth, plus any Claude Code-specific instructions.

  New content:

  ```markdown
  # CLAUDE.md

  > **Source of truth**: See `AGENTS.md` for project commands, architecture, conventions,
  > database, TypeScript rules, and quality gates.

  ## Claude-Specific Notes

  ### MCP Servers

  - Playwright MCP — browser automation testing
  - PostgreSQL MCP — schema inspection

  ### TypeScript Style Guide

  The authoritative reference is `conductor/code_styleguides/typescript.md`
  (Google TypeScript Style Guide). Key rules: no `any`, named exports only,
  no type assertions without justification, single quotes, semicolons required.

  ### Learning

  - This project follows shadcn patterns (see `components.json`)
  - Use `sonner` for toast notifications (`toast.*()` API)

  ### Architecture TL;DR

  Entry: src/main.tsx → App.tsx (BrowserRouter > AuthProvider > AppContent)
  5 pillars: Dashboard, Complaints, Inspections, Enforcement/Hearings, Locations
  Data flow: Complaint → Inspection → Violations → Chronology → Hearing Packet
  ```

  Reference the existing MCP server config (`Playwright`, `PostgreSQL`).

  **Must NOT do**:
  - Do NOT delete the file — keep as thin wrapper
  - Do NOT duplicate AGENTS.md content — only Claude-specific notes

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Trivial file rewrite, small scope
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4, 5)
  - **Blocks**: None
  - **Blocked By**: None (can start immediately)

  **References**:
  - `CLAUDE.md` — Current file to rewrite
  - `AGENTS.md` — Single reference for shared content

  **Acceptance Criteria**:

  **QA Scenarios**:

  ```
  Scenario: CLAUDE.md references AGENTS.md as source of truth
    Tool: Bash (grep)
    Preconditions: CLAUDE.md rewritten
    Steps:
      1. grep "AGENTS.md" CLAUDE.md → expect match (the reference)
      2. grep -E "Source of truth|See AGENTS.md" CLAUDE.md → expect match
      3. wc -l CLAUDE.md → expect less than 40 lines (was 99)
    Expected Result: File is thin, references AGENTS.md
    Failure Indicators: No AGENTS.md reference found, or file >40 lines
    Evidence: .sisyphus/evidence/task-2-claude-thin.txt
  ```

  **Evidence to Capture**:
  - [ ] `.sisyphus/evidence/task-2-claude-thin.txt`

  **Commit**: YES
  - Message: `docs(claude): thin to reference AGENTS.md as source of truth`
  - Files: `CLAUDE.md`
  - Pre-commit: `vp lint`

---

- [ ] 3. **Thin GEMINI.md to reference AGENTS.md**

  **What to do**:
  Rewrite `GEMINI.md` to be a thin wrapper referencing AGENTS.md for shared content, plus any Gemini-specific instructions.

  New content:

  ```markdown
  # GEMINI.md

  > **Source of truth**: See `AGENTS.md` for project commands, architecture, conventions,
  > database, and quality gates.

  ## Gemini-Specific Notes

  ### MCP Servers

  - Supabase MCP configured in `.gemini/settings.json`

  ### Project at a Glance

  Zite is an enterprise operational tool for SFDPH Environmental Health Division (HHVC program).
  It automates Director's Hearing Packet compilation for SF Health Code Article 11 enforcement.
  ```

  **Must NOT do**:
  - Do NOT delete the file
  - Do NOT duplicate AGENTS.md content

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Trivial file rewrite
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4, 5)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `GEMINI.md` — Current file
  - `AGENTS.md` — Source reference
  - `.gemini/settings.json` — Gemini config

  **Acceptance Criteria**:

  **QA Scenarios**:

  ```
  Scenario: GEMINI.md references AGENTS.md
    Tool: Bash (grep)
    Preconditions: GEMINI.md rewritten
    Steps:
      1. grep "AGENTS.md" GEMINI.md → expect match
      2. wc -l GEMINI.md → expect less than 30 lines (was 115)
    Expected Result: File is thin, references AGENTS.md
    Evidence: .sisyphus/evidence/task-3-gemini-thin.txt
  ```

  **Evidence to Capture**:
  - [ ] `.sisyphus/evidence/task-3-gemini-thin.txt`

  **Commit**: YES
  - Message: `docs(gemini): thin to reference AGENTS.md as source of truth`
  - Files: `GEMINI.md`
  - Pre-commit: `vp lint`

---

- [ ] 4. **Thin copilot-instructions.md to reference AGENTS.md**

  **What to do**:
  Rewrite `.github/copilot-instructions.md` to be a thin wrapper referencing AGENTS.md for shared content, plus Copilot-specific notes. This file was the largest (230 lines) and has the most duplication.

  New content:

  ```markdown
  # Copilot Instructions for Director Hearing Manager

  > **Source of truth**: See `AGENTS.md` for project commands, architecture,
  > conventions, database, and all development patterns.

  ## Copilot-Specific Notes

  ### Architecture Quick Reference

  Entry: src/main.tsx → App.tsx (BrowserRouter > AuthProvider > AppContent)
  5 pillars: Dashboard, Complaints, Inspections, Enforcement/Hearings, Locations

  ### Key Files

  - src/lib/supabase.ts — Supabase client
  - src/config/documentTemplates.ts — Legal boilerplate (never hardcode)
  - src/components/ui/ — Shadcn/UI primitives
  - src/types/complaint.ts — ComplaintSummary type

  ### Important Patterns

  - Always use ComplaintSummary from src/types/complaint.ts for complaint data
  - Use useQuery/useMutation from TanStack React Query for data fetching
  - Never hardcode legal boilerplate — use documentTemplates.ts
  - SF Health Code Article 11 only — see src/utils/sfhcArticle11.ts

  ### MCP Servers in This Project

  - Playwright MCP — browser automation testing
  - Postgres MCP — direct schema inspection
  ```

  **Must NOT do**:
  - Do NOT delete the file
  - Do NOT duplicate AGENTS.md content
  - Do NOT reference Copilot CLI flags that don't exist (keep it simple)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Trivial file rewrite
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 5)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `.github/copilot-instructions.md` — Current file
  - `AGENTS.md` — Source reference

  **Acceptance Criteria**:

  **QA Scenarios**:

  ```
  Scenario: copilot-instructions.md references AGENTS.md
    Tool: Bash (grep)
    Preconditions: File rewritten
    Steps:
      1. grep "AGENTS.md" .github/copilot-instructions.md → expect match
      2. wc -l .github/copilot-instructions.md → expect less than 50 lines (was 230)
    Expected Result: File is thin, references AGENTS.md
    Evidence: .sisyphus/evidence/task-4-copilot-thin.txt
  ```

  **Evidence to Capture**:
  - [ ] `.sisyphus/evidence/task-4-copilot-thin.txt`

  **Commit**: YES
  - Message: `docs(copilot): thin to reference AGENTS.md as source of truth`
  - Files: `.github/copilot-instructions.md`
  - Pre-commit: `vp lint`

---

- [ ] 5. **Create .sisyphus/progress/ directory with templates**

  **What to do**:
  Create `.sisyphus/progress/` directory and two template files:

  **File 1: `.sisyphus/progress/current-status.md`** — The living progress document

  ```markdown
  # Project Status — {YYYY-MM-DD HH:MM}

  ## Recently Completed

  - [ ] {task description} ({time range if known})

  ## In Progress

  - [ ] {what's being worked on now}

  ## Key Decisions Made

  - {decision}: {rationale}

  ## Changed Patterns / Gotchas

  - {pattern change or gotcha discovered}

  ## Breaking Changes / Areas of Caution

  - {anything that might break if touched incautiously}

  ## Next Up

  - {what's coming next}
  ```

  **File 2: `.sisyphus/progress/CLAUDE-MEM.md`** — Guide for claude-mem observations

  ```markdown
  # Claude-Mem Observation Recording

  claude-mem stores persistent observations across sessions. Use `observation_add` to
  record important decisions, patterns, and gotchas so future AI sessions are aware.

  ## When to Record

  Record an observation when:

  - A design decision is made (with rationale)
  - A pattern is established or changed
  - A gotcha/workaround is discovered
  - An architecture constraint is newly enforced
  - A dependency is added or removed (with reason)
  - A migration is applied (what and why)

  ## What to Record

  Use this structure:
  ```

  observation_add(
  content: "{decision/pattern}: {what was decided/found}",
  kind: "decision|bugfix|feature|refactor|discovery|change",
  metadata: {
  rationale: "why this was chosen",
  alternatives: "what was considered",
  affected_files: "paths of affected files"
  }
  )

  ```

  ## Observation Kinds

  - `decision` — Architecture or design decisions
  - `bugfix` — Root cause and fix for bugs
  - `feature` — New feature additions
  - `refactor` — Code restructuring
  - `discovery` — Gotchas, workarounds, insights
  - `change` — Dependency updates, config changes

  ## Quick Checklist (End of Session)

  - [ ] Recorded key decisions as `decision` observations
  - [ ] Recorded gotchas as `discovery` observations
  - [ ] Recorded dependency changes as `change` observations
  - [ ] Recorded bugfixes as `bugfix` observations
  ```

  > **Note**: If claude-mem plugin is not available, record observations manually in
  > `.sisyphus/progress/current-status.md` under "Key Decisions" and "Changed Patterns / Gotchas".
  > The progress document serves as the fallback for manual memory persistence.

  **Must NOT do**:
  - Do NOT add sample observations — the file is a reference guide only
  - Do NOT create a `.sisyphus/progress/` entry for this plan itself (first actual update will be post-implementation)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple file creation, clear template
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 4)
  - **Blocks**: Task 7
  - **Blocked By**: None

  **References**:
  - `.sisyphus/drafts/` — Existing draft pattern
  - `.sisyphus/notepads/` — Existing notepad files

  **Acceptance Criteria**:

  **QA Scenarios**:

  ```
  Scenario: Progress directory and templates exist
    Tool: Bash (ls + grep)
    Preconditions: Files written
    Steps:
      1. ls .sisyphus/progress/ → expect directory exists
      2. test -f .sisyphus/progress/current-status.md → expect 0 (file exists)
      3. test -f .sisyphus/progress/CLAUDE-MEM.md → expect 0 (file exists)
      4. grep "Recently Completed\|In Progress\|Key Decisions" .sisyphus/progress/current-status.md → expect match
      5. grep "When to Record\|observation_add" .sisyphus/progress/CLAUDE-MEM.md → expect match
    Expected Result: All files exist with correct content
    Evidence: .sisyphus/evidence/task-5-progress-files.txt
  ```

  **Evidence to Capture**:
  - [ ] `.sisyphus/evidence/task-5-progress-files.txt`

  **Commit**: YES
  - Message: `docs(progress): create .sisyphus/progress/ directory with templates`
  - Files: `.sisyphus/progress/current-status.md`, `.sisyphus/progress/CLAUDE-MEM.md`
  - Pre-commit: `vp lint`

---

- [ ] 6. **Append AI Agent Communication Protocol to AGENTS.md**

  **What to do**:
  Replace the `<!-- AI-AGENT-COMMUNICATION-PROTOCOL-PLACEHOLDER -->` comment in AGENTS.md with the full AI Agent Communication Protocol section. This is the workflow documentation that ties together the whole system.

  Section to add (replace the HTML comment placeholder):

  ```markdown
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
  ```

  AGENTS.md ← THE authoritative source of truth
  ├── CLAUDE.md ← "See AGENTS.md" + Claude-specific MCP/config notes
  ├── GEMINI.md ← "See AGENTS.md" + Gemini-specific MCP/config notes
  └── .github/copilot-instructions.md ← "See AGENTS.md" + Copilot-specific notes

  ```

  When project context changes → update ONLY AGENTS.md. All platforms pick it up.
  ```

  **Must NOT do**:
  - Do NOT remove any content above the `<!-- AI-AGENT-COMMUNICATION-PROTOCOL-PLACEHOLDER -->` comment

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: Documentation/prose writing, clear communication of workflow
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (uses AGENTS.md from Task 1)
  - **Parallel Group**: Sequential after Wave 1
  - **Blocks**: None
  - **Blocked By**: Task 1 (needs AGENTS.md to exist with placeholder)

  **References**:
  - `AGENTS.md` — After Task 1 completes, to find and replace the `<!-- AI-AGENT-COMMUNICATION-PROTOCOL-PLACEHOLDER -->` comment
  - `conductor/workflow.md` — For git notes format reference
  - `.sisyphus/progress/current-status.md` — Reference to the progress template
  - `.sisyphus/progress/CLAUDE-MEM.md` — Reference to the claude-mem guide

  **Acceptance Criteria**:

  **QA Scenarios**:

  ```
  Scenario: AI Agent Communication Protocol is in AGENTS.md
    Tool: Bash (grep)
    Preconditions: AGENTS.md updated
    Steps:
      1. grep "AI Agent Communication Protocol" AGENTS.md → expect match
      2. grep "Tier 1 — AGENTS.md (Static Context)" AGENTS.md → expect match
      3. grep "Tier 2 —" AGENTS.md → expect match
      4. grep "Tier 3 —" AGENTS.md → expect match
      5. grep "Tier 4 —" AGENTS.md → expect match
      6. grep "Start of AI session" AGENTS.md → expect match
      7. grep "End of AI session" AGENTS.md → expect match
      8. grep "Configuration Layers" AGENTS.md → expect match
      9. grep "CLAUDE.md ←" AGENTS.md → expect match
      10. grep "GEMINI.md ←" AGENTS.md → expect match
    Expected Result: All 10 sections present in AGENTS.md
    Evidence: .sisyphus/evidence/task-6-protocol-completeness.txt

  Scenario: No placeholder comment remains
    Tool: Bash (grep)
    Preconditions: AGENTS.md updated
    Steps:
      1. grep "AI-AGENT-COMMUNICATION-PROTOCOL-PLACEHOLDER" AGENTS.md → expect NO match
    Expected Result: HTML comment placeholder replaced with actual protocol content
    Evidence: .sisyphus/evidence/task-6-no-placeholder.txt
  ```

  **Evidence to Capture**:
  - [ ] `.sisyphus/evidence/task-6-protocol-completeness.txt`
  - [ ] `.sisyphus/evidence/task-6-no-placeholder.txt`

  **Commit**: YES (group with Task 7)
  - Message: `docs(agents): add AI Agent Communication Protocol section`
  - Files: `AGENTS.md`
  - Pre-commit: `vp lint`

---

- [ ] 7. **Write initial progress entry in current-status.md**

  **What to do**:
  After Wave 1 completes, create the initial progress entry documenting this plan's completion.

  Write to `.sisyphus/progress/current-status.md` with the current date at time of execution:

  ```markdown
  # Project Status — {YYYY-MM-DD}

  ## Recently Completed

  - [ ] AI Agent Communication System — consolidated AGENTS.md, thinned platform configs,
        created progress tracking system, documented claude-mem pattern, added workflow protocol

  ## In Progress

  - (none — this was the setup work)

  ## Key Decisions Made

  - AGENTS.md is now the single source of truth for all AI agents
  - CLAUDE.md, GEMINI.md, copilot-instructions.md all reference AGENTS.md for shared content
  - Living progress document lives at .sisyphus/progress/current-status.md
  - claude-mem observations follow documented patterns in CLAUDE-MEM.md

  ## Changed Patterns / Gotchas

  - Start of AI session: read progress + AGENTS.md + git log before working
  - End of AI session: update progress, record claude-mem observations, commit

  ## Next Up

  - Normal feature work — update this file at session end
  ```

  **Must NOT do**:
  - Do NOT create a new boulder or plan
  - Do NOT modify boulder.json

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple file write from template
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential after Wave 1
  - **Blocks**: None
  - **Blocked By**: Task 5 (needs .sisyphus/progress/ to exist)

  **References**:
  - `.sisyphus/progress/current-status.md` — Template to fill out
  - Commit history from Tasks 1-6 — For the "Recently Completed" section

  **Acceptance Criteria**:

  **QA Scenarios**:

  ```
  Scenario: Initial progress entry exists
    Tool: Bash (grep)
    Preconditions: Entry written
    Steps:
      1. grep "Recently Completed" .sisyphus/progress/current-status.md → expect match
      2. grep "AI Agent Communication" .sisyphus/progress/current-status.md → expect match
      3. grep "Next Up" .sisyphus/progress/current-status.md → expect match
    Expected Result: Progress entry documents this plan's work
    Evidence: .sisyphus/evidence/task-7-initial-progress.txt
  ```

  **Evidence to Capture**:
  - [ ] `.sisyphus/evidence/task-7-initial-progress.txt`

  **Commit**: YES (group with Task 6)
  - Message: `docs(progress): record initial status entry for AI comms system`
  - Files: `.sisyphus/progress/current-status.md`
  - Pre-commit: `vp lint`

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [ ] F1. **Plan Compliance Audit** — `oracle`
      Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, grep for required patterns). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in `.sisyphus/evidence/`. Compare deliverables against plan.
      Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Content Completeness Review** — `unspecified-high`
      Read all modified files: AGENTS.md, CLAUDE.md, GEMINI.md, `.github/copilot-instructions.md`, `.sisyphus/progress/current-status.md`, `.sisyphus/progress/CLAUDE-MEM.md`. Verify:
  - AGENTS.md has ALL essential sections (Quick Start, Tech Stack, Architecture, Data Flow, Directory, Database, TypeScript Rules, UI Conventions, RBAC, Legal Constraints, Vite+, Quality Gates, AI Agent Communication Protocol)
  - Thin wrappers actually reference AGENTS.md
  - No content loss from original files
  - Progress templates are complete and usable
  - Workflow is clear and actionable
    Output: `Files [N/N complete] | Content Loss [NONE/FOUND] | VERDICT`

- [ ] F3. **File Reference Validation** — `unspecified-low`
      Verify all file references in modified files resolve. Specifically:
  - Every `src/...` path referenced in AGENTS.md and thin wrappers must exist as a real file
  - Every `.sisyphus/...` path referenced must exist
  - Every relative reference (`../`, `./`) must resolve correctly
  - No dead links, broken cross-references, or non-existent file paths
  - **Requirement**: ALL explicit file path references must resolve — not a sample, not a subset — every one.
    Output: `References [N/N resolve] | Broken [NONE/list] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
      For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination.
      Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **1**: `docs(agents): consolidate AGENTS.md as single source of truth for AI agents` — `AGENTS.md`
- **2**: `docs(claude): thin to reference AGENTS.md as source of truth` — `CLAUDE.md`
- **3**: `docs(gemini): thin to reference AGENTS.md as source of truth` — `GEMINI.md`
- **4**: `docs(copilot): thin to reference AGENTS.md as source of truth` — `.github/copilot-instructions.md`
- **5**: `docs(progress): create .sisyphus/progress/ directory with templates` — `.sisyphus/progress/current-status.md`, `.sisyphus/progress/CLAUDE-MEM.md`
- **6+7**: `docs(agents): add AI Agent Communication Protocol and initial progress entry` — `AGENTS.md`, `.sisyphus/progress/current-status.md`

---

## Success Criteria

### Verification Commands

```bash
vp lint                    # Expected: no errors
grep "AGENTS.md" CLAUDE.md   # Expected: match (references source of truth)
grep "AGENTS.md" GEMINI.md   # Expected: match (references source of truth)
grep "AGENTS.md" .github/copilot-instructions.md  # Expected: match
grep "Tier 1" AGENTS.md      # Expected: match (protocol section exists)
test -f .sisyphus/progress/current-status.md  # Expected: file exists
test -f .sisyphus/progress/CLAUDE-MEM.md       # Expected: file exists
```

### Final Checklist

- [ ] All "Must Have" present (AGENTS.md consolidated, wrappers thin, progress template exists, workflow documented)
- [ ] All "Must NOT Have" absent (no code changes, no deleted platform files, no conductor/workflow.md edits)
- [ ] All 4 thin wrapper files reference AGENTS.md
- [ ] Progress directory exists with both template files
- [ ] AI Agent Communication Protocol section complete in AGENTS.md
- [ ] `vp lint` passes
