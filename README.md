# Director Hearing Manager

Enterprise Case-Management and Automated Packet Generation system for the San Francisco Department of Public Health (SFDPH).

## 🚀 Tech Stack

- **Frontend**: React 18, TypeScript 5.9, Vite+
- **Styling**: Tailwind CSS v4, Radix UI, @base-ui/react, Shadcn UI
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions, Storage)
- **Data & Logic**: TanStack Query v5, Zod, Anthropic SDK (Claude 3.5 Sonnet)
- **Quality**: Vitest, Playwright, Plankton

## 🛠️ Developer Setup

### 1. Prerequisites
- **Node.js**: v24.15.0 (managed via `.node-version`)
- **Vite-plus**: Standard CLI for this project (`vp`)
- **Proton Pass CLI**: For secret injection

### 2. Environment Configuration
Populate your local `.env` from the project's secret templates:
```bash
npm run env:inject
```

### 3. Development Commands
- `vp dev`: Start the local development server.
- `vp build`: Compile and build for production.
- `vp test`: Run the unit test suite (Vitest).
- `vp lint`: Run the project-wide linting suite.
- `vp commit`: Run staged tasks (lint + prettier) and commit.

### 4. E2E Tests (Playwright)
Seed the hearing packet data and run the Playwright suite:
```bash
npm run e2e:seed
npm run test:e2e
```

Required env vars:
- `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `E2E_TEST_EMAIL`
- `E2E_TEST_PASSWORD`

Optional env vars:
- `E2E_SEED_SLUG` (default: `hearing-packet`)
- `E2E_BASE_URL` (default: `http://127.0.0.1:5173`)
- `E2E_CASE_NUMBER`
- `E2E_HEARING_DATE`
- `E2E_COMPLAINT_ADDRESS`
- `E2E_INSPECTOR_NAME`

## 📁 Project Structure

- `src/`: React application source code.
  - `components/ui/`: Shadcn and Base UI primitive components.
  - `services/`: API and business logic handlers (Supabase, AI).
  - `hooks/`: Custom React hooks for data fetching and state.
- `sql/`: Database schema, functions, and views (Source of Truth).
- `migrations/`: Atlas-managed database migrations.
- `conductor/`: Implementation plans and architectural specs.
- `scripts/`: Utility scripts for ingestion, auditing, and maintenance.

## ⚖️ Architectural Mandates (See AGENTS.md)

1. **PostgREST Join Hints**: Always use explicit join hints in Supabase queries.
2. **Zod Boundaries**: Mandatory Zod validation for all API and form data.
3. **Contrarian Reviewer**: AI agents must pass a compliance audit before finishing tasks.
4. **UX Audit**: All UI changes must be verified with `node scripts/run-audit.js`.

---
© 2026 San Francisco Department of Public Health
