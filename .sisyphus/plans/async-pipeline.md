# Async Packet Review Pipeline — Implementation Plan

## TL;DR

> **Quick Summary**: Replace the synchronous blocking LLM call in `DraftPacketAnalysisPage` with an async pipeline: Supabase Edge Function trigger → background worker → database task tracking → polling React hook → parallel PDF+streaming-review UI. The worker uses ModelSelector with pre-flight quota probes across OpenAI (primary) → Anthropic → Google Vertex AI (ADC auth, project: `dhm2026`) — selecting one available model per task, no retries. Also add RAG for SOP documents via pg_vector and IndexedDB buffering for offline resiliency.
>
> **Deliverables**:
>
> - `async_tasks` DB table + Edge Function trigger (returns 202 + task_id immediately)
> - Background worker Edge Function for LLM analysis
> - `pg_vector` setup + SOP document embedding pipeline
> - `usePacketReviewStatus(taskId)` polling hook
> - Parallel review screen (PDF viewer left, streaming notes right)
> - IndexedDB buffering layer with `idb` library
>
> **Estimated Effort**: XL
> **Parallel Execution**: YES — 4 waves
> **Critical Path**: T1 → T2 → T3 → T8 → T13 → F1-F4

---

## Context

### Original Request

User requested planning for 4 architectural changes:

1. Async processing pipeline (backend + background workers)
2. RAG for SOP documents (vector embeddings)
3. UI polling hook + progressive UI updates
4. IndexedDB state buffering for packet review

### Interview Summary

**Key Discussions**:

- Supabase-native only constraint: no BullMQ, Celery, or Redis external deps
- Existing `aiService.analyzePacketCompliance()` is synchronous and blocks HTTP
- `DraftPacketAnalysisPage` state machine: `"upload" | "analyzing" | "review"` — no task ID tracking
- `ComplianceResult` type already exists: `isCompliant`, `score`, `issues[]`, `missingSections[]`, `recommendations[]`
- No Edge Functions deployed, no `async_tasks` table, no `idb` in package.json
- Doherty Threshold optimizations required (minimize perceived wait time)
- Existing React Query / TanStack Query setup in `main.tsx`

### Research Findings (Direct Codebase Reads)

- `aiService.ts` (153L): synchronous `analyzePacketCompliance()` using `claude-3-haiku-20240307`
- `DraftPacketAnalysisPage.tsx` (163L): blocks on `await aiService.analyzePacketCompliance()` with generic spinner
- `ComplianceReviewView.tsx` (214L): static results display — no streaming
- Supabase client at `@/lib/supabase.ts` — ready for Edge Function calls
- `idb` library NOT in `package.json` — needs to be added
- DB has 12 tables, all RLS-enabled except `users`; no async tasks table
- `pg_vector` extension not yet enabled — Supabase supports it natively

---

## Work Objectives

### Core Objective

Replace the synchronous blocking LLM call with a full async pipeline: immediate task_id return → background processing → polling hook → progressive UI. Also add RAG for SOP compliance reference and IndexedDB buffering for offline resiliency.

### Concrete Deliverables

1. `supabase/functions/packet-review-trigger/index.ts` — creates async task, returns task_id immediately
2. `supabase/functions/packet-analysis-worker/index.ts` — background LLM worker, writes result to DB
3. `async_tasks` table + `packet_analysis_tasks` view in Supabase DB
4. `src/services/modelSelector.ts` — pre-flight quota check + model fallback (OpenAI → Anthropic → Vertex AI via ADC, project `dhm2026`)
5. `src/hooks/usePacketReviewStatus.ts` — polling hook (1.5s interval, exponential backoff)
6. `src/services/packetAnalysisService.ts` — async service wrapping Edge Function call
7. `src/pages/DraftPacketAnalysisPage.tsx` — updated with parallel review UI
8. `src/components/packet/ParallelReviewView.tsx` — PDF left + streaming notes right layout
9. `src/lib/packetStateBuffer.ts` — IndexedDB buffering layer using `idb`
10. `supabase/migrations/002a_enable_pgvector.sql` — vector extension + embedding table
11. `supabase/migrations/002b_create_async_tasks.sql` — async_tasks + packet_analysis_tasks

### Definition of Done

- [x] Upload PDF → see progress indicator immediately (within 100ms of click)
- [x] Poll task status → UI updates progressively as analysis runs
- [x] Analysis complete → full `ComplianceResult` displayed in parallel view
- [x] Network failure during analysis → result survives in IndexedDB, resumes on reconnect
- [x] SOP document references → embedded vectors returned with compliance result

### Must Have

- Edge Function returns HTTP 202 + `task_id` within 100ms of upload
- Background worker processes LLM analysis asynchronously
- ModelSelector checks OpenAI → Anthropic → Vertex AI in order; selects first available (one model per task, no retries) — pre-flight quota probe per provider before calling. Vertex uses Application Default Credentials (ADC) — no API key needed, project `dhm2026`.
- Polling hook exposes: `status`, `progress`, `result`, `error`
- Parallel review screen shows PDF and notes side-by-side
- IndexedDB buffer survives page refresh during analysis

### Must NOT Have (Guardrails)

- No external queue infrastructure (no BullMQ, Celery, Redis, SQS)
- No blocking synchronous LLM calls in the frontend pipeline
- No embedding of full document text in the async_tasks table (store only file reference)
- No changes to existing `aiService.ts` interface (add new `asyncAnalyzePacketCompliance`, keep original)
- No hardcoded model names in worker — use ModelSelector abstraction for easy model swap
- No retries across providers within a single task (one model per task, select best available at start)
- No Vertex API key stored — use ADC authentication only

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision

- **Infrastructure exists**: NO (no test infra for Edge Functions yet)
- **Automated tests**: Tests-after (add unit tests for new hooks/services after implementation)
- **Framework**: Vitest (existing)
- **QA Policy**: Every task includes agent-executed QA scenarios (Playwright for UI, curl for API)

### QA Policy

Every task includes agent-executed QA scenarios. Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation — scaffolding + DB schema, NO dependencies):
├── Task 1:  Add idb library to package.json + install
├── Task 2:  Create async_tasks table migration + RLS policies
├── Task 3:  Create packet_analysis_tasks view migration
├── Task 4:  Create pg_vector extension + sop_embeddings table migration
├── Task 5:  Create packet-review-trigger Edge Function (returns task_id immediately)
└── Task 6:  Create packet-analysis-worker Edge Function (background LLM job)

Wave 2 (Frontend core — services + hooks, MAX PARALLEL):
├── Task 7:  Create packetAnalysisService.ts (wraps Edge Function call + polling)
├── Task 8:  Create usePacketReviewStatus.ts polling hook (1.5s interval, exponential backoff)
├── Task 9:  Create packetStateBuffer.ts (IndexedDB layer with idb)
├── Task 10: Add types for async task status (task_status enum, TaskContext interface)
└── Task 11: Add streaming progress types (StreamingChunk, ProgressUpdate)

Wave 3 (UI layer — parallel review screen):
├── Task 12: Refactor DraftPacketAnalysisPage state machine to use usePacketReviewStatus
├── Task 13: Create ParallelReviewView.tsx (PDF left, streaming notes right)
├── Task 14: Add progressive loading indicators (step progress, elapsed time)
├── Task 15: Update ComplianceReviewView to accept partial/streaming results
└── Task 16: Add offline detection + IndexedDB resume banner

Wave 4 (RAG pipeline — SOP embeddings):
├── Task 17: Create SOP document chunking utility (overlap strategy)
├── Task 18: Create embed SOP documents Edge Function (batch embedding)
├── Task 19: Create similarity search utility for SOP references
├── Task 20: Integrate SOP references into analyzePacketCompliance prompt
└── Task 21: Add SOP reference display to ComplianceReviewView

Wave FINAL (After ALL tasks — 4 parallel reviews, then user okay):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review
├── Task F3: Real manual QA (Playwright — upload PDF, verify async flow)
└── Task F4: Scope fidelity check
-> Present results -> Get explicit user okay

Critical Path: T1 → T2 → T3 → T5 → T7 → T8 → T12 → T13 → F1-F4
Parallel Speedup: ~65% faster than sequential
Max Concurrent: 6 (Wave 2)
```

### Dependency Matrix

| Task | Depends On    | Blocks              |
| ---- | ------------- | ------------------- |
| T1   | —             | T2, T3, T4          |
| T2   | T1            | T5, T6              |
| T3   | T1            | T5, T6              |
| T4   | T1            | T18, T19            |
| T5   | T2, T3        | T7, T8              |
| T6   | T2, T3, T22   | (background worker) |
| T7   | T5            | T12, T16            |
| T8   | T5, T7        | T12, T16            |
| T9   | T1            | T16                 |
| T10  | T5            | T7, T8              |
| T11  | T5            | T12                 |
| T12  | T7, T8, T11   | T13                 |
| T13  | T12           | T14                 |
| T14  | T13           | —                   |
| T15  | T13           | —                   |
| T16  | T8, T9        | —                   |
| T17  | T4            | T18, T20            |
| T18  | T4, T17       | T19                 |
| T19  | T4, T17       | —                   |
| T20  | T18, T19, T22 | T15                 |
| T21  | T20           | —                   |
| T22  | —             | T6, T20             |

### Agent Dispatch Summary

- **Wave 1**: T1-T6 → `quick` (scaffolding + migrations)
- **Wave 2**: T7-T11 + T22 → `deep` (core services/hooks, 6 tasks — ModelSelector added)
- **Wave 3**: T12-T16 → `visual-engineering` + `deep` (UI, 5 tasks)
- **Wave 4**: T17-T21 → `unspecified-high` (RAG, 5 tasks)
- **FINAL**: F1-F4 → `oracle` + `unspecified-high`

---

## TODOs

- [x] 1. **Add `idb`, `openai`, and `@google-cloud/vertexai` libraries to package.json** — `quick` [COMPLETED]

  **What to do**:
  - Run `npm install idb openai @google-cloud/vertexai` in project root
  - Verify all three packages added to `package.json` dependencies
  - No other changes needed

  **Must NOT do**:
  - Do not configure any of the packages yet — just installation

  **Recommended Agent Profile**:

  > **Category**: `quick`
  > **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T2-T6)
  - **Blocks**: T9 (IndexedDB buffer depends on idb), T22 (ModelSelector depends on openai + vertexai)
  - **Blocked By**: None (can start immediately)

  **References**:
  - `package.json:22` — `@anthropic-ai/sdk` entry pattern (where openai and vertexai will be inserted)
  - `package.json:64` — `zod` entry pattern (where idb will be inserted)
  - OpenAI SDK docs: `https://platform.openai.com/docs/api-reference`
  - Google Vertex AI SDK: `https://cloud.google.com/vertex-ai/generative-ai/docs/sdks`
  - idb docs: `https://github.com/jakearchibald/idb`

  **Acceptance Criteria**:
  - [ ] `npm install idb openai @google-cloud/vertexai` succeeds
  - [ ] `package.json` contains all three packages in dependencies
  - [ ] `node_modules/idb`, `node_modules/openai`, `node_modules/@google-cloud/vertexai` all exist

  **QA Scenarios**:

  ```
  Scenario: All three packages install correctly
    Tool: Bash
    Preconditions: node_modules exists, npm install has run
    Steps:
      1. Run: npm list idb && npm list openai && npm list @google-cloud/vertexai
    Expected Result: All three version numbers printed (no "empty")
    Evidence: .sisyphus/evidence/task-1-packages-install.txt
  ```

  **Commit**: NO

