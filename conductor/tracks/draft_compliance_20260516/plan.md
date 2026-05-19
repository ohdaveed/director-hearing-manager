# Plan: Draft Packet SOP Compliance Generator

## Phase 1: Document Upload and Parsing

- [x] Task: Create UI for uploading draft packets (.pdf, .docx). [77c1831]
  - [x] Task: Write failing tests for upload component rendering and file acceptance. [77c1831]
  - [x] Task: Implement `DraftUploadPanel.tsx` to handle file selection. [77c1831]
- [x] Task: Implement Word Document (.docx) parsing service. [229ea69]
  - [x] Task: Write failing tests for extracting text from .docx files. [229ea69]
  - [x] Task: Install necessary library (e.g., `mammoth` or `pdf-parse` equivalent for word) and implement `wordService.ts`. [229ea69]
- [~] Task: Integrate upload UI with parsing services (`pdfService`, `wordService`).
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Document Upload and Parsing' (Protocol in workflow.md)

## Phase 2: AI Compliance Engine

- [ ] Task: Define AI system prompts and data structures for SOP compliance checking.
- [ ] Task: Update `aiService.ts` to include an endpoint for analyzing full packet text against SOP rules.
  - [ ] Task: Write failing tests mocking Anthropic response for packet analysis.
  - [ ] Task: Implement the analysis logic to return structured, proposed changes.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: AI Compliance Engine' (Protocol in workflow.md)

## Phase 3: Review and Approval Interface

- [ ] Task: Build the Review UI component (`ComplianceReviewView.tsx`).
  - [ ] Task: Write failing tests for displaying diffs and allowing edits.
  - [ ] Task: Implement the UI to show AI proposals vs. original draft, allowing user overrides.
- [ ] Task: Connect the Upload UI to the Review UI (state management).
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Review and Approval Interface' (Protocol in workflow.md)

## Phase 4: Document Generation and Storage

*Detailed implementation plan written: `conductor/tracks/draft_compliance_20260516/phase-4-implementation-plan.md`*

- [x] Task: Map the approved, structured data to the existing packet generation templates.
  - [x] Task: Write failing tests for the data mapper function.
  - [x] Task: Implement the mapping logic.
- [x] Task: Generate final PDF and handle Supabase Storage upload.
  - [x] Task: Write failing tests for storage service interaction.
  - [x] Task: Update `packetService.ts` to handle saving the generated PDF and linking to the DB record.
- [x] Task: Add "Download Final" action to the UI upon successful generation.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Document Generation and Storage' (Protocol in workflow.md)
