# Director Hearing Manager

## Overview

Director Hearing Manager is an enterprise-grade operational tool designed to increase workflows and processes for the San Francisco Department of Public Health (SFDPH) Environmental Health Division. Specifically tailored for the Healthy Housing and Vector Control (HHVC) program, the application streamlines the transition from field inspections to administrative enforcement by automating the compilation, validation, and tracking of Director's Hearing Packets.

## Core Functions & Workflows

### 1. 5-Pillar Operational Architecture

The platform is organized into five primary destinations to maintain clean information architecture:

- **Dashboard:** Role-scoped command center for KPIs, active cases, and new assignments.
- **Complaints:** Unified case management with role-based visibility ("My Complaints" vs. "All Complaints").
- **Inspections:** Centralized history and initiation point for field inspection workflows.
- **Director's Hearings (Enforcement):** Workspace for managing the Escalation Queue and compiling Hearing Packets.
- **Locations:** Structural master registry for property lookup and historical case tracking.

### 2. Hearing Packet Assembly & Chronology Engine

- **Automated Ingestion:** The "Import Past Inspections" wizard parses historical inspection PDFs (up to 60MB), automatically extracting dates, inspector names, and violations to bulk-seed the Chronology Matrix.
- **Smart Exhibit Management:** Features drag-and-drop bulk file uploads. The system automatically groups photos by inspection date into single "Exhibit Cards," calculates PDF page footprints, and cascades zero-padded Bates page ranges seamlessly.
- **Document Generation:** A configuration-driven template system generates pixel-perfect, print-ready Cover Pages, Notices of Violation (NOV), and Case Chronologies with locked static boilerplate and dynamic variable slots.

### 3. Review & Accountability Loops

- **Manager Review:** Includes a direct "Send to Review" pipeline with targeted "Return for Revision" banners that display specific managerial feedback directly within the inspector's workspace.
- **Audit Logging:** Maintains an immutable, automatic history ledger for all status transitions and edits.
- **Digital Signatures:** System-wide role-gated signature placements (Inspector and Manager Countersign) integrated into final print outputs.

## Regulatory Compliance Engine

The application features a strict, programmatic validation rules engine designed to enforce municipal standards:

- **Statutory Restriction:** Hardcoded rules block the selection or citation of California state health codes. All automated lists, autocomplete suggestions, and data-entry fields are strictly locked to San Francisco Health Code (SFHC) Article 11 (and related local codes like Article 11A and Article 2).
- **Smart Remediation:** If a user attempts to input a prohibited state code, the system actively suggests the precise local ordinance equivalent from SFHC Article 11.
- **Pre-Authorized Language:** AI-generated corrective actions are fed from a read-only library of Director's Rules and Regulations to ensure technical remediation metrics (e.g., structural gaps, mesh standards) are accurate and legally sound.

## Technical Code Stack

While abstracted by the visual builder, the underlying architecture relies on a modern, component-driven web stack:

- **Frontend Framework:** React 18+ utilizing **Vite+** (vp CLI) for an optimized development and build pipeline.
- **Styling & UI:** **Tailwind CSS v4** (utilizing high-performance utility classes) paired with **Shadcn UI**, **Base UI**, and **Radix UI** for accessible, headless primitives.
- **Data & Validation:** **TanStack React Query v5** for efficient server-state management and **Zod** for strict type-safe boundary validation across forms and API responses.
- **Backend & API:** Supabase (PostgreSQL + Auth Helpers) integrated via direct client modules and server-side TypeScript utilities (e.g., `importInspectionHistory.ts`, `chronoService.ts`).
- **AI Integration:** Anthropic Claude SDK utilized for advanced document parsing, capable of extracting structured violation data from high-volume PDF inspection reports.
- **Quality Assurance:** **Vitest** + React Testing Library for unit and integration testing with a mandatory coverage target of >80%.

## UI/UX Design Principles

The interface architecture strictly adheres to the **Laws of UX** (lawsofux.com) to minimize cognitive load and mechanical friction:

- **Miller's Law:** Information is chunked into logical fieldsets (e.g., Site Metadata, Owner Details) to prevent cognitive overload.
- **Hick's Law:** Progressive disclosure is utilized in the Import Wizard to simplify decision-making.
- **Fitts's Law & Doherty Threshold:** Bulk multi-select ingestion and asynchronous compilation overlays reduce cursor travel and provide immediate visual feedback during heavy processing tasks.
- **Law of Proximity:** Inspection photos are logically grouped into unified visual containers to maintain timeline clarity.
- **Jakob's Law:** Navigation aligns with standard enterprise mental models, separating destinations (tabs) from actions (buttons).

### Design System & Typography

Beyond high-level UX laws, the application maintains a specific visual identity to bridge the gap between enterprise software and legal/governmental authority:

- **Typography:** Uses **Noto Sans** (variable) for high-legibility UI text and **Playfair Display** (variable) for serif emphasis on legal headers and document outputs.
- **Visual Polish:** Employs **Framer Motion** for purposeful layout transitions and **Tailwind Animate** for interactive feedback, ensuring the interface feels responsive and modern.
- **Accessibility:** Built on headless Radix and Base UI primitives, ensuring that all complex components (selects, dialogs, tabs) remain compliant with screen reader standards.

## Developer Experience & Tooling

To maintain security and developer velocity, the project leverages a specialized set of local tools:

### Secure Secret Management
We use a template-driven approach for environment variables to keep secrets out of source control:
- **Injection:** Run `npm run env:inject` to populate your `.env` from secure Proton Pass templates.
- **Runtime Secrets:** Use `npm run env:run -- vp dev` to run the application with secrets loaded into the shell environment without writing them to disk.

### Advanced Debugging
The environment is optimized for both human and AI-driven debugging:
- **Interactive Testing:** UI tests can be run in debug mode with Playwright to inspect locators and state in real-time.
- **AI-Native Inspection:** Integrated with Chrome DevTools and PostgreSQL MCPs, allowing AI agents to perform real-time data audits and DOM inspections.
- **Performance:** Development is powered by **Vite+**, providing near-instant HMR (Hot Module Replacement) and optimized build times.
