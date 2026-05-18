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

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a modern toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, and Oxfmt. Vite+ wraps these tools and package manager commands in a single, global CLI called `vp`. Vite+ is distinct from Vite, but it invokes Vite through `vp dev` and `vp build`.

## Vite+ Workflow

`vp` is a global binary that handles the full development lifecycle. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

### Vite+ Commands

- dev - Run the development server
- build - Build for production
- lint - Lint code
- test - Run tests
- fmt - Format code
- lib - Build library
- migrate - Migrate an existing project to Vite+
- new - Create a new monorepo package (in-project) or a new project (global)
- run - Run tasks from `package.json` scripts

These commands map to their corresponding tools. For example, `vp dev --port 3000` runs Vite's dev server and works the same as Vite. `vp test` runs JavaScript tests through the bundled Vitest. The version of all tools can be checked using `vp --version`. This is useful when researching documentation, features, and bugs.

### Package Manager Commands

Vite+ automatically detects and wraps the underlying package manager such as pnpm, npm, or Yarn through the `packageManager` field in `package.json` or package manager-specific lockfiles.

- install - Install all dependencies, or add packages if package names are provided
- add - Add packages to dependencies
- remove - Remove packages from dependencies
- dlx - Execute a package binary without installing it as a dependency
- info - View package information from the registry, including latest versions
- link - Link packages for local development
- outdated - Check for outdated packages
- pm - Forward a command to the package manager
- unlink - Unlink packages
- update - Update packages to their latest versions
- why - Show why a package is installed

## Common Pitfalls

- **Using the package manager directly:** Do not use pnpm, npm, or Yarn directly. Vite+ can handle all package manager operations.
- **Always use Vite commands to run tools:** Don't attempt to run `vp vitest` or `vp oxlint`. They do not exist. Use `vp test` and `vp lint` instead.
- **Running scripts:** Vite+ commands take precedence over `package.json` scripts. If there is a `test` script defined in `scripts` that conflicts with the built-in `vp test` command, run it using `vp run test`.
- **Do not install Vitest, Oxlint, Oxfmt, or tsdown directly:** Vite+ wraps these tools. They must not be installed directly. You cannot upgrade these tools by installing their latest versions. Always use Vite+ commands.
- **Import JavaScript modules from `vite-plus`:** Instead of importing from `vite` or `vitest`, all modules should be imported from the project's `vite-plus` dependency. For example, `import { defineConfig } from 'vite-plus';` or `import { expect, test, vi } from 'vite-plus/test';`. You must not install `vitest` to import test utilities.
- **Type-Aware Linting:** There is no need to install `oxlint-tsgolint`, `vp lint --type-aware` works out of the box.

## Review Checklist for Agents

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp lint`, `vp fmt`, and `vp test` to validate changes.
<!--VITE PLUS END-->