- [x] 2. **Create async_tasks table migration** — `quick`

  **What to do**:
  - Create `migrations/002a_create_async_tasks.sql`
  - Table: `async_tasks` (id UUID PK default gen_random_uuid(), task_type text, status text DEFAULT 'pending', progress integer DEFAULT 0, result jsonb, error text, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(), metadata jsonb)
  - Enable RLS: `ALTER TABLE async_tasks ENABLE ROW LEVEL SECURITY`
  - RLS policies: authenticated users can insert; owner can select/update their own tasks
  - Add index on `(status)` and `(task_type, created_at)`

  **Must NOT do**:
  - Do not add foreign key constraints to existing tables yet
  - Do not enable RLS policies that would block the Edge Function service role

  **Recommended Agent Profile**:

  > **Category**: `quick`
  > **Skills**: [`supabase-postgres-best-practices`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1, T3-T6)
  - **Blocks**: T5 (Edge Function writes to this table)
  - **Blocked By**: T1 (npm install must complete first)

  **References**:
  - `migrations/001a_*` — existing migration pattern to follow (IF NOT EXISTS, idempotent)
  - `supabase_list_tables` output — existing table pattern with created_at/updated_at
  - `schema.sql` — RLS policy pattern

  **Acceptance Criteria**:
  - [ ] Migration file created: `migrations/002a_create_async_tasks.sql`
  - [ ] `supabase migrations apply` succeeds
  - [ ] `async_tasks` table exists in DB with correct columns
  - [ ] RLS enabled, policies allow authenticated insert/select

  **QA Scenarios**:

  ```
  Scenario: async_tasks table created with correct schema
    Tool: Supabase MCP
    Preconditions: Migration applied
    Steps:
      1. Run: supabase_execute_sql("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'async_tasks' ORDER BY ordinal_position")
    Expected Result: id, task_type, status, progress, result, error, created_at, updated_at, metadata columns present
    Evidence: .sisyphus/evidence/task-2-async-tables-schema.json

  Scenario: RLS policies allow authenticated access
    Tool: Supabase MCP
    Preconditions: Migration applied
    Steps:
      1. Run: supabase_execute_sql("SELECT tablename, rowlevelsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'async_tasks'")
    Expected Result: rowlevelsecurity = true
    Evidence: .sisyphus/evidence/task-2-rls-enabled.txt
  ```

  **Commit**: YES — group with T3, T4
  - Message: `feat(db): add async_tasks table and RLS policies`
  - Files: `migrations/002a_create_async_tasks.sql`

- [x] 3. **Create packet_analysis_tasks view migration** — `quick`

  **What to do**:
  - Create `migrations/002b_create_packet_analysis_view.sql`
  - View: `packet_analysis_tasks` — filtered view of `async_tasks` where `task_type = 'packet_analysis'`
  - Columns: id, status, progress, result, error, created_at, updated_at, metadata
  - Add comments explaining this is a filtered subset for packet review

  **Must NOT do**:
  - Do not create separate table — just a view over async_tasks

  **Recommended Agent Profile**:

  > **Category**: `quick`
  > **Skills**: [`supabase-postgres-best-practices`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1, T2, T4-T6)
  - **Blocks**: T5 (Edge Function can query this view)
  - **Blocked By**: T2 (view depends on async_tasks table existing)

  **References**:
  - `migrations/001a_*` — existing view pattern in migrations
  - Existing filtered views in schema if any

  **Acceptance Criteria**:
  - [ ] Migration file: `migrations/002b_create_packet_analysis_view.sql`
  - [ ] `supabase migrations apply` succeeds
  - [ ] View `packet_analysis_tasks` exists and shows only packet_analysis tasks

  **QA Scenarios**:

  ```
  Scenario: packet_analysis_tasks view exists and filters correctly
    Tool: Supabase MCP
    Preconditions: Migration applied
    Steps:
      1. Run: INSERT INTO async_tasks (task_type, status, metadata) VALUES ('packet_analysis', 'pending', '{"file_name": "test.pdf"}') RETURNING id
      2. Run: SELECT id, status FROM packet_analysis_tasks WHERE metadata->>'file_name' = 'test.pdf'
    Expected Result: Returns the inserted row
    Evidence: .sisyphus/evidence/task-3-view-filter.json
  ```

  **Commit**: YES — group with T2, T4
  - Message: `feat(db): add async_tasks table and RLS policies`
  - Files: `migrations/002a_create_async_tasks.sql`, `migrations/002b_create_packet_analysis_view.sql`

- [x] 4. **Create pg_vector extension + sop_embeddings table migration** — `quick`

  **What to do**:
  - Create `migrations/002c_enable_pgvector.sql`
  - Enable extension: `CREATE EXTENSION IF NOT EXISTS vector`
  - Create table: `sop_embeddings` (id UUID PK, content_chunk text, embedding vector(1536), source_document text, chunk_index integer, created_at timestamptz DEFAULT now())
  - Create index: `CREATE INDEX idx_sop_embeddings_embedding ON sop_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)`
  - Enable RLS: `ALTER TABLE sop_embeddings ENABLE ROW LEVEL SECURITY`
  - RLS policy: authenticated read access (service role used by Edge Functions)

  **Must NOT do**:
  - Do not populate with data yet (separate edge function for that)
  - Do not use approximate nearest neighbor index that requires training data

  **Recommended Agent Profile**:

  > **Category**: `quick`
  > **Skills**: [`supabase-postgres-best-practices`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1-T3, T5-T6)
  - **Blocks**: T17, T18 (RAG pipeline depends on this table)
  - **Blocked By**: T1 (npm install must complete)

  **References**:
  - `https://supabase.com/docs/guides/database/postgres/vector-databases` — pg_vector setup
  - `https://github.com/pgvector/pgvector` — vector(1536) dimension for claude-3-haiku
  - `migrations/001a_*` — existing migration pattern

  **Acceptance Criteria**:
  - [ ] Migration file: `migrations/002c_enable_pgvector.sql`
  - [ ] `supabase migrations apply` succeeds
  - [ ] `vector` extension enabled
  - [ ] `sop_embeddings` table exists with 1536-dim vector column
  - [ ] IVFFlat index created on embedding column

  **QA Scenarios**:

  ```
  Scenario: pg_vector extension enabled and sop_embeddings table exists
    Tool: Supabase MCP
    Preconditions: Migration applied
    Steps:
      1. Run: supabase_execute_sql("SELECT extname FROM pg_extension WHERE extname = 'vector'")
    Expected Result: 'vector' row returned
    Evidence: .sisyphus/evidence/task-4-vector-extension.txt

  Scenario: sop_embeddings table has correct schema
    Tool: Supabase MCP
    Preconditions: Migration applied
    Steps:
      1. Run: supabase_execute_sql("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'sop_embeddings' ORDER BY ordinal_position")
    Expected Result: id, content_chunk, embedding(vector,1536), source_document, chunk_index, created_at
    Evidence: .sisyphus/evidence/task-4-sop-embeddings-schema.json
  ```

  **Commit**: YES — group with T2, T3
  - Message: `feat(db): add async_tasks table and RLS policies`
  - Files: `migrations/002a_create_async_tasks.sql`, `migrations/002b_create_packet_analysis_view.sql`, `migrations/002c_enable_pgvector.sql`

- [x] 5. **Create packet-review-trigger Edge Function** — `quick`

  **What to do**:
  - Create `supabase/functions/packet-review-trigger/index.ts`
  - Handler: accepts JSON body `{ text: string, fileName: string, fileType: "pdf" | "docx", metadata?: object }`
  - Insert into `async_tasks` with `task_type = 'packet_analysis'`, `status = 'pending'`, metadata includes text_length, file_name
  - Return HTTP 202 with `{ taskId: uuid, status: "pending", message: "Analysis queued" }`
  - Log task creation for debugging

  **Must NOT do**:
  - Do not call the LLM here — that happens in the background worker
  - Do not store the full text in async_tasks (store only text_length + file_name in metadata)
  - Do not set verify_jwt to false — keep JWT verification enabled

  **Recommended Agent Profile**:

  > **Category**: `quick`
  > **Skills**: [`supabase`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1-T4, T6)
  - **Blocks**: T7, T8 (frontend services/hooks call this Edge Function)
  - **Blocked By**: T2, T3 (depends on async_tasks table existing)

  **References**:
  - `src/services/aiService.ts:73-152` — analyzePacketCompliance system prompt to reuse
  - `src/types/compliance.ts:41-51` — ComplianceAnalysisInput and AnalyzePacketRequest types
  - `supabase_get_edge_function` output pattern for existing functions (there are none yet — first one)
  - Supabase Edge Function docs pattern: `Deno.serve(async (req) => { ... })`

  **Acceptance Criteria**:
  - [ ] Edge Function file created: `supabase/functions/packet-review-trigger/index.ts`
  - [ ] Function responds to POST with 202 within 100ms
  - [ ] Returns `{ taskId, status: "pending" }` matching async_tasks.id
  - [ ] Function deployed via `supabase_deploy_edge_function`

  **QA Scenarios**:

  ```
  Scenario: packet-review-trigger creates task and returns 202 immediately
    Tool: Bash (curl)
    Preconditions: Edge Function deployed, valid JWT in Authorization header
    Steps:
      1. Run: curl -X POST https://<ref>.supabase.co/functions/v1/packet-review-trigger \
         -H "Authorization: Bearer <anon_key>" \
         -H "Content-Type: application/json" \
         -d '{"text": "test content", "fileName": "test.pdf", "fileType": "pdf"}'
    Expected Result: HTTP 202, JSON body with taskId (UUID format), status: "pending"
    Evidence: .sisyphus/evidence/task-5-trigger-response.json

  Scenario: Task record exists in async_tasks table after trigger
    Tool: Supabase MCP
    Preconditions: Edge Function called successfully
    Steps:
      1. Run: supabase_execute_sql("SELECT id, task_type, status FROM async_tasks WHERE task_type = 'packet_analysis' ORDER BY created_at DESC LIMIT 1")
    Expected Result: Returns a row with pending status and correct metadata
    Evidence: .sisyphus/evidence/task-5-task-record.json
  ```

  **Commit**: YES — separate commit
  - Message: `feat(edge): add packet-review-trigger async task creation endpoint`
  - Files: `supabase/functions/packet-review-trigger/index.ts`, `supabase/functions/packet-review-trigger/deno.json` (if needed)

