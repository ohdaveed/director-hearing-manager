# GEMINI.md - Project Context: Zite (Director Hearing Manager)

## Project Overview

**Zite** is an enterprise-grade operational tool designed for the **San Francisco Department of Public Health (SFDPH)** Environmental Health Division, specifically the Healthy Housing and Vector Control (HHVC) program. It automates the transition from field inspections to administrative enforcement by managing the compilation, validation, and tracking of **Director's Hearing Packets**.

### Core Objectives:

- **Case Management:** Unified tracking of health code complaints and locations.
- **Automated Enforcement:** Streamlining the assembly of Director's Hearing Packets (Cover Page, NOV, Chronology).
- **Regulatory Compliance:** Strict enforcement of SF Health Code Article 11 standards.
- **Role-Based Workflows:** Distinct interfaces and permissions for Inspectors, Program Managers, and Admins.

---

## Technology Stack

- **Frontend:** [React](https://react.dev/) (Functional Components, Hooks)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **UI & Styling:** [Tailwind CSS](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/), [Framer Motion](https://www.framer.com/motion/)
- **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL, Auth Helpers)
- **Data Fetching:** [TanStack React Query](https://tanstack.com/query/latest)
- **Parsing:** [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript) (Claude API) for PDF inspection report ingestion.
- **Validation:** [Zod](https://zod.dev/)

---

## Architecture & Navigation

The application follows a **5-pillar information architecture**, accessible via the main navigation bar:

1.  **Dashboard:** Role-scoped KPIs and active case summaries.
2.  **Complaints:** Central case management for tracking reported violations.
3.  **Inspections:** History and initiation point for field inspection workflows.
4.  **Director's Hearings (Enforcement):** Workspace for managing the Escalation Queue and compiling Hearing Packets.
5.  **Locations:** Master registry for property data and historical case tracking.

### Key Data Entities:

- `Complaints`: The root of all enforcement activity.
- `Inspections`: Individual site visits linked to complaints.
- `Violations`: Specific code infractions found during inspections.
- `Chronology`: A ledger of all events (inspections, notices, contacts) related to a case.
- `Hearing Packets`: The final legal document assembly for administrative hearings.
- `Locations`: Physical properties where complaints/inspections occur.

---

## Development Conventions

### 1. Code Style & Structure

- **Type Safety:** Mandatory use of TypeScript. Use `ComplaintSummary` from `src/types/complaint.ts` for shared complaint data.
- **Components:** Functional components using `.tsx`. UI components are located in `src/components/ui/` (Shadcn/UI pattern).
- **Services:** All database interactions are encapsulated in the `src/services/` directory (e.g., `complaintService.ts`, `packetService.ts`).
- **Icons:** Use `lucide-react` for all iconography.

### 2. Role-Based Access Control (RBAC)

Roles are defined as: `Inspector`, `Admin`, `Program Manager`, `Super Admin`.

- **Nav Guarding:** Managed in `src/App.tsx`.
- **Impersonation:** Super Admins can "preview" as any role via the header banner.

### 3. Document Generation

The **Director's Hearing Packet** is configuration-driven.

- **Source of Truth:** `src/config/documentTemplates.ts` defines all static boilerplate and variable slots.
- **Rendering:** Components in `src/components/packet/` (e.g., `PacketCoverPage.tsx`, `PacketNoticeOfViolation.tsx`) use these templates to render print-ready PDFs.

### 4. Data Management

- **Supabase Client:** Configured in `src/lib/supabase.ts`.
- **Querying:** Use `useQuery` and `useMutation` from TanStack Query for caching and state synchronization.

---

## Building and Running

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run linter
npm run lint
```

### Production

```bash
# Build the project (TypeScript check + Vite build)
npm run build

# Preview the build
npm run preview
```

---

## Key Files & Directories

- `src/App.tsx`: Main routing, shell layout, and RBAC logic.
- `src/main.tsx`: App entry point with `QueryClientProvider`.
- `schema.sql`: Complete PostgreSQL schema for the Supabase backend.
- `src/services/`: API interaction layer.
- `src/config/documentTemplates.ts`: Legal document boilerplate and variable mapping.
- `src/components/packet/`: Components for generating printable legal documents.
- `src/types/`: Shared TypeScript interfaces.
