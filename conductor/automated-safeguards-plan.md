# Automated Safeguards Implementation Plan (Standard Tooling)

**Objective:** Implement automated quality gates and Context7 reconciliation enforcement using industry-standard tools (ESLint, MarkdownLint, Husky) instead of custom one-off scripts.

**Key Files & Context:**

- `ctx7-manifest.json` (New): Root manifest for pinning Context7 knowledge.
- `package.json`: Add new devDependencies (`eslint-plugin-boundaries`, `markdownlint-cli2`).
- `.eslintrc.cjs` / `eslint.config.js`: Configure architecture boundaries.
- `.markdownlint-cli2.cjs` / `.markdownlint.cjs` (New): Custom rule configuration for plans.
- `.husky/pre-commit`: Enforce checks before commit.
- `conductor/code-reviewer-prompt.md` (New): Prompt for the "Contrarian Reviewer" subagent.

**Implementation Steps:**

### Task 1: Knowledge Pinning (`ctx7-manifest.json`)

- Create `ctx7-manifest.json` in the root directory.
- Map project-specific dependencies (`react-hook-form`, `@supabase/supabase-js`, `@tanstack/react-query`, `shadcn`, `@react-pdf/renderer`) to their exact Context7 IDs.
- Include explicit `reconciliationNotes` for each library outlining local constraints.

### Task 2: Architectural Duplicate Prevention (ESLint Boundaries)

- Install `eslint-plugin-boundaries` as a dev dependency.
- Configure ESLint rules to define architectural boundaries:
  - Define `components` (`src/components/`) and `ui` (`src/components/ui/`) as distinct types.
  - Implement a rule preventing components from defining files with names that clash with known UI primitives, or restrict imports such that generic UI components must come from `src/components/ui/`.
  - Alternatively, use `no-restricted-imports` to strictly police where UI elements are sourced from.

### Task 3: Enforcing Context7 Reconciliation (MarkdownLint)

- Install `markdownlint-cli2` and `markdownlint-rule-helpers` as dev dependencies.
- Create a custom MarkdownLint rule (e.g., `rules/require-context7-reconciliation.cjs`) that:
  - Only applies to files matching `conductor/**/plan.md`.
  - Scans the document for the "Research & Reconcile" or "Context7" keywords.
  - Returns an error if the mandatory reconciliation phase is missing.
- Add `.markdownlint-cli2.cjs` to configure the linter to use this custom rule on plan files.

### Task 4: Git Hook Enforcement (Husky)

- Configure Husky (`npx husky install`) if not already fully active for these checks.
- Add/update the `.husky/pre-commit` hook to run:
  - `vp lint` (which now includes the ESLint boundary checks).
  - `npx markdownlint-cli2 "conductor/**/plan.md"` (to enforce the planning guard before committing plan updates).

### Task 5: The "Contrarian Reviewer" Mandate

- Create `conductor/code-reviewer-prompt.md` defining the "Devil's Advocate" reviewer role.
- Instructions: "Instead of checking if the code works, find exactly three ways this implementation diverges from the patterns in `AGENTS.md` or introduces a pattern that wasn't reconciled in the plan."
- Update `AGENTS.md` to mandate this prompt when invoking review subagents.

**Verification & Testing:**

1. Create a dummy component in `src/components/` that duplicates a Shadcn primitive and verify `vp lint` catches it via ESLint.
2. Edit a `plan.md` file, remove the Context7 reconciliation section, and attempt a `git commit` to verify the Husky pre-commit hook blocks it via MarkdownLint.
