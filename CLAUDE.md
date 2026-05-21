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

Entry: `src/main.tsx` → `App.tsx` (BrowserRouter > AuthProvider > AppContent)
5+ pillars: Dashboard, Complaints, Inspections, Enforcement/Hearings, Locations, Draft Analysis, Documents
Data flow: `Complaint → Inspection → Violations → Chronology → Hearing Packet`

### Database Schema Management (Atlas)

This project uses [Atlas](https://atlasgo.io) for declarative database schema management.

**Source of truth**: `sql/schema.sql` and the individual files in `sql/` directory.

**Workflow**:

1. Edit schema files in `sql/` directory (types, tables, functions, views, indexes)
2. Run `npm run db:diff -- <name>` to generate a new migration
3. Run `npm run db:lint` to validate the migration for safety issues
4. Run `npm run db:apply` to apply pending migrations (dry-run first)

**Environment variables**:

- `ATLAS_DATABASE_URL` — target Supabase database URL
- `ATLAS_DEV_URL` — dev database URL (use Docker: `docker://postgres/17/dev?search_path=public`)

**Config**: `atlas.hcl` defines the `director_hearing_manager` environment.
**Migrations**: Stored in `migrations/` directory with `atlas.sum` checksum for integrity.