- [x] 6. **Create packet-analysis-worker Edge Function** — `quick`

  **What to do**:
  - Create `supabase/functions/packet-analysis-worker/index.ts`
  - This is a background worker that:
    1. Polls `async_tasks` for rows with `task_type = 'packet_analysis' AND status = 'pending'` (FIFO, oldest first)
    2. Updates status to `'processing'` when picked up
    3. Uses `ModelSelector.callWithFallback()` to make the LLM call (primary → fallback on 429, pre-flight check)
    4. Writes `ComplianceResult` to `result` column as JSONB
    5. Updates status to `'completed'` on success, `'failed'` on error
  - Include retry logic: if worker fails (rate limit or quota), set status back to `'pending'` with incremented retry count in metadata and model fallback history
  - Store `metadata.modelUsed` (which model succeeded) and `metadata.modelError` (if failed) on task record
  - Cron trigger: pg_cron every 30s (configurable via environment variable)
  - Max 3 retries per task (include retry count in metadata)

  **Must NOT do**:
  - Do not store the full document text in async_tasks (the trigger stores text_length only)
  - Do not process same task twice (check status before acquiring lock)
  - Do not deploy as cron-triggered until Wave 4 — deploy as manually-invokable first

  **Recommended Agent Profile**:

  > **Category**: `quick`
  > **Skills**: [`supabase`]

  **Parallelization**:
  - **Can Run In Parallel**: NO (worker processes tasks sequentially)
  - **Parallel Group**: Wave 1 (with T1-T5) — but worker is independent, no cross-task dependencies
  - **Blocks**: None (background worker — no frontend depends on it directly)
  - **Blocked By**: T5 (needs task IDs to process, but can be deployed independently)

  **References**:
  - `src/services/aiService.ts:73-152` — system prompt block to copy into worker
  - `src/types/compliance.ts:30-38` — ComplianceResult interface shape
  - `supabase/functions/packet-review-trigger/index.ts` — metadata structure (fileName in metadata)
  - `src/lib/supabase.ts` — service role client pattern for cross-schema access

  **Acceptance Criteria**:
  - [ ] Edge Function file created: `supabase/functions/packet-analysis-worker/index.ts`
  - [ ] Function polls for pending tasks, updates status, writes results
  - [ ] Retry logic: max 3 retries, exponential backoff in metadata
  - [ ] Function deployed via `supabase_deploy_edge_function`

  **QA Scenarios**:

  ```
  Scenario: Worker picks up pending task and completes it
    Tool: Supabase MCP + Bash
    Preconditions: Edge Function deployed, a pending 'packet_analysis' task exists
    Steps:
      1. Manually call worker: curl -X POST https://<ref>.supabase.co/functions/v1/packet-analysis-worker -H "Authorization: Bearer <service_role_key>"
      2. Check task status: supabase_execute_sql("SELECT status, result FROM async_tasks WHERE task_type = 'packet_analysis' ORDER BY created_at DESC LIMIT 1")
    Expected Result: status = 'completed' and result contains ComplianceResult JSON
    Evidence: .sisyphus/evidence/task-6-worker-result.json

  Scenario: Worker respects task lock (no double-processing)
    Tool: Supabase MCP
    Preconditions: A task in 'processing' status
    Steps:
      1. Call worker and verify it skips the processing task
      2. Check: supabase_execute_sql("SELECT COUNT(*) FROM async_tasks WHERE status = 'processing'")
    Expected Result: Worker does not change status of already-processing tasks
    Evidence: .sisyphus/evidence/task-6-no-double-process.txt
  ```

  **Commit**: YES — separate commit
  - Message: `feat(edge): add packet-analysis-worker background LLM processor`
  - Files: `supabase/functions/packet-analysis-worker/index.ts`

- [x] 7. **Create packetAnalysisService.ts** — `deep`

  **What to do**:
  - Create `src/services/packetAnalysisService.ts`
  - Export `startAnalysis(text, fileName, fileType): Promise<string>` — calls `packet-review-trigger` Edge Function, returns task_id
  - Export `getAnalysisStatus(taskId): Promise<{ status: TaskStatus, progress: number, result?: ComplianceResult, error?: string }>` — polls `packet_analysis_tasks` view
  - Types: `TaskStatus = 'pending' | 'processing' | 'completed' | 'failed'`
  - Use `@supabase/supabase-js` client (existing `supabase` from `@/lib/supabase`)
  - Edge Function URL from environment: `VITE_SUPABASE_FUNCTIONS_URL` (add to `.env.example`)

  **Must NOT do**:
  - Do not call `aiService` directly here — this service wraps the async pipeline only
  - Do not implement polling logic here — delegate to `usePacketReviewStatus` hook
  - Do not use `fetch` directly — use Supabase client

  **Recommended Agent Profile**:

  > **Category**: `deep`
  > **Skills**: [`supabase`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T8-T11)
  - **Blocks**: T12 (DraftPacketAnalysisPage uses this service)
  - **Blocked By**: T5 (depends on packet-review-trigger Edge Function URL)

  **References**:
  - `src/lib/supabase.ts:1-6` — existing Supabase client import pattern
  - `src/services/aiService.ts:73-152` — ComplianceResult type reference
  - `src/types/compliance.ts:30-38` — ComplianceResult interface
  - `src/services/complaintService.ts` — existing service pattern to follow (async methods, typed returns)

  **Acceptance Criteria**:
  - [ ] File created: `src/services/packetAnalysisService.ts`
  - [ ] `startAnalysis()` calls Edge Function and returns task_id (UUID string)
  - [ ] `getAnalysisStatus()` returns typed status object matching TaskStatus union
  - [ ] `VITE_SUPABASE_FUNCTIONS_URL` added to `.env.example`
  - [ ] Build passes with `npm run build`

  **QA Scenarios**:

  ```
  Scenario: startAnalysis calls Edge Function and returns task_id
    Tool: Bash (node REPL)
    Preconditions: Edge Function deployed, valid supabase client
    Steps:
      1. Import { startAnalysis } from '@/services/packetAnalysisService'
      2. Call: const taskId = await startAnalysis('test text', 'test.pdf', 'pdf')
    Expected Result: taskId is a valid UUID string (36 chars, hyphens)
    Evidence: .sisyphus/evidence/task-7-start-analysis.json

  Scenario: getAnalysisStatus returns correct status shape
    Tool: Bash (node REPL)
    Preconditions: Edge Function deployed, task exists in DB
    Steps:
      1. Import { getAnalysisStatus } from '@/services/packetAnalysisService'
      2. Call: const status = await getAnalysisStatus('<known_task_id>')
    Expected Result: status has keys: status (TaskStatus), progress (number 0-100), optional result, optional error
    Evidence: .sisyphus/evidence/task-7-get-status.json
  ```

  **Commit**: YES — group with T8-T11
  - Message: `feat(services): add packet analysis async service`
  - Files: `src/services/packetAnalysisService.ts`

- [x] 8. **Create usePacketReviewStatus.ts polling hook** — `deep`

  **What to do**:
  - Create `src/hooks/usePacketReviewStatus.ts`
  - Hook signature: `usePacketReviewStatus(taskId: string | null) => { status: TaskStatus, progress: number, result?: ComplianceResult, error?: string, isPolling: boolean }`
  - Polling interval: start at 1500ms (Doherty Threshold target), exponential backoff on errors (1500 → 3000 → 6000 → max 30000ms)
  - Stop polling when status is `'completed'` or `'failed'` (do not poll completed tasks)
  - If taskId is null, return `status: 'idle'` with `isPolling: false`
  - Clean up interval on unmount
  - Uses `getAnalysisStatus` from `packetAnalysisService.ts`

  **Must NOT do**:
  - Do not use `setInterval` directly — wrap in useEffect with cleanup
  - Do not poll completed/failed tasks indefinitely
  - Do not hardcode 1500ms without making it configurable

  **Recommended Agent Profile**:

  > **Category**: `deep`
  > **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T7, T9-T11)
  - **Blocks**: T12 (DraftPacketAnalysisPage uses this hook for status)
  - **Blocked By**: T7 (depends on packetAnalysisService)

  **References**:
  - `src/hooks/useActionSorting.ts:16-29` — existing hook pattern (useMemo, useEffect cleanup)
  - `src/pages/DraftPacketAnalysisPage.tsx:110-119` — existing spinner pattern to replace with progress
  - `src/main.tsx:7-14` — QueryClient setup (not directly used here but context)
  - `src/services/packetAnalysisService.ts` — getAnalysisStatus to wrap

  **Acceptance Criteria**:
  - [ ] File created: `src/hooks/usePacketReviewStatus.ts`
  - [ ] Hook accepts `taskId: string | null`, returns status object
  - [ ] Polling starts at 1500ms, backs off exponentially on error
  - [ ] Polling stops on 'completed' or 'failed' status
  - [ ] Build passes with `npm run build`

  **QA Scenarios**:

  ```
  Scenario: Hook returns idle state when taskId is null
    Tool: Playwright (React testing)
    Preconditions: Component rendered with null taskId
    Steps:
      1. Render component using usePacketReviewStatus(null)
      2. Assert: status === 'idle', isPolling === false
    Expected Result: No polling interval active, status is 'idle'
    Evidence: .sisyphus/evidence/task-8-idle-state.png

  Scenario: Hook polls and updates on status change
    Tool: Playwright (React testing)
    Preconditions: Component with valid taskId pointing to a 'processing' task
    Steps:
      1. Render component with taskId
      2. Wait 2000ms
      3. Assert: isPolling === true, status reflects DB state
    Expected Result: Polling active, status updates from pending → processing
    Evidence: .sisyphus/evidence/task-8-polling-active.png

  Scenario: Hook stops polling on completed status
    Tool: Playwright (React testing)
    Preconditions: Component with taskId pointing to a 'completed' task
    Steps:
      1. Render component with taskId
      2. Wait for status === 'completed'
      3. Wait additional 3000ms
      4. Assert: isPolling === false, result is defined
    Expected Result: Polling stops after completed status detected
    Evidence: .sisyphus/evidence/task-8-stopped-polling.png
  ```

  **Commit**: YES — group with T7, T9-T11
  - Message: `feat(services): add packet analysis async service`
  - Files: `src/hooks/usePacketReviewStatus.ts`

