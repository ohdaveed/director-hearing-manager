# Copilot Instructions for Director Hearing Manager

## Quick Start

### Build, Test, and Lint Commands

```bash
# Install dependencies
npm install

# Development server (Vite)
npm run dev

# Run linter (ESLint)
npm run lint

# Run all tests
npm run test

# Run a specific test file or pattern
npm run test -- src/services/__tests__/aiService.test.ts
npm run test -- --grep "test name pattern"

# Build for production (TypeScript check + Vite build)
npm run build

# Preview the build locally
npm run preview
```

## Architecture Overview

**Zite** is an enterprise case management system for the San Francisco Department of Public Health's Environmental Health Division. It manages the compilation, validation, and tracking of Director's Hearing Packets—legal documents used in administrative enforcement proceedings.

### 5-Pillar Information Architecture

The application is organized around five main workflows, accessible from the main navigation:

1. **Dashboard** – Role-scoped KPIs and active case summaries
2. **Complaints** – Central case management for tracking violations
3. **Inspections** – Field inspection history and initiation workflows
4. **Director's Hearings (Enforcement)** – Escalation queue and hearing packet compilation
5. **Locations** – Master registry for properties and historical case tracking

### Core Data Flow

```
Complaint → Inspection → Violations → Chronology → Hearing Packet
```

- **Complaints**: Root of all enforcement activity
- **Inspections**: Individual site visits linked to complaints (includes violations, photos)
- **Chronology**: Ledger of all events (inspections, notices, contacts, dates) related to a case
- **Hearing Packets**: Final legal document assembly (Cover Page, Notice of Violation, Chronology, Exhibits)
- **Locations**: Physical properties where complaints/inspections occur

### Technology Stack

- **Frontend Framework**: React 18 (functional components + hooks)
- **Language**: TypeScript 5.2 (strict mode enabled)
- **Build Tool**: Vite 5
- **UI Components**: Radix UI + custom components in `src/components/ui/`
- **Styling**: Tailwind CSS 3.4
- **Icons**: Lucide React
- **Database & Auth**: Supabase (PostgreSQL + Auth Helpers)
- **Data Fetching**: TanStack React Query 5
- **AI Integration**: Anthropic SDK (Claude API) for PDF report parsing
- **Validation**: Zod
- **Testing**: Vitest with React Testing Library
- **Animations**: Framer Motion

## Development Conventions

### Code Organization

- **Routes**: `src/pages/` – Route-level components (one per main navigation item)
- **Components**: `src/components/` – Reusable components
  - `src/components/ui/` – Shadcn/UI pattern: primitive UI components (button, select, dialog, etc.)
  - `src/components/packet/` – Director's Hearing Packet document components
- **Services**: `src/services/` – All database queries and external API calls
  - Example: `complaintService.ts`, `packetService.ts`, `aiService.ts`
- **Hooks**: `src/hooks/` – Custom React hooks
- **Context**: `src/context/` – Global state (e.g., `AuthContext.tsx`)
- **Types**: `src/types/` – TypeScript type definitions (e.g., `complaint.ts`)
- **Utils**: `src/utils/` – Utility functions
- **Config**: `src/config/` – Configuration files
  - `documentTemplates.ts` – **Source of truth** for all legal document boilerplate and variable slots

### Type Safety & TypeScript

- **Mandatory use of TypeScript.** No `any` types except with clear justification.
- Use `unknown` instead of `any` when the type is truly unknown.
- Avoid type assertions (`x as SomeType`) and non-null assertions (`y!`) without justification.
- Use the `@` alias: `import { ... } from '@/services/...'`
- Follow Google TypeScript Style Guide (enforced by eslint):
  - Use `const`/`let`, never `var`
  - Prefer named exports over default exports
  - Use `private`/`protected` visibility modifiers (never use `#private`)
  - Use triple equals (`===`, `!==`)
  - Use single quotes for strings, template literals for interpolation
  - **No semicolon insertion fallback** – explicitly end statements

### Components & Hooks

