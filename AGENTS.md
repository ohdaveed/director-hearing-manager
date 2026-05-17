# Director Hearing Manager

## Commands

- `npm run dev` — Vite dev server (port 5173)
- `npm run build` — `tsc` then `vite build` (both typecheck and bundle)
- `npm run lint` — `eslint . --ext ts,tsx --max-warnings 0` (no eslint config file exists)
- `npm run test` — Vitest (configured inside `vite.config.ts`, not a standalone config)
- `npm run test -- src/path/to/__tests__/file.test.ts` — single test file
- `npm run preview` — preview production build

## Repo quirks

- **No ESLint config file** (.eslintrc\*), **no Prettier**, **no CI workflows**, **no Docker**, **no pre-commit hooks**
- `@/` path alias maps to `src/` (configured in both tsconfig.json and vite.config.ts)
- Tests live in `__tests__/` next to source files, not in a top-level directory
- Vitest uses jsdom environment with `globals: true` — `describe`/`it`/`expect`/`vi` are global imports
- Mock pattern for Anthropic SDK: `vi.hoisted()` + `vi.mock('@anthropic-ai/sdk')` — see `src/services/__tests__/aiService.test.ts`
- Environment vars prefixed `VITE_` (Vite convention) live in `.env` (gitignored), template in `.env.example`

## Architecture

- **Entry**: `src/main.tsx` → `App.tsx` (BrowserRouter > AuthProvider > AppContent)
- **Route guards** live in `App.tsx` (role-based nav filtering + redirect), not per-page
- **5 pillars**: Dashboard, Complaints, Inspections, Enforcement/Hearings, Locations
- **Supabase client**: `src/lib/supabase.ts`
- **Document boilerplate**: `src/config/documentTemplates.ts` — never hardcode legal text
- **Packet components**: `src/components/packet/` — print-ready React, exported to PDF via browser print

## Database

- **Schema**: `schema.sql` (12 tables, UUID PKs, RLS on all tables)
- **Migrations**: `migrations/` numbered `001a_`–`001d_` (idempotent — uses `IF NOT EXISTS`/`DROP IF EXISTS`)
- All tables have `created_at`/`updated_at` with auto-update trigger; most have `deleted_at` soft-delete
- Linked skill: `supabase-postgres-best-practices` (see `skills-lock.json`)

## Quality gates

Before marking done: tests pass, coverage >80%, lint clean, code style guides followed

## Existing instruction files (reference, not duplicate)

- `conductor/workflow.md` — legacy task lifecycle (333 lines)
- `.github/copilot-instructions.md` — dev conventions and architecture details (224 lines)
- `conductor/code_styleguides/` — Google-style guides for TS/JS/HTML/CSS