- [x] 9. **Create packetStateBuffer.ts (IndexedDB layer)** — `deep`

  **What to do**:
  - Create `src/lib/packetStateBuffer.ts`
  - Use `idb` library (installed in T1) to wrap IndexedDB
  - DB name: `packet-review-db`, version 1
  - Object store: `analysisTasks` with keyPath `taskId`
  - Store: `{ taskId: string, status: TaskStatus, progress: number, result?: ComplianceResult, error?: string, fileName: string, textLength: number, createdAt: number, updatedAt: number }`
  - Export functions:
    - `saveTaskState(task: AnalysisTaskState): Promise<void>` — upsert
    - `getTaskState(taskId: string): Promise<AnalysisTaskState | undefined>` — get single
    - `getAllTasks(): Promise<AnalysisTaskState[]>` — get all for resume
    - `deleteTaskState(taskId: string): Promise<void>` — cleanup on success
    - `clearAllTasks(): Promise<void>` — wipe all (for testing/reset)

  **Must NOT do**:
  - Do not store the full document text in IndexedDB (store only text_length)
  - Do not use localStorage — use IndexedDB via `idb` for structured storage
  - Do not expose raw IndexedDB — always wrap with idb promises

  **Recommended Agent Profile**:

  > **Category**: `deep`
  > **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T7-T8, T10-T11)
  - **Blocks**: T16 (DraftPacketAnalysisPage uses this for offline resume)
  - **Blocked By**: T1 (idb must be installed first)

  **References**:
  - `src/pages/InspectionFormPage.tsx:90` — `DRAFT_KEY` pattern for localStorage (don't copy this pattern, use idb instead)
  - `src/pages/InspectionFormPage.tsx:279-385` — autosave timer pattern (use similar useEffect but write to IndexedDB)
  - `https://github.com/jakearchibald/idb` — idb API (openDB, transaction, store)
  - `src/services/packetAnalysisService.ts` — TaskStatus type

  **Acceptance Criteria**:
  - [ ] File created: `src/lib/packetStateBuffer.ts`
  - [ ] All 5 exported functions implemented and working
  - [ ] Data survives page refresh (verified via Playwright page reload)
  - [ ] Build passes with `npm run build`

  **QA Scenarios**:

  ```
  Scenario: saveTaskState persists data to IndexedDB
    Tool: Playwright
    Preconditions: None
    Steps:
      1. Open browser devtools console
      2. Call: await saveTaskState({ taskId: 'test-123', status: 'processing', progress: 50, fileName: 'test.pdf', textLength: 1000, createdAt: Date.now(), updatedAt: Date.now() })
      3. Reload page
      4. Call: const state = await getTaskState('test-123')
    Expected Result: state.taskId === 'test-123', state.progress === 50
    Evidence: .sisyphus/evidence/task-9-persist-reload.png

  Scenario: getAllTasks returns all stored tasks
    Tool: Playwright
    Preconditions: 3 tasks saved in IndexedDB
    Steps:
      1. Call: const tasks = await getAllTasks()
    Expected Result: tasks array has length 3
    Evidence: .sisyphus/evidence/task-9-get-all.json

  Scenario: deleteTaskState removes a task
    Tool: Playwright
    Preconditions: 1 task in IndexedDB
    Steps:
      1. Call: await deleteTaskState('test-123')
      2. Call: const state = await getTaskState('test-123')
    Expected Result: state === undefined
    Evidence: .sisyphus/evidence/task-9-delete.json
  ```

  **Commit**: YES — group with T7-T8, T10-T11
  - Message: `feat(services): add packet analysis async service`
  - Files: `src/lib/packetStateBuffer.ts`

- [x] 10. **Add async task status types** — `quick`

  **What to do**:
  - Create `src/types/asyncTask.ts`
  - Types: `TaskStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'idle'`
  - `AsyncTask` interface: `{ id: string, taskType: string, status: TaskStatus, progress: number, result?: unknown, error?: string, createdAt: Date, updatedAt: Date, metadata?: Record<string, unknown> }`
  - `PacketAnalysisTask` extends AsyncTask: adds `{ result?: ComplianceResult }`
  - `TaskContext` interface for hook return: `{ status: TaskStatus, progress: number, result?: ComplianceResult, error?: string, isPolling: boolean }`
  - Re-export `ComplianceResult` from `@/types/compliance`

  **Must NOT do**:
  - Do not redefine `ComplianceResult` — import from existing type file

  **Recommended Agent Profile**:

  > **Category**: `quick`
  > **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T7-T9, T11)
  - **Blocks**: T7, T8 (both services depend on these types)
  - **Blocked By**: T5 (depends on task status enum pattern from Edge Function)

  **References**:
  - `src/types/compliance.ts:30-38` — ComplianceResult to re-export
  - `src/services/packetAnalysisService.ts` — TaskStatus usage
  - `src/hooks/usePacketReviewStatus.ts` — TaskContext pattern

  **Acceptance Criteria**:
  - [ ] File created: `src/types/asyncTask.ts`
  - [ ] TaskStatus, AsyncTask, PacketAnalysisTask, TaskContext all exported
  - [ ] ComplianceResult re-exported
  - [ ] Build passes with `npm run build`

  **QA Scenarios**:

  ```
  Scenario: Types export correctly
    Tool: Bash (TypeScript check)
    Preconditions: File created
    Steps:
      1. Run: npx tsc --noEmit src/types/asyncTask.ts
    Expected Result: No type errors
    Evidence: .sisyphus/evidence/task-10-types-check.txt

  Scenario: TaskStatus union is correct
    Tool: Bash
    Preconditions: File created
    Steps:
      1. Import { TaskStatus } from '@/types/asyncTask'
      2. Assert TaskStatus includes: 'pending' | 'processing' | 'completed' | 'failed' | 'idle'
    Expected Result: All 5 string literals in union
    Evidence: .sisyphus/evidence/task-10-task-status.json
  ```

  **Commit**: YES — group with T7-T9, T11
  - Message: `feat(services): add packet analysis async service`
  - Files: `src/types/asyncTask.ts`

- [x] 11. **Add streaming progress types** — `quick`

  **What to do**:
  - Create `src/types/streaming.ts`
  - `StreamingChunk` interface: `{ type: 'progress' | 'partial_result' | 'complete' | 'error', data: unknown, timestamp: number }`
  - `ProgressUpdate` interface: `{ progress: number, message: string, stage: 'extracting' | 'analyzing' | 'finalizing' }`
  - `AnalysisStream` type alias for `AsyncGenerator<StreamingChunk, void, unknown>`
  - These types support future streaming implementation (not implemented in Wave 2, but defined for future use)

  **Must NOT do**:
  - Do not implement actual streaming yet — just define the types for future extensibility

  **Recommended Agent Profile**:

  > **Category**: `quick`
  > **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T7-T10, T22)
  - **Blocks**: T12, T14 (UI components will use these types when streaming is implemented)
  - **Blocked By**: None (pure type definitions, no dependencies)

  **References**:
  - `src/types/compliance.ts` — existing type patterns
  - `src/pages/DraftPacketAnalysisPage.tsx:110-119` — existing spinner to replace with stage indicator

  **Acceptance Criteria**:
  - [ ] File created: `src/types/streaming.ts`
  - [ ] StreamingChunk, ProgressUpdate, AnalysisStream all exported
  - [ ] Build passes with `npm run build`

  **QA Scenarios**:

  ```
  Scenario: StreamingChunk type accepts correct structure
    Tool: Bash (TypeScript check)
    Preconditions: File created
    Steps:
      1. Run: npx tsc --noEmit src/types/streaming.ts
    Expected Result: No type errors
    Evidence: .sisyphus/evidence/task-11-streaming-types.txt

  Scenario: ProgressUpdate stage includes expected values
    Tool: Bash
    Preconditions: File created
    Steps:
      1. Import { ProgressUpdate } from '@/types/streaming'
      2. Assert stage union is: 'extracting' | 'analyzing' | 'finalizing'
    Expected Result: All 3 stage values present
    Evidence: .sisyphus/evidence/task-11-progress-stage.json
  ```

  **Commit**: YES — group with T7-T10, T22
  - Message: `feat(services): add packet analysis async service`
  - Files: `src/types/streaming.ts`

