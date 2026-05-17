# Zite: Director Hearing Manager

## Overview
Zite is an enterprise-grade operational tool designed to increase workflows and processes for the San Francisco Department of Public Health (SFDPH) Environmental Health Division. Specifically tailored for the Healthy Housing and Vector Control (HHVC) program, the application streamlines the transition from field inspections to administrative enforcement by automating the compilation, validation, and tracking of Director's Hearing Packets. 

## Core Functions & Workflows

### 1. 5-Pillar Operational Architecture
The platform is organized into five primary destinations to maintain clean information architecture:
* **Dashboard:** Role-scoped command center for KPIs, active cases, and new assignments.
* **Complaints:** Unified case management with role-based visibility ("My Complaints" vs. "All Complaints").
* **Inspections:** Centralized history and initiation point for field inspection workflows.
* **Director's Hearings (Enforcement):** Workspace for managing the Escalation Queue and compiling Hearing Packets.
* **Locations:** Structural master registry for property lookup and historical case tracking.

### 2. Hearing Packet Assembly & Chronology Engine
* **Automated Ingestion:** The "Import Past Inspections" wizard parses historical inspection PDFs (up to 60MB), automatically extracting dates, inspector names, and violations to bulk-seed the Chronology Matrix.
* **Smart Exhibit Management:** Features drag-and-drop bulk file uploads. The system automatically groups photos by inspection date into single "Exhibit Cards," calculates PDF page footprints, and cascades zero-padded Bates page ranges seamlessly.
* **Document Generation:** A configuration-driven template system generates pixel-perfect, print-ready Cover Pages, Notices of Violation (NOV), and Case Chronologies with locked static boilerplate and dynamic variable slots.

### 3. Review & Accountability Loops
* **Manager Review:** Includes a direct "Send to Review" pipeline with targeted "Return for Revision" banners that display specific managerial feedback directly within the inspector's workspace.
* **Audit Logging:** Maintains an immutable, automatic history ledger for all status transitions and edits.
* **Digital Signatures:** System-wide role-gated signature placements (Inspector and Manager Countersign) integrated into final print outputs.

## Regulatory Compliance Engine

The application features a strict, programmatic validation rules engine designed to enforce municipal standards:
* **Statutory Restriction:** Hardcoded rules block the selection or citation of California state health codes. All automated lists, autocomplete suggestions, and data-entry fields are strictly locked to San Francisco Health Code (SFHC) Article 11 (and related local codes like Article 11A and Article 2). 
* **Smart Remediation:** If a user attempts to input a prohibited state code, the system actively suggests the precise local ordinance equivalent from SFHC Article 11.
* **Pre-Authorized Language:** AI-generated corrective actions are fed from a read-only library of Director's Rules and Regulations to ensure technical remediation metrics (e.g., structural gaps, mesh standards) are accurate and legally sound.

## Technical Code Stack

While abstracted by the visual builder, the underlying architecture relies on a modern, component-driven web stack:

* **Frontend Framework:** React (utilizing `.tsx` and `.ts` functional components).
* **Styling:** Tailwind CSS (evidenced by utility classes for responsive grid layouts, sticky positioning, and thematic color variables).
* **Backend & API:** RESTful API endpoints and server-side TypeScript modules (e.g., `importInspectionHistory`, `reorderChronology.ts`) handling asynchronous data processing and PDF binary scanning.
* **Database:** Relational schema modeling complex entities including `Complaints`, `Locations`, `HearingPackets`, `Chronology`, `Exhibits`, `Users`, and `Violations`.
* **AI Integration:** Claude API utilized for advanced document parsing, capable of reading and extracting structured violation data from oversized PDF inspection reports (up to 60MB).

## UI/UX Design Principles

The interface architecture strictly adheres to the **Laws of UX** (lawsofux.com) to minimize cognitive load and mechanical friction:
* **Miller's Law:** Information is chunked into logical fieldsets (e.g., Site Metadata, Owner Details) to prevent cognitive overload.
* **Hick's Law:** Progressive disclosure is utilized in the Import Wizard to simplify decision-making.
* **Fitts's Law & Doherty Threshold:** Bulk multi-select ingestion and asynchronous compilation overlays reduce cursor travel and provide immediate visual feedback during heavy processing tasks.
* **Law of Proximity:** Inspection photos are logically grouped into unified visual containers to maintain timeline clarity.
* **Jakob's Law:** Navigation aligns with standard enterprise mental models, separating destinations (tabs) from actions (buttons).