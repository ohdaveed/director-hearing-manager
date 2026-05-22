# Design Spec: Syncing AI Configuration for Director Hearing Manager

**Status**: Draft
**Date**: 2026-05-21
**Topic**: Syncing `ctx7-manifest.json` with current tech stack (Logic & Reliability Core)

## 1. Overview

Update the project's AI metadata configurations to ensure that autonomous agents have accurate context regarding the core logic and reliability libraries used in the Director Hearing Manager codebase. This minimizes hallucinations and ensures alignment with existing architectural standards (Zod-driven boundaries, Anthropic-based AI services, and Vitest-driven quality gates).

## 2. Goals

- Sync `ctx7-manifest.json` with the current library versions found in `package.json`.
- Provide "reconciliation notes" that summarize the mandatory usage patterns for core libraries as defined in `AGENTS.md`.
- Enable AI agents to write idiomatic code for Zod schemas, Anthropic service calls, and Vitest test cases.

## 3. Implementation Details

### 3.1 `ctx7-manifest.json` Updates

The `dependencies` section will be expanded to include:

| Library           | libraryId                 | Version (from package.json) | Reconciliation Notes                                                                                                                       |
| :---------------- | :------------------------ | :-------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------- |
| **Zod**           | `/colinhacks/zod`         | `^3.25.76`                  | Use for all schema validation and type inference. Boundary validation is mandatory for API responses and form inputs.                      |
| **Anthropic SDK** | `/anthropic/sdk`          | `^0.20.9`                   | Primary LLM provider for AI services. Implementations reside in `src/services/aiService.ts` for PDF parsing and violation extraction.      |
| **Vitest**        | `/vitest-dev/vitest`      | `^4.1.6`                    | Project uses 'vp test' (Vite-plus wrapper). All new code must include tests in `*.test.ts` files with >80% coverage.                       |
| **React Router**  | `/remix-run/react-router` | `^6.30.3`                   | Version 6.x. Navigation logic and role-based guards are centralized in `App.tsx`. Use the `useNavigate` hook for programmatic transitions. |

### 3.2 Verification Plan

- **File Integrity**: Ensure the JSON structure of `ctx7-manifest.json` remains valid.
- **Consistency**: Verify that versions match `package.json` exactly.
- **Documentation Alignment**: Verify that reconciliation notes reflect the constraints in `AGENTS.md`.

## 4. Future Considerations

- Expanding the manifest to include UI-specific libraries (Tailwind 4, Framer Motion) once the core logic synchronization is verified.
- Adding PostgreSQL MCP tool configurations to `opencode.json` in a subsequent phase.