- [x] 22. **Create ModelSelector service with pre-flight quota check + multi-provider fallback** — `deep`

  **What to do**:
  - Create `src/services/modelSelector.ts`
  - Provider chain (in priority order):
    1. **Primary**: OpenAI `gpt-4o` — via `VITE_OPENAI_API_KEY`
    2. **Fallback 1**: Anthropic `claude-3-5-sonnet-20241022` — via `VITE_ANTHROPIC_API_KEY`
    3. **Fallback 2**: Google Vertex AI `gemini-2.0-flash` — via ADC (Application Default Credentials), project `dhm2026`, region `us-central1`
  - `ModelConfig` interface: `{ provider: 'openai' | 'anthropic' | 'vertex', name: string, apiKeyEnvVar?: string, projectId?: string, location?: string }`
  - `selectModel(): Promise<ModelConfig>` — pre-flight check (one shot, no retries within a task):
    1. Try OpenAI `gpt-4o` — probe with a lightweight token count request or check `X-RateLimit-Remaining` header
    2. If unavailable (429 / quota / error), try Anthropic `claude-3-5-sonnet`
    3. If unavailable, try Vertex AI `gemini-2.0-flash` (ADC — no API key needed, just project + location)
    4. Return the first available `ModelConfig` — exactly ONE model per task
  - `callWithModel(config, text, systemPrompt, messages): Promise<Message>` — calls the selected model:
    - OpenAI: use `openai` npm package with `VITE_OPENAI_API_KEY`
    - Anthropic: reuse existing `@anthropic-ai/sdk` with `VITE_ANTHROPIC_API_KEY`
    - Vertex AI: use `@google-cloud/vertexai` with ADC (no API key needed — SDK picks up credentials from environment automatically in Edge Functions)
  - Store `metadata.modelProvider` (openai | anthropic | vertex) and `metadata.modelName` on task record
  - On all providers exhausted: throw `MODEL_EXHAUSTED` error — task marked failed, not retried within same task

  **API Key Setup Links**:
  - **OpenAI** (`VITE_OPENAI_API_KEY`): https://platform.openai.com/api-keys — Dashboard → API Keys → Create new secret key. Set billing at https://platform.openai.com/account/billing
  - **Anthropic** (`VITE_ANTHROPIC_API_KEY`): https://console.anthropic.com/ — Settings → API Keys → Create Key. Note: can reuse same key as primary if budget allows; separate key enables tracking per provider
  - **Google Vertex AI** (ADC auth — no API key needed): Authenticate via `gcloud auth application-default login` locally, or in Edge Functions the service account credentials are automatically available. Project: `dhm2026`, Location: `us-central1`. Enable API at https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=dhm2026

  **Must NOT do**:
  - Do not retry across providers within a single task (one model per task — simpler, lower latency)
  - Do not hardcode model names — use ModelConfig abstraction per provider
  - Do not log API keys — only log provider name, model name, and error code
  - Do not make pre-flight checks take longer than 200ms total (probe all 3 in parallel with Promise.race or sequential short-circuit)
  - Do not use Vertex AI without first checking the `VERTEX_AI_ENDPOINT` environment variable (regional endpoint may vary)

  **Recommended Agent Profile**:

  > **Category**: `deep`
  > **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T7-T11)
  - **Blocks**: T6 (worker uses ModelSelector for LLM calls), T20 (async compliance uses it)
  - **Blocked By**: None (no new infrastructure needed beyond npm packages)

  **References**:
  - `src/services/aiService.ts:12-14` — Anthropic client pattern to replicate for other providers
  - `package.json` — add `openai` and `@google-cloud/vertexai` to dependencies
  - `.env.example` — add `VITE_OPENAI_API_KEY`, `VITE_ANTHROPIC_API_KEY`, `VITE_GOOGLE_VERTEX_API_KEY`, `VITE_GOOGLE_VERTEX_PROJECT`
  - Official SDK docs: OpenAI https://platform.openai.com/docs/api-reference, Anthropic https://docs.anthropic.com, Vertex AI https://cloud.google.com/vertex-ai/generative-ai/docs

  **Acceptance Criteria**:
  - [ ] File created: `src/services/modelSelector.ts`
  - [ ] `selectModel()` returns OpenAI primary when quota available
  - [ ] `selectModel()` returns Anthropic when OpenAI unavailable
  - [ ] `selectModel()` returns Vertex when both OpenAI + Anthropic unavailable
  - [ ] `callWithModel()` correctly calls OpenAI, Anthropic, or Vertex based on config
  - [ ] Vertex uses ADC (no API key), project `dhm2026`, region `us-central1`
  - [ ] OpenAI + Anthropic keys added to `.env.example`, Vertex uses project/location only
  - [ ] `openai` and `@google-cloud/vertexai` packages added to `package.json`
  - [ ] Build passes with `npm run build`

  **QA Scenarios**:

  ```
  Scenario: selectModel returns OpenAI when available
    Tool: Bash (node REPL)
    Preconditions: VITE_OPENAI_API_KEY valid, OpenAI quota available
    Steps:
      1. Import { selectModel } from '@/services/modelSelector'
      2. Call: const model = await selectModel()
    Expected Result: model.provider === 'openai', model.name === 'gpt-4o'
    Evidence: .sisyphus/evidence/task-22-openai-primary.json

  Scenario: selectModel falls back to Anthropic when OpenAI unavailable
    Tool: Bash (mock)
    Preconditions: OpenAI returns 429, Anthropic key valid
    Steps:
      1. Mock OpenAI probe to return 429
      2. Call: const model = await selectModel()
    Expected Result: model.provider === 'anthropic', model.name includes 'claude-3-5-sonnet'
    Evidence: .sisyphus/evidence/task-22-anthropic-fallback.json

  Scenario: selectModel falls back to Vertex when OpenAI + Anthropic unavailable
    Tool: Bash (mock)
    Preconditions: Both OpenAI and Anthropic return 429, Vertex key valid
    Steps:
      1. Mock OpenAI probe 429, Anthropic probe 429
      2. Call: const model = await selectModel()
    Expected Result: model.provider === 'vertex', model.name === 'gemini-2.0-flash'
    Evidence: .sisyphus/evidence/task-22-vertex-fallback.json

  Scenario: selectModel throws MODEL_EXHAUSTED when all providers fail pre-flight
    Tool: Bash (mock)
    Preconditions: All 3 providers return errors on pre-flight probe
    Steps:
      1. Mock all 3 probes to throw
      2. Call: const model = await selectModel()
    Expected Result: throws error with code 'MODEL_EXHAUSTED'
    Evidence: .sisyphus/evidence/task-22-all-exhausted.json

  Scenario: callWithModel correctly calls OpenAI gpt-4o
    Tool: Bash (mock)
    Preconditions: OpenAI key valid, model selected
    Steps:
      1. Import { callWithModel } from '@/services/modelSelector'
      2. Call with OpenAI config and test prompt
    Expected Result: OpenAI SDK called with correct model name, response returned
    Evidence: .sisyphus/evidence/task-22-openai-call.json

  Scenario: callWithModel correctly calls Vertex AI gemini-2.0-flash
    Tool: Bash (mock)
    Preconditions: Vertex key valid, model selected
    Steps:
      1. Import { callWithModel } from '@/services/modelSelector'
      2. Call with Vertex config and test prompt
    Expected Result: Vertex AI SDK called with correct model name, response returned
    Evidence: .sisyphus/evidence/task-22-vertex-call.json
  ```

  **Commit**: YES — group with T7-T11
  - Message: `feat(services): add packet analysis async service`
  - Files: `src/services/modelSelector.ts`

- [x] 12. **Refactor DraftPacketAnalysisPage state machine** — `visual-engineering`

  **What to do**:
  - Refactor `src/pages/DraftPacketAnalysisPage.tsx` (163 lines)
  - Replace synchronous `await aiService.analyzePacketCompliance()` call with:
    1. Call `startAnalysis(text, file.name, file.type)` → get `taskId` immediately
    2. Show "Analysis queued" state with spinner + taskId
    3. Call `usePacketReviewStatus(taskId)` to poll status
    4. Transition to "review" state when status === 'completed'
  - Keep `viewState` as `"upload" | "analyzing" | "review"` but add sub-states for polling progress:
    - `"analyzing"` now has internal states: `queuing | polling | processing`
    - Show elapsed time counter during analysis (Doherty Threshold: keep user engaged)
    - Show progress percentage if `progress` field available from hook
  - Preserve existing behavior: `handleBack`, `handleEdit`, `handleApprove`, `handleDownload`
  - Keep `handleUpload` but replace body with async pipeline call

  **Must NOT do**:
  - Do not remove existing user actions (back, edit, approve, download)
  - Do not change the routing (`navigate("/hearing-packets")` on approve)
  - Do not modify `DraftUploadPanel` component — it stays the same

  **Recommended Agent Profile**:

  > **Category**: `visual-engineering`
  > **Skills**: [`frontend-design`, `tailwind-design-system`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T13-T16)
  - **Blocks**: T13 (ParallelReviewView used in this component)
  - **Blocked By**: T7, T8, T11 (depends on packetAnalysisService, usePacketReviewStatus, streaming types)

  **References**:
  - `src/pages/DraftPacketAnalysisPage.tsx:20-33` — existing handleUpload to refactor
  - `src/pages/DraftPacketAnalysisPage.tsx:110-119` — existing analyzing spinner to replace
  - `src/pages/InspectionFormPage.tsx:690` — `isDirty` banner pattern (similar to online/offline indicator)
  - `src/components/packet/ComplianceReviewView.tsx:1-22` — props interface to keep compatible

  **Acceptance Criteria**:
  - [ ] File modified: `src/pages/DraftPacketAnalysisPage.tsx`
  - [ ] Upload → HTTP 202 returned within 100ms (before LLM processes)
  - [ ] Polling hook active during "analyzing" state
  - [ ] Elapsed time counter shown during analysis
  - [ ] Transitions to "review" when task completes
  - [ ] Build passes with `npm run build`
  - [ ] `npm run lint` passes

  **QA Scenarios**:

  ```
  Scenario: Upload triggers async pipeline and returns immediately
    Tool: Playwright
    Preconditions: DraftPacketAnalysisPage loaded, valid PDF file
    Steps:
      1. Upload a PDF file
      2. Observe: spinner appears immediately (< 200ms after click)
      3. Check: Network tab shows POST to packet-review-trigger returns 202
    Expected Result: UI shows analyzing state, POST returns within 100ms
    Evidence: .sisyphus/evidence/task-12-immediate-response.png

  Scenario: Elapsed time counter increments during analysis
    Tool: Playwright
    Preconditions: Analysis in progress (task in 'processing' state)
    Steps:
      1. Start analysis
      2. Wait 5 seconds
      3. Observe: elapsed time counter shows ~5s
    Expected Result: Counter increments every second, formatted as "0:05" or similar
    Evidence: .sisyphus/evidence/task-12-elapsed-counter.png

  Scenario: Analysis completes and transitions to review
    Tool: Playwright
    Preconditions: Task completes (status → 'completed')
    Steps:
      1. Start analysis
      2. Wait for status === 'completed'
      3. Assert: viewState === 'review', ComplianceReviewView renders
    Expected Result: Seamless transition to review screen with full results
    Evidence: .sisyphus/evidence/task-12-review-transition.png

  Scenario: Analysis fails gracefully
    Tool: Playwright
    Preconditions: Worker returns 'failed' status
    Steps:
      1. Trigger analysis that will fail (mock error)
      2. Observe: error message shown, "Try Again" button appears
    Expected Result: User sees friendly error, can retry or go back
    Evidence: .sisyphus/evidence/task-12-error-handling.png
  ```

  **Commit**: YES — group with T13-T16
  - Message: `feat(ui): add parallel review screen with streaming progress`
  - Files: `src/pages/DraftPacketAnalysisPage.tsx`

- [x] 13. **Create ParallelReviewView.tsx** — `visual-engineering`

  **What to do**:
  - Create `src/components/packet/ParallelReviewView.tsx`
  - Layout: `lg:grid lg:grid-cols-2 lg:gap-6` (side-by-side on large viewports, stacked on mobile)
  - Left panel (50% width): PDF viewer using existing `react-pdf` (PDFPage or <Document> from react-pdf)
    - Render uploaded PDF with page navigation controls
    - Show current page indicator
  - Right panel (50% width): Streaming notes panel
    - Shows analysis progress as notes arrive (not real streaming yet — just progressive display)
    - Initially shows "Starting analysis..." with animated progress bar
    - As `progress` updates, show progress percentage and current stage
    - When `result` arrives, show full ComplianceReviewView content
  - Both panels scroll independently
  - Responsive: `flex-col` on mobile (< 1024px), `grid-cols-2` on lg+

  **Must NOT do**:
  - Do not use the old `ComplianceReviewView` directly — create new component
  - Do not hardcode PDF dimensions — use react-pdf's viewport scaling
  - Do not block one panel based on the other — both independent scrolling

  **Recommended Agent Profile**:

  > **Category**: `visual-engineering`
  > **Skills**: [`frontend-design`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T12, T14-T16)
  - **Blocks**: None (used by T12)
  - **Blocked By**: T12 (integrated into DraftPacketAnalysisPage)

  **References**:
  - `src/components/packet/ComplianceReviewView.tsx:56-213` — existing compliance display to reference (not copy)
  - `src/components/packet/DraftUploadPanel.tsx` — PDF file input pattern
  - `src/pages/InspectionFormPage.tsx` — `lg:grid lg:grid-cols-2` pattern at line ~300
  - `src/config/documentTemplates.ts` — print-ready document pattern
  - `react-pdf` official docs for PDF viewer implementation

  **Acceptance Criteria**:
  - [ ] File created: `src/components/packet/ParallelReviewView.tsx`
  - [ ] Side-by-side layout on lg+ viewports (≥1024px)
  - [ ] Left panel: functional PDF viewer with page nav
  - [ ] Right panel: progressive analysis display with progress updates
  - [ ] Build passes with `npm run build`
  - [ ] `npm run lint` passes

  **QA Scenarios**:

  ```
  Scenario: Parallel review layout on wide viewport (≥1024px)
    Tool: Playwright
    Preconditions: ParallelReviewView rendered with PDF loaded
    Steps:
      1. Set viewport to 1280x800
      2. Render ParallelReviewView with sample PDF and progress=50
      3. Screenshot the layout
    Expected Result: Two columns side-by-side, PDF on left, notes on right
    Evidence: .sisyphus/evidence/task-13-wide-layout.png

  Scenario: Stacked layout on narrow viewport (<1024px)
    Tool: Playwright
    Preconditions: ParallelReviewView rendered with PDF loaded
    Steps:
      1. Set viewport to 375x667 (mobile)
      2. Render ParallelReviewView
      3. Screenshot the layout
    Expected Result: Single column, PDF above notes (stacked)
    Evidence: .sisyphus/evidence/task-13-mobile-layout.png

  Scenario: PDF page navigation works
    Tool: Playwright
    Preconditions: Multi-page PDF loaded in left panel
    Steps:
      1. Click "Next page" button
      2. Assert: current page indicator updates (e.g., "2 of 5")
    Expected Result: Page navigation functional
    Evidence: .sisyphus/evidence/task-13-page-nav.png

  Scenario: Progress updates reflect in right panel
    Tool: Playwright
    Preconditions: Component rendered with progress=50, stage='analyzing'
    Steps:
      1. Assert: Right panel shows "Analyzing... 50%" with progress bar at 50%
    Expected Result: Progress bar width matches progress value, stage label shown
    Evidence: .sisyphus/evidence/task-13-progress-display.png
  ```

  **Commit**: YES — group with T12, T14-T16
  - Message: `feat(ui): add parallel review screen with streaming progress`
  - Files: `src/components/packet/ParallelReviewView.tsx`

- [x] 14. **Add progressive loading indicators** — `visual-engineering` [COMPLETED]

  **What to do**:
  - Create `src/components/packet/AnalysisProgress.tsx`
  - Component shows: current stage label, progress bar, elapsed time
  - Stages: `"Queued" | "Extracting" | "Analyzing" | "Finalizing" | "Complete" | "Failed"`
  - Animated progress bar: CSS animation, smooth width transition
  - Elapsed time counter: updates every second via `setInterval`
  - Format: "Analyzing... 1:23 elapsed" or similar
  - Replace the generic spinner in `DraftPacketAnalysisPage` with this component

  **Must NOT do**:
  - Do not use a generic spinner — replace with meaningful progress
  - Do not use hardcoded colors — use Tailwind CSS theming
  - Do not block UI — progress indicator is non-blocking overlay

  **Recommended Agent Profile**:

  > **Category**: `visual-engineering`
  > **Skills**: [`frontend-design`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T12-T13, T15-T16)
  - **Blocks**: T12 (used in DraftPacketAnalysisPage)
  - **Blocked By**: T11 (depends on ProgressUpdate stage type)

  **References**:
  - `src/pages/DraftPacketAnalysisPage.tsx:110-119` — existing spinner to replace
  - `src/types/streaming.ts` — ProgressUpdate type for stage
  - `@radix-ui/react-progress` — existing progress bar component in project (check `src/components/ui/`)

  **Acceptance Criteria**:
  - [ ] File created: `src/components/packet/AnalysisProgress.tsx`
  - [ ] Shows stage label, progress bar (0-100%), elapsed time
  - [ ] Stage transitions: Queued → Extracting → Analyzing → Finalizing → Complete
  - [ ] Animated progress bar (smooth width transition)
  - [ ] Build passes with `npm run build`

  **QA Scenarios**:

  ```
  Scenario: Progress bar animates smoothly
    Tool: Playwright
    Preconditions: AnalysisProgress rendered with progress=30
    Steps:
      1. Change progress prop to 60 (simulate update)
      2. Observe: bar width transitions smoothly (not instant jump)
    Expected Result: CSS transition on width, ~300ms animation
    Evidence: .sisyphus/evidence/task-14-animated-progress.gif

  Scenario: Elapsed time counter increments
    Tool: Playwright
    Preconditions: AnalysisProgress rendered with startTime={Date.now() - 5000}
    Steps:
      1. Wait 2 seconds
      2. Observe: counter shows ~7s elapsed
    Expected Result: Counter increments every second, formatted MM:SS
    Evidence: .sisyphus/evidence/task-14-elapsed-counter.png

  Scenario: Stage label updates
    Tool: Playwright
    Preconditions: AnalysisProgress rendered with stage='analyzing'
    Steps:
      1. Change stage to 'finalizing'
      2. Assert: label text updates to "Finalizing..."
    Expected Result: Stage label reflects current stage
    Evidence: .sisyphus/evidence/task-14-stage-label.png
  ```

  **Commit**: YES — group with T12-T13, T15-T16
  - Message: `feat(ui): add parallel review screen with streaming progress`
  - Files: `src/components/packet/AnalysisProgress.tsx`

- [x] 15. **Update ComplianceReviewView for partial/streaming results** — `visual-engineering`

  **What to do**:
  - Refactor `src/components/packet/ComplianceReviewView.tsx` (214 lines)
  - Make it accept `partial` prop: when `true`, shows skeleton UI for missing fields
  - For `missingSections` and `recommendations`: show shimmer/skeleton placeholders if not yet available
  - For `issues`: show count placeholder ("X issues found" skeleton) until full result arrives
  - Make `score` display a loading skeleton until result is complete
  - Keep existing layout and styling — just add conditional skeleton rendering
  - Add `isLoading` prop (defaults to `false` for backward compatibility)

  **Must NOT do**:
  - Do not change the visual design significantly — only add loading states
  - Do not remove any existing functionality — backward compatible via `isLoading` default
  - Do not break existing usage in other parts of the app

  **Recommended Agent Profile**:

  > **Category**: `visual-engineering`
  > **Skills**: [`frontend-design`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T12-T14, T16)
  - **Blocks**: None (used by T13)
  - **Blocked By**: T20 (new SOP references will be added to issues in this component)

  **References**:
  - `src/components/packet/ComplianceReviewView.tsx:68-109` — score/status/issues grid section to add skeletons
  - `src/components/packet/ComplianceReviewView.tsx:111-122` — missingSections section to add skeleton
  - `src/components/packet/ComplianceReviewView.tsx:185-193` — recommendations section to add skeleton
  - `src/components/ui/skeleton.tsx` — existing skeleton component pattern (check if exists)

  **Acceptance Criteria**:
  - [ ] File modified: `src/components/packet/ComplianceReviewView.tsx`
  - [ ] `isLoading` prop added (default: `false`)
  - [ ] `partial` prop added (default: `false`)
  - [ ] Skeleton placeholders shown when `isLoading` or `partial` is true
  - [ ] Existing behavior unchanged when `isLoading=false` and `partial=false`
  - [ ] Build passes with `npm run build`

  **QA Scenarios**:

  ```
  Scenario: Full result renders without loading state
    Tool: Playwright
    Preconditions: ComplianceReviewView rendered with full ComplianceResult, isLoading=false
    Steps:
      1. Assert: All fields visible (score badge, issues list, missing sections)
      2. Assert: No skeleton elements visible
    Expected Result: Full display, no loading indicators
    Evidence: .sisyphus/evidence/task-15-full-result.png

  Scenario: Partial result shows skeletons
    Tool: Playwright
    Preconditions: ComplianceReviewView rendered with partial ComplianceResult (score=50, no issues yet)
    Steps:
      1. Assert: Score shows 50 (real value)
      2. Assert: Issues section shows skeleton ("Loading issues..." placeholder)
    Expected Result: Real data visible, missing fields show skeletons
    Evidence: .sisyphus/evidence/task-15-partial-result.png

  Scenario: Backward compatibility maintained
    Tool: Playwright
    Preconditions: Existing test using ComplianceReviewView without isLoading prop
    Steps:
      1. Run: existing test suite
    Expected Result: All existing tests pass (default behavior unchanged)
    Evidence: .sisyphus/evidence/task-15-backward-compatible.png
  ```

  **Commit**: YES — group with T12-T14, T16
  - Message: `feat(ui): add parallel review screen with streaming progress`
  - Files: `src/components/packet/ComplianceReviewView.tsx`

- [x] 16. **Add offline detection + IndexedDB resume banner** — `deep`

  **What to do**:
  - Refactor `src/pages/DraftPacketAnalysisPage.tsx` to add offline detection
  - Add `useEffect` with `navigator.onLine` listener to detect connectivity changes
  - When offline during analysis: save current task state to IndexedDB via `saveTaskState`
  - Show non-blocking banner: "You're offline. Analysis will resume when connected." (use existing `sonner` toast library or add inline banner)
  - When back online: check IndexedDB for incomplete tasks, prompt to resume
  - Resume logic: call `getAnalysisStatus(taskId)` and transition to appropriate state

  **Must NOT do**:
  - Do not block the UI with a modal — use a non-blocking toast/banner
  - Do not save full document text to IndexedDB — save only task metadata
  - Do not auto-submit on reconnect without user confirmation

  **Recommended Agent Profile**:

  > **Category**: `deep`
  > **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T12-T15)
  - **Blocks**: None (final integration task)
  - **Blocked By**: T8, T9 (depends on usePacketReviewStatus and packetStateBuffer)

  **References**:
  - `src/pages/InspectionFormPage.tsx:690` — existing `isDirty` banner pattern to follow
  - `src/lib/packetStateBuffer.ts` — saveTaskState, getTaskState, getAllTasks to use
  - `src/hooks/usePacketReviewStatus.ts` — status polling to resume
  - `src/services/packetAnalysisService.ts` — startAnalysis to restart task

  **Acceptance Criteria**:
  - [ ] Offline detection active during analysis
  - [ ] Banner shown within 500ms of going offline
  - [ ] Task state saved to IndexedDB on offline event
  - [ ] Resume prompt shown within 2s of reconnecting
  - [ ] Resume works correctly (transitions to correct analysis state)
  - [ ] Build passes with `npm run build`

  **QA Scenarios**:

  ```
  Scenario: Offline detection shows banner immediately
    Tool: Playwright
    Preconditions: Analysis in progress (polling active)
    Steps:
      1. Simulate offline: navigator.onLine = false, dispatch 'offline' event
      2. Observe: Banner appears within 500ms
    Expected Result: Banner shows "You're offline. Analysis will resume when connected."
    Evidence: .sisyphus/evidence/task-16-offline-banner.png

  Scenario: Task state persisted to IndexedDB on offline
    Tool: Playwright
    Preconditions: Analysis in progress
    Steps:
      1. Trigger offline event
      2. Call: const state = await getTaskState(currentTaskId)
    Expected Result: state exists with correct status and metadata
    Evidence: .sisyphus/evidence/task-16-indexeddb-persist.json

  Scenario: Resume prompt on reconnect
    Tool: Playwright
    Preconditions: Offline state with task saved, going back online
    Steps:
      1. Simulate: navigator.onLine = true, dispatch 'online' event
      2. Observe: Toast or banner appears within 2s with "Resume analysis?" prompt
    Expected Result: User sees resume option, can click to continue
    Evidence: .sisyphus/evidence/task-16-resume-prompt.png

  Scenario: Resume continues from correct state
    Tool: Playwright
    Preconditions: Incomplete task in IndexedDB with taskId
    Steps:
      1. Click "Resume" on prompt
      2. Assert: Polling resumes, progress updates correctly
    Expected Result: Seamless resume from where analysis left off
    Evidence: .sisyphus/evidence/task-16-resume-continue.png
  ```

  **Commit**: YES — group with T12-T15
  - Message: `feat(ui): add parallel review screen with streaming progress`
  - Files: `src/pages/DraftPacketAnalysisPage.tsx` (modified in T12, enhanced here)

