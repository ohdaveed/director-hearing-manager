# Plan: Draft Packet SOP Compliance Generator

## Phase 1: Document Upload and Parsing
- [ ] Task: Create UI for uploading draft packets (.pdf, .docx).
    - [ ] Task: Write failing tests for upload component rendering and file acceptance.
    - [ ] Task: Implement `DraftUploadPanel.tsx` to handle file selection.
- [ ] Task: Implement Word Document (.docx) parsing service.
    - [ ] Task: Write failing tests for extracting text from .docx files.
    - [ ] Task: Install necessary library (e.g., `mammoth` or `pdf-parse` equivalent for word) and implement `wordService.ts`.
- [ ] Task: Integrate upload UI with parsing services (`pdfService`, `wordService`).
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
- [ ] Task: Map the approved, structured data to the existing packet generation templates.
    - [ ] Task: Write failing tests for the data mapper function.
    - [ ] Task: Implement the mapping logic.
- [ ] Task: Generate final PDF and handle Supabase Storage upload.
    - [ ] Task: Write failing tests for storage service interaction.
    - [ ] Task: Update `packetService.ts` to handle saving the generated PDF and linking to the DB record.
- [ ] Task: Add "Download Final" action to the UI upon successful generation.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Document Generation and Storage' (Protocol in workflow.md)