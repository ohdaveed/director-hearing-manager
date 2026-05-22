# Project Status — 2026-05-20

## Recently Completed

- **Playwright E2E SOP Coverage:**
  - Added `playwright.config.ts` and `test:e2e` + `e2e:seed` npm scripts.
  - Created `scripts/seed-e2e-hearing-packet.cjs` to seed a Program Manager user, complaint, inspection, photo, chronology, service log, and SOP-compliant hearing packet.
  - Added stable `data-testid` hooks across escalation, packet list/detail, readiness panel, and packet preview sections.
  - Added `e2e/hearing-packet-sop.spec.ts` covering SOP validation rules, packet sequence, exhibit labels, and photo layout.
  - Updated Vitest config to exclude `e2e/**` and constrain includes to `src/**/*.{test,spec}.{ts,tsx}`.
- **Environment Template Workflow:**
  - Added `.env.template.pass` as an alternate Proton Pass template spelling with placeholders for Supabase, Atlas, and AI provider values.
  - Documented Proton Pass template naming and AI/local tooling environment variables in `AGENTS.md`.
- **Draft Compliance Track (Phase 4):**
  - Implemented `saveComplianceAnalysis` in `packetService.ts` with full type safety (`ComplianceResult`, `PacketData`).
  - Created `elementToPdfBlob` utility for multi-page PDF generation from HTML.
  - Implemented Supabase Storage integration for persisting final hearing packets.
  - Added "Save Final PDF" action to the Hearing Packet Preview UI with robust toast notifications.
  - Achieved >90% test coverage for new service logic in `src/services/__tests__/packetService.test.ts`.
- **Communication Protocol:**
  - Consolidated `AGENTS.md` as the authoritative project context.
  - Thinned platform-specific wrappers (`CLAUDE.md`, `GEMINI.md`, Copilot).
  - Established `.sisyphus/progress/` infrastructure.
- **Hearing Packet Workflow:**
  - Enforced status transitions through workflow logic with history tracking.
  - Restricted status dropdown to valid transitions and role-appropriate options.
- **Atlas Database Schema Management:**
  - Created `atlas.hcl` configuration with `director_hearing_manager` env, migration dir config, and linting rules.
  - Organized schema into structured `sql/` directory (one-file-per-object pattern) with:
    - `sql/types/` — 26 ENUM type definitions (including migration 001e additions)
    - `sql/tables/` — 15 table definitions (all FK renames from 004 applied)
    - `sql/functions/` — 2 PostgreSQL functions
    - `sql/views/` — 1 database view
    - `sql/indexes/` — Complete index set
    - `sql/extensions/` — Extension management
  - Updated `schema.sql` as composite import manifest with `-- atlas:import` directives.
  - Added npm scripts: `db:diff`, `db:apply`, `db:lint`, `db:validate`, `db:inspect`.
  - Updated `.env.example` with Atlas environment variables.
  - Updated `AGENTS.md` Database section with Atlas workflow.
  - Updated `CLAUDE.md` with Atlas-specific setup instructions.

## In Progress

- **Draft Compliance Track (Phase 1-3 Review):**
  - Verification of full end-to-end flow from upload to storage.

## Key Decisions Made

- Use `elementToPdfBlob` (html2canvas + jsPDF) for immediate "pixel-perfect" PDF generation from React components.
- Store final packets in Supabase `documents` bucket under `packets/${packetId}/`.
- Update `notes` field in database with the public URL of the final stored PDF.
- **Atlas schema-as-code**: Use `sql/` one-file-per-object directory as the desired state. Atlas `migrate diff` compares this against `migrations/` to generate new migrations. RLS policies remain in existing migration files (not in the schema directory) since they require Postgres-specific auth context.
- **Proton Pass template naming**: `.env.pass.template.example` remains the committed example for `scripts/populate-env.cjs`; `.env.template.pass` is maintained as an alternate suffix-based template and should be copied to `.env.pass.template` before `npm run env:inject`.

## Changed Patterns / Gotchas

- **Vitest scope**: `vite.config.ts` now explicitly includes `src/**/*.{test,spec}.{ts,tsx}` and excludes `e2e/**` to prevent Playwright specs from running in `vp test`.
- **PDF Blobs:** `jsPDF` output should be set to `"blob"` for direct upload to storage.
- **Supabase Storage:** Ensure `documents` bucket exists and has correct RLS policies for uploads/public access.
- **Popup Blockers:** `window.open` called after async generation may be blocked; consider direct download or link in toast for future improvement.
- **Atlas checksum**: The `migrations/` directory lacks an `atlas.sum` checksum file because migrations were handwritten. Running `atlas migrate diff` for the first time will generate it (requires a dev database). Until then, Atlas commands will show a checksum warning — this is expected during initial setup.
- **Docker requirement**: Atlas `migrate diff`/`lint`/`validate` require a dev database URL (`--dev-url`). The project defaults to `docker://postgres/17/dev` — if Docker is unavailable, use a local or Supabase shadow database instead.
- **RLS not in schema directory**: Row-level security policies remain in `migrations/001c_rls_policies.sql` and `001d_rls_remaining_and_fks.sql`. They are not part of the `sql/` desired state because Atlas diffing of RLS policies against live Supabase auth can be unreliable. Always manage RLS as explicit SQL migrations.

## Next Up

- Complete remaining tasks in `conductor/tracks.md`.
- Run `npm run e2e:seed` + `npm run test:e2e` against a configured Supabase environment.
- Enhance PDF generation fidelity (consider `@react-pdf/renderer` if tiling cuts become an issue).
- Refine Hearing Order Editor integration with the final packet storage.
- Run `atlas migrate diff initial_sum` with a dev database to generate the checksum file.
