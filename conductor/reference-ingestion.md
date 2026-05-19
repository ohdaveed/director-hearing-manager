# Implementation Plan: Reference Hearing Ingestion

## Phase 1: Research & Tool Setup
- Verify `pdfjs-dist` version and worker setup.
- Verify `supabase` client connection and environment variables in `.env`.

## Phase 2: Automated Extraction Script
- Create `scripts/ingest_reference.mjs`:
    - Use `pdfjs-dist` to extract text from all pages of the PDF.
    - Implement a chunking strategy if the text is too large for a single LLM prompt.
    - Define Zod schemas or JSON structures for the target DB tables.
    - Call Anthropic API (Claude 3.5 Sonnet) to transform text into structured JSON.

## Phase 3: Database Ingestion
- Use `@supabase/supabase-js` to perform the following inserts in order (to satisfy FKs):
    1. `locations`
    2. `complaints`
    3. `inspections`
    4. `violations`
    5. `chronology`
    6. `hearing_packets`
- Ensure all records are linked correctly via UUIDs.

## Phase 4: Verification
- Run a sanity check script to verify the counts of records created.
- Review the `REF-50RIZAL` packet in the application UI (if accessible).

## Completion Criteria
- All 6 core tables populated with data from the 50 Rizal Street PDF.
- A complete, consistent hearing packet available in the database for reference.