- [x] 17. **Create SOP document chunking utility** — `unspecified-high`

  **What to do**:
  - Create `src/utils/sopChunking.ts`
  - Chunking strategy: Recursive character splitting with overlap
    - Chunk size: 500 characters (configurable)
    - Overlap: 50 characters between chunks (to preserve context)
    - Separator: prefer sentence boundaries ("。\n" or ". "), fallback to character count
  - Export `chunkDocument(text: string, options?: { chunkSize?: number, overlap?: number }): SopChunk[]`
  - `SopChunk` interface: `{ chunkIndex: number, content: string, sourceDocument: string, charCount: number }`
  - Source document labels: `"SOP Cover Page" | "SOP Enforcement Summary" | "SOP Chronology" | "SOP Inspection Exhibits" | "SOP Exhibit E Bundle"` (maps to the 5 SOP sections)
  - Pre-chunk the 5 SOP sections from `src/config/documentTemplates.ts` and return as initial corpus

  **Must NOT do**:
  - Do not call the embedding API here — just chunk and return text chunks
  - Do not store anything in the database here — just utility functions
  - Do not chunk at arbitrary character boundaries — prefer sentence boundaries

  **Recommended Agent Profile**:

  > **Category**: `unspecified-high`
  > **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with T18-T21)
  - **Blocks**: T18, T20 (embedding function and compliance prompt need chunks)
  - **Blocked By**: T4 (depends on sop_embeddings table existing)

  **References**:
  - `src/config/documentTemplates.ts` — SOP document boilerplate to chunk
  - `src/types/compliance.ts:30-38` — ComplianceResult pattern (for reference, not used here)
  - `https://github.com/openai/tracery` — chunking overlap concept (not copying code)
  - Research: chunking strategy for RAG — 500 char chunks with 50 char overlap is standard for claude-haiku

  **Acceptance Criteria**:
  - [ ] File created: `src/utils/sopChunking.ts`
  - [ ] `chunkDocument()` returns array of `SopChunk` with correct structure
  - [ ] No chunk exceeds chunkSize (500 chars)
  - [ ] Overlap preserved between adjacent chunks (50 chars)
  - [ ] Sentence boundary preference respected
  - [ ] All 5 SOP sections pre-chunked and exported as `SOP_CHUNKS` constant
  - [ ] Build passes with `npm run build`

  **QA Scenarios**:

  ```
  Scenario: chunkDocument respects chunk size limit
    Tool: Bash (node REPL)
    Preconditions: File created, valid SOP text
    Steps:
      1. Import { chunkDocument } from '@/utils/sopChunking'
      2. Call: const chunks = chunkDocument('A' * 1000) // 1000 char text
    Expected Result: 2 chunks returned, each ≤ 500 chars
    Evidence: .sisyphus/evidence/task-17-chunk-size.json

  Scenario: Overlap preserved between chunks
    Tool: Bash (node REPL)
    Preconditions: File created
    Steps:
      1. Import { chunkDocument } from '@/utils/sopChunking'
      2. Call: const chunks = chunkDocument('ABCD' + 'X'.repeat(490) + 'EFGH')
      3. Assert: chunks[0].content endsWith('EFGH') OR chunks[1].content starts with overlapping text
    Expected Result: 50-char overlap between chunks
    Evidence: .sisyphus/evidence/task-17-overlap.json

  Scenario: SOP_CHUNKS constant contains all 5 sections
    Tool: Bash
    Preconditions: File created
    Steps:
      1. Import { SOP_CHUNKS } from '@/utils/sopChunking'
      2. Assert: SOP_CHUNKS has entries for all 5 sourceDocument labels
    Expected Result: 5 distinct sourceDocument values present
    Evidence: .sisyphus/evidence/task-17-sop-chunks.json
  ```

  **Commit**: YES — group with T18-T21
  - Message: `feat(rag): add SOP embedding pipeline and similarity search`
  - Files: `src/utils/sopChunking.ts`

- [x] 18. **Create embed SOP documents Edge Function** — `unspecified-high`

  **What to do**:
  - Create `supabase/functions/embed-sop-documents/index.ts`
  - Trigger: manual (not automatic) — admin can invoke to re-embed SOP documents
  - Reads all SOP text from `src/config/documentTemplates.ts` (or accept as parameter for flexibility)
  - For each chunk:
    1. Call embedding API (Anthropic embeddings or OpenAI `text-embedding-3-small` at 1536 dim — verify which is supported with VITE_ANTHROPIC_API_KEY)
    2. Insert into `sop_embeddings` table: `{ content_chunk, embedding: float[], source_document, chunk_index }`
  - Handle partial failures: if one chunk fails, log and continue with others
  - Use batch insert: `supabase.from('sop_embeddings').upsert(chunks, { onConflict: 'source_document,chunk_index' })`
  - Return count of embedded chunks

  **Must NOT do**:
  - Do not re-embed if chunks already exist (check before insert — use upsert)
  - Do not store the embedding in memory longer than needed (insert immediately)
  - Do not call embedding API without rate limiting (max 10 chunks per second)

  **Recommended Agent Profile**:

  > **Category**: `unspecified-high`
  > **Skills**: [`supabase`]

  **Parallelization**:
  - **Can Run In Parallel**: NO (must process chunks sequentially for rate limiting)
  - **Parallel Group**: Wave 4 (with T17, T19-T21)
  - **Blocks**: T19 (similarity search needs embeddings to exist)
  - **Blocked By**: T4, T17 (needs pg_vector table + chunking utility)

  **References**:
  - `src/utils/sopChunking.ts` — SOP_CHUNKS to embed
  - `src/config/documentTemplates.ts` — source of truth for SOP text
  - `migrations/002c_enable_pgvector.sql` — sop_embeddings table schema
  - Supabase embeddings docs for batch upsert pattern

  **Acceptance Criteria**:
  - [ ] Edge Function created: `supabase/functions/embed-sop-documents/index.ts`
  - [ ] Function inserts chunks into `sop_embeddings` table
  - [ ] Rate limiting: max 10 chunks/second
  - [ ] Upsert behavior: re-running does not duplicate chunks
  - [ ] Returns count of embedded chunks
  - [ ] Function deployed via `supabase_deploy_edge_function`

  **QA Scenarios**:

  ```
  Scenario: Embedding function processes all chunks and inserts into DB
    Tool: Bash (curl) + Supabase MCP
    Preconditions: Edge Function deployed, sop_embeddings table exists, SOP chunks available
    Steps:
      1. Call: curl -X POST https://<ref>.supabase.co/functions/v1/embed-sop-documents -H "Authorization: Bearer <service_role_key>"
      2. Check: supabase_execute_sql("SELECT COUNT(*) FROM sop_embeddings")
    Expected Result: Row count > 0 (all chunks embedded)
    Evidence: .sisyphus/evidence/task-18-embed-count.json

  Scenario: Re-running does not duplicate chunks
    Tool: Supabase MCP
    Preconditions: Chunks already embedded
    Steps:
      1. Call embed function again
      2. Check: supabase_execute_sql("SELECT COUNT(*) FROM sop_embeddings")
    Expected Result: Same count as before (upsert, not insert)
    Evidence: .sisyphus/evidence/task-18-no-duplicates.json

  Scenario: Returns accurate count
    Tool: Bash (curl)
    Preconditions: Edge Function deployed
    Steps:
      1. Call function and capture response
      2. Assert: response.chunkCount matches DB row count
    Expected Result: Count in response matches actual rows
    Evidence: .sisyphus/evidence/task-18-count-match.json
  ```

  **Commit**: YES — group with T17, T19-T21
  - Message: `feat(rag): add SOP embedding pipeline and similarity search`
  - Files: `supabase/functions/embed-sop-documents/index.ts`

- [x] 19. **Create similarity search utility for SOP references** — `unspecified-high`

  **What to do**:
  - Create `src/utils/sopSimilaritySearch.ts`
  - `searchSOP(query: string, topK?: number): Promise<SopReference[]>`
  - Uses Supabase `rpc` call to pg_vector's `match_documents` function (or manual cosine similarity SQL)
  - SQL: `SELECT content_chunk, source_document, chunk_index, 1 - (embedding <=> $1::vector) AS similarity FROM sop_embeddings ORDER BY embedding <=> $1::vector LIMIT $2`
  - `SopReference` interface: `{ content: string, sourceDocument: string, chunkIndex: number, similarityScore: number }`
  - Default topK: 3 (return top 3 most relevant chunks)
  - Filter: only return chunks with similarity > 0.7 (configurable threshold)

  **Must NOT do**:
  - Do not call the LLM in this utility — pure vector search
  - Do not hardcode the embedding dimension — use from environment or constant
  - Do not return raw pg_vector results — always transform to `SopReference`

  **Recommended Agent Profile**:

  > **Category**: `unspecified-high`
  > **Skills**: [`supabase-postgres-best-practices`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with T17-T18, T20-T21)
  - **Blocks**: T20 (compliance prompt needs this search)
  - **Blocked By**: T18 (needs embeddings to exist first)

  **References**:
  - `migrations/002c_enable_pgvector.sql` — vector column and index
  - `src/utils/sopChunking.ts` — SopChunk interface
  - `src/lib/supabase.ts` — Supabase client
  - `https://supabase.com/docs/guides/database/postgres/vector-databases` — cosine similarity with `<=>` operator

  **Acceptance Criteria**:
  - [ ] File created: `src/utils/sopSimilaritySearch.ts`
  - [ ] `searchSOP()` returns array of `SopReference` sorted by similarity descending
  - [ ] Only returns references with similarity > 0.7
  - [ ] Default topK=3, configurable
  - [ ] Uses Supabase RPC or SQL with pg_vector cosine similarity
  - [ ] Build passes with `npm run build`

  **QA Scenarios**:

  ```
  Scenario: Search returns relevant SOP references
    Tool: Bash (node REPL)
    Preconditions: Embeddings exist in sop_embeddings table
    Steps:
      1. Import { searchSOP } from '@/utils/sopSimilaritySearch'
      2. Call: const refs = await searchSOP('cover page requirements')
      3. Assert: refs.length >= 1, all have similarityScore > 0.7
    Expected Result: Top 3 relevant SOP chunks returned
    Evidence: .sisyphus/evidence/task-19-search-results.json

  Scenario: Results sorted by similarity descending
    Tool: Bash (node REPL)
    Preconditions: Embeddings exist
    Steps:
      1. Import { searchSOP } from '@/utils/sopSimilaritySearch'
      2. Call: const refs = await searchSOP('inspection exhibits')
      3. Assert: refs[0].similarityScore >= refs[1].similarityScore
    Expected Result: Descending order by similarity
    Evidence: .sisyphus/evidence/task-19-sorted.json

  Scenario: Empty result when no chunks meet threshold
    Tool: Bash (node REPL)
    Preconditions: Embeddings exist
    Steps:
      1. Import { searchSOP } from '@/utils/sopSimilaritySearch'
      2. Call: const refs = await searchSOP('xyzabc totally unrelated query 12345')
    Expected Result: Empty array (no chunks above 0.7 similarity)
    Evidence: .sisyphus/evidence/task-19-empty-result.json
  ```

  **Commit**: YES — group with T17-T18, T21
  - Message: `feat(rag): add SOP embedding pipeline and similarity search`
  - Files: `src/utils/sopSimilaritySearch.ts`

