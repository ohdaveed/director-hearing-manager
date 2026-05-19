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
