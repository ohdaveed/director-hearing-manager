# Specification: Draft Packet SOP Compliance Generator

## Overview

This feature allows users to upload a draft Director's Hearing Packet (in PDF or Word format). The system will use the Anthropic AI integration to analyze the document against the official SFDPH Standard Operating Procedure (SOP). It will then present a review interface of proposed changes to bring the packet into compliance. Upon approval, it will generate a new, fully compliant PDF document from scratch, save it to the database, and provide a download link.

## Objectives

- Allow users to upload draft hearing packets (.pdf, .docx).
- Extract content from the uploaded drafts.
- Leverage Anthropic AI to analyze the extracted content against SFHC Article 11 and SOP guidelines.
- Provide a "Review & Approve" UI for the user to verify the AI's proposed compliance changes.
- Generate a new, cleanly formatted, compliant PDF based on the approved data.
- Save the final document to the database and allow immediate download.

## Functional Requirements

- **Upload Interface:** A new UI component (e.g., a modal or new tab in the Enforcement section) to accept `.pdf` and `.docx` file uploads.
- **Parsing Engine:**
  - Extend the existing `pdfService` to handle complex packet layouts.
  - Integrate a new service/library to parse `.docx` files.
- **AI Compliance Engine:**
  - Send extracted text to Anthropic Claude with strict SOP system prompts.
  - The AI must identify non-compliant language/formatting and return structured, corrected data (JSON).
- **Review UI:** A side-by-side or diff-style interface comparing the draft content with the AI's proposed compliant content. The user must be able to edit the proposed changes before finalizing.
- **Document Generation:** Use the existing document template system (`src/config/documentTemplates.ts` and `src/components/packet/`) to build the new document from the approved structured data.
- **Storage & Retrieval:** Save the generated PDF to Supabase Storage, link it to the relevant complaint/packet record, and surface a download button.

## Out of Scope

- Direct in-place modification of the originally uploaded file. The system will always generate a clean, new PDF.
- Handling of handwritten drafts or image-only PDFs (OCR is currently out of scope unless provided by a separate service).