- Write functional components (`.tsx`)
- Use React hooks (`useState`, `useQuery`, `useMutation`, etc.)
- UI components: Use Radix UI primitives + Tailwind CSS
- Icons: Always use `lucide-react`
- Data fetching: Use `useQuery` and `useMutation` from TanStack React Query
  - This provides automatic caching and state synchronization with Supabase
- Example pattern:
  ```tsx
  const { data: complaint } = useQuery({
    queryKey: ['complaints', id],
    queryFn: () => complaintService.getById(id),
  });
  ```

### Services & Database Interaction

- All database queries live in `src/services/`
- Services are plain objects with async methods, returning typed data
- Query construction:
  ```ts
  export const complaintService = {
    async getAll(filters: { assigned_to?: string } = {}) {
      let query = supabase.from('complaints').select('*');
      if (filters.assigned_to) query = query.eq('assigned_to', filters.assigned_to);
      const { data, error } = await query;
      if (error) throw error;
      return data as ComplaintSummary[];
    },
  };
  ```

### Document Generation (Hearing Packets)

The Director's Hearing Packet is configuration-driven:

1. **Define boilerplate** in `src/config/documentTemplates.ts` – maps template variables to data fields
2. **Render components** in `src/components/packet/` – print-ready React components
   - Example: `PacketCoverPage.tsx`, `PacketNoticeOfViolation.tsx`, `PacketChronology.tsx`
3. **Print to PDF** using browser print dialog (components styled for print media)

Key files:
- `src/config/documentTemplates.ts` – Source of truth for legal templates
- `src/components/packet/printUtils.tsx` – Utility helpers for print formatting

### Role-Based Access Control (RBAC)

Roles: `Inspector`, `Admin`, `Program Manager`, `Super Admin`

- **Navigation**: Route guards in `src/App.tsx` – only accessible routes render
- **Impersonation**: Super Admins can "preview" as other roles via the header banner
- **Auth Provider**: `src/context/AuthContext.tsx` – provides `useAuth()` hook with current `role` and `user`

### Testing

Tests use **Vitest + React Testing Library**:

```bash
npm run test -- src/services/__tests__/aiService.test.ts
npm run test -- --grep "should parse PDF"
```

Test file location: `__tests__/` subdirectory in the same folder as the module being tested.

Example:
```ts
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

describe('ComponentName', () => {
  it('does something', () => {
    render(<Component />);
    expect(screen.getByText(/expected text/i)).toBeInTheDocument();
  });
});
```

## Important Patterns

### Shared Complaint Data Type

Always import and use `ComplaintSummary` from `src/types/complaint.ts` for complaint data across components.

### Query Client Setup

The app initializes a `QueryClient` in `src/main.tsx` and wraps routes with `QueryClientProvider`. This is already configured—just use `useQuery` and `useMutation` in your components.

### Configuration-Driven Document Templates

Never hardcode legal document text. All boilerplate lives in `src/config/documentTemplates.ts`. This ensures consistency and makes updates easy.

### Supabase Client

The Supabase client is initialized in `src/lib/supabase.ts`. Import and use it in services:
```ts
import { supabase } from '@/lib/supabase';
```

## MCP Servers

This project integrates with two MCP servers for enhanced development capabilities:

### Playwright MCP

For browser automation testing and E2E verification:
- Useful for testing complex UI interactions (forms, modals, multi-step workflows)
- Can verify that Director's Hearing Packet rendering is correct across print and screen views
- Connect with: `playwright` MCP server

### PostgreSQL MCP

For direct database schema inspection and query exploration:
- Useful for exploring the Supabase schema without leaving the IDE
- Can verify data relationships and constraints before writing queries
- Supabase credentials needed: Check `.env` for `SUPABASE_URL` and `SUPABASE_ANON_KEY`

## Project Context

This is **Zite**, an enterprise operational tool for the San Francisco Department of Public Health. It automates the enforcement workflow for health code violations, with strict regulatory compliance for SF Health Code Article 11. The system supports multiple user roles and complex document workflows.

See `GEMINI.md` for detailed project context and business requirements.