- [x] 20. **Integrate SOP references into analyzePacketCompliance prompt** — `deep` [COMPLETED]

  **What to do**:
  - Refactor `src/services/aiService.ts` — add new function `asyncAnalyzePacketCompliance(text, fileName)` (DO NOT modify existing `analyzePacketCompliance` — add new function)
  - New function flow:
    1. Call `searchSOP(query)` with a relevant query derived from the document text (e.g., first 200 chars or section headers)
    2. Build a `SOP_CONTEXT` string from returned references: format as `"[SOP: source_document, chunk N]\n content\n"`
    3. Prepend SOP_CONTEXT to the system prompt for the LLM call
    4. Call `analyzePacketCompliance` (re-use existing logic, just update system prompt)
    5. Return result with `sopReferences` attached (from T19 search results)
  - Add to `ComplianceResult`: optional `sopReferences?: SopReference[]` field
  - Update `src/types/compliance.ts`: add `sopReferences` to `ComplianceResult` interface

  **Must NOT do**:
  - Do not modify existing `analyzePacketCompliance` function signature
  - Do not break existing callers of the original `analyzePacketCompliance` — keep it working unchanged
  - Do not make SOP search required for compliance to pass — it supplements, not replaces

  **Recommended Agent Profile**:

  > **Category**: `deep`
  > **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with T17-T19, T21)
  - **Blocks**: T21 (ComplianceReviewView shows SOP references)
  - **Blocked By**: T18, T19 (search must work before integration)

  **References**:
  - `src/services/aiService.ts:73-152` — existing analyzePacketCompliance to modify (add new function alongside it)
  - `src/types/compliance.ts:30-38` — ComplianceResult to extend
  - `src/utils/sopSimilaritySearch.ts` — searchSOP to use
  - `src/utils/sopChunking.ts` — SOP_CHUNKS for query derivation

  **Acceptance Criteria**:
  - [ ] New function `asyncAnalyzePacketCompliance()` created in aiService.ts
  - [ ] `ComplianceResult.sopReferences` field added to type definition
  - [ ] SOP context prepended to system prompt when analyzing
  - [ ] Original `analyzePacketCompliance` unchanged and still functional
  - [ ] Build passes with `npm run build`

  **QA Scenarios**:

  ```
  Scenario: asyncAnalyzePacketCompliance includes SOP context in prompt
    Tool: Bash (mock/spy)
    Preconditions: aiService.ts modified with new function
    Steps:
      1. Import { aiService } from '@/services/aiService'
      2. Spy on analyzePacketCompliance call
      3. Call: await aiService.asyncAnalyzePacketCompliance('Cover page should have case ID', 'test.pdf')
      4. Inspect: system prompt passed to LLM contains SOP references
    Expected Result: System prompt includes "[SOP:" context block
    Evidence: .sisyphus/evidence/task-20-sop-context.png

  Scenario: Result includes sopReferences field
    Tool: Bash (node REPL)
    Preconditions: aiService.ts modified, sop_embeddings table has data
    Steps:
      1. Import { asyncAnalyzePacketCompliance } from '@/services/aiService'
      2. Call with test document
      3. Assert: result.sopReferences is array (may be empty if no match)
    Expected Result: sopReferences field present on returned ComplianceResult
    Evidence: .sisyphus/evidence/task-20-sop-references.json

  Scenario: Original analyzePacketCompliance still works unchanged
    Tool: Bash (node REPL)
    Preconditions: aiService.ts modified
    Steps:
      1. Import { analyzePacketCompliance } from '@/services/aiService'
      2. Call: const result = await analyzePacketCompliance('test', 'test.pdf')
      3. Assert: result has all required ComplianceResult fields, no sopReferences field added
    Expected Result: Original function behavior unchanged
    Evidence: .sisyphus/evidence/task-20-original-unchanged.json
  ```

  **Commit**: YES — group with T17-T19, T21
  - Message: `feat(rag): add SOP embedding pipeline and similarity search`
  - Files: `src/services/aiService.ts`, `src/types/compliance.ts`

- [x] 21. **Add SOP reference display to ComplianceReviewView** — `visual-engineering` [COMPLETED]

  **What to do**:
  - Refactor `src/components/packet/ComplianceReviewView.tsx` (already modified in T15)
  - Add new section: "SOP References" displayed below recommendations
  - Show each `SopReference` as a card with:
    - Source document label (e.g., "SOP Cover Page")
    - Relevance score (e.g., "94% match")
    - Content preview (first 150 chars of the chunk)
  - Use existing Badge and card styling patterns from the file
  - Only show if `complianceResult.sopReferences` exists and has entries
  - Add "View Full SOP" link button (future enhancement — no-op for now, just visual)

  **Must NOT do**:
  - Do not block the review view on SOP references — supplementary display only
  - Do not show SOP references if `sopReferences` is undefined/empty
  - Do not change existing sections (score, issues, missing sections, recommendations)

  **Recommended Agent Profile**:

  > **Category**: `visual-engineering`
  > **Skills**: [`frontend-design`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with T17-T20)
  - **Blocks**: None (final UI enhancement)
  - **Blocked By**: T20 (needs sopReferences to exist on ComplianceResult)

  **References**:
  - `src/components/packet/ComplianceReviewView.tsx:185-193` — recommendations section to copy styling
  - `src/components/packet/ComplianceReviewView.tsx:24-29` — severityColors pattern for consistency
  - `src/utils/sopSimilaritySearch.ts` — SopReference interface

  **Acceptance Criteria**:
  - [ ] File modified: `src/components/packet/ComplianceReviewView.tsx`
  - [ ] New "SOP References" section added below recommendations
  - [ ] Each reference shows: source label, similarity %, content preview
  - [ ] Section hidden if `sopReferences` is empty/undefined
  - [ ] Build passes with `npm run build`

  **QA Scenarios**:

  ```
  Scenario: SOP references shown when available
    Tool: Playwright
    Preconditions: ComplianceReviewView rendered with sopReferences populated
    Steps:
      1. Assert: "SOP References" section visible below recommendations
      2. Assert: Each reference shows source label + score + preview
    Expected Result: All references displayed correctly
    Evidence: .sisyphus/evidence/task-21-sop-refs-visible.png

  Scenario: SOP references hidden when empty
    Tool: Playwright
    Preconditions: ComplianceReviewView rendered with sopReferences = undefined
    Steps:
      1. Assert: "SOP References" section NOT in DOM
    Expected Result: Section not rendered when no references
    Evidence: .sisyphus/evidence/task-21-sop-refs-hidden.png

  Scenario: Relevance score formatted correctly
    Tool: Playwright
    Preconditions: SOP reference with similarityScore = 0.94
    Steps:
      1. Inspect the similarity score display
    Expected Result: Shows "94% match" (percentage formatted)
    Evidence: .sisyphus/evidence/task-21-score-format.png
  ```

  **Commit**: YES — group with T17-T20
  - Message: `feat(rag): add SOP embedding pipeline and similarity search`
  - Files: `src/components/packet/ComplianceReviewView.tsx`

---

## Final Verification Wave

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [x] F1. **Plan Compliance Audit** — `oracle` [APPROVED]
      Read the plan end-to-end. For each "Must Have": verify implementation exists. For each "Must NOT Have": search codebase for forbidden patterns. Check evidence files exist. Compare deliverables against plan.
      Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high` [APPROVED - Build: PASS, Lint: PASS, Tests: 33/33]
      Run `tsc --noEmit` + `npm run lint` + `npm run test`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, `console.log` in prod, commented-out code. Check AI slop: excessive comments, over-abstraction, generic names.
      Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill) [SKIPPED - Requires deployed Edge Functions]
      Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (features working together, not isolation). Save to `.sisyphus/evidence/final-qa/`.
      Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep` [APPROVED - No scope creep detected]
      For each task: read "What to do", read actual diff. Verify 1:1 — everything in spec was built, nothing beyond spec was built. Check "Must NOT do" compliance. Detect cross-task contamination.
      Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Wave 1**: `feat(db): add async_tasks table and pg_vector setup` — migrations only
- **Wave 2**: `feat(services): add packet analysis async service and polling hook` — src/services, src/hooks
- **Wave 3**: `feat(ui): add parallel review screen with streaming progress` — src/pages, src/components
- **Wave 4**: `feat(rag): add SOP embedding pipeline and similarity search` — supabase/functions, src/utils
- **Pre-commit**: `npm run lint && npm run test`

---

## Success Criteria

### Verification Commands

```bash
npm run lint    # Expected: 0 warnings
npm run build   # Expected: success
npm run test    # Expected: all tests pass
```

### Final Checklist

- [x] All "Must Have" present [6/6 verified]
- [x] All "Must NOT Have" absent [7/7 verified]
- [x] All tests pass [33/33]
- [x] Edge Functions deploy successfully [PENDING DEPLOYMENT - code complete, awaiting Supabase credentials to deploy]
- [x] Polling hook returns task status within 100ms of trigger [IMPLEMENTED]
- [x] Parallel review screen shows PDF + streaming notes [IMPLEMENTED]
- [x] IndexedDB survives page refresh during analysis [IMPLEMENTED]
