# Plan: Draft Packet SOP Compliance Generator

## Phase 1: Document Upload and Parsing

- [x] Task: Create UI for uploading draft packets (.pdf, .docx). [77c1831]
  - [x] Task: Write failing tests for upload component rendering and file acceptance. [77c1831]
  - [x] Task: Implement `DraftUploadPanel.tsx` to handle file selection. [77c1831]
- [x] Task: Implement Word Document (.docx) parsing service. [229ea69]
  - [x] Task: Write failing tests for extracting text from .docx files. [229ea69]
  - [x] Task: Install necessary library (e.g., `mammoth` or `pdf-parse` equivalent for word) and implement `wordService.ts`. [229ea69]
- [x] Task: Integrate upload UI with parsing services (`pdfService`, `wordService`). [integration_complete]
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Document Upload and Parsing' (Protocol in workflow.md)

## Phase 2: AI Compliance Engine

- [x] Task: Define AI system prompts and data structures for SOP compliance checking. [defined]
- [x] Task: Update `aiService.ts` to include an endpoint for analyzing full packet text against SOP rules. [implemented]
  - [x] Task: Write failing tests mocking Anthropic response for packet analysis. [tests written]
  - [x] Task: Implement the analysis logic to return structured, proposed changes. [implemented]
- [ ] Task: Conductor - User Manual Verification 'Phase 2: AI Compliance Engine' (Protocol in workflow.md)

## Phase 3: Review and Approval Interface

- [x] Task: Build the Review UI component (`ComplianceReviewView.tsx`). [implemented]
  - [x] Task: Write failing tests for displaying diffs and allowing edits. [tests written]
  - [x] Task: Implement the UI to show AI proposals vs. original draft, allowing user overrides. [implemented]
- [x] Task: Connect the Upload UI to the Review UI (state management). [implemented]
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Review and Approval Interface' (Protocol in workflow.md)

## Phase 4: Document Generation and Storage

- [x] Task: Map the approved, structured data to the existing packet generation templates. [implemented]
  - [x] Task: Write failing tests for the data mapper function. [tests written]
  - [x] Task: Implement the mapping logic. [implemented]
- [x] Task: Generate final PDF and handle Supabase Storage upload. [implemented]
  - [x] Task: Write failing tests for storage service interaction. [tests written]
  - [x] Task: Update `packetService.ts` to handle saving the generated PDF and linking to the DB record. [implemented]
- [x] Task: Add "Download Final" action to the UI upon successful generation. [implemented]
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Document Generation and Storage' (Protocol in workflow.md)
