# Copilot Instructions for Director Hearing Manager

> **Source of truth**: See `AGENTS.md` for project commands, architecture,
> conventions, database, and all development patterns.

## Copilot-Specific Notes

### Architecture Quick Reference

Entry: `src/main.tsx` → `App.tsx` (BrowserRouter > AuthProvider > AppContent)
Primary workflows: Dashboard, Complaints, Inspections, Enforcement, Hearings, Locations, Draft Analysis, Documents.

### Key Files

- `src/lib/supabase.ts` — Supabase client
- `src/config/documentTemplates.ts` — Legal boilerplate (source of truth, never hardcode)
- `src/components/ui/` — Shadcn/UI primitives
- `src/types/complaint.ts` — `ComplaintSummary` type

### Important Patterns

- Always use `ComplaintSummary` from `src/types/complaint.ts` for complaint data.
- Use `useQuery`/`useMutation` from TanStack React Query for data fetching.
- Never hardcode legal boilerplate — use `documentTemplates.ts`.
- SF Health Code Article 11 only — see `src/utils/sfhcArticle11.ts`.

### MCP Servers in This Project

- Playwright MCP — browser automation testing
- Postgres MCP — direct schema inspection
