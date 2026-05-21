# Enforce Context7 Reconciliation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure every task plan (`conductor/**/plan.md`) includes a mandatory research phase for reconciling Context7 best practices with local code by enforcing it via MarkdownLint.

**Architecture:** Install `markdownlint-cli2` and a helper library. Create a custom Node.js-based rule for MarkdownLint that scans specifically targeted files for required keywords. Configure the linter to apply this rule.

**Tech Stack:** Node.js, markdownlint-cli2, markdownlint-rule-helpers

---

### Task 1: Install Dependencies

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Install markdownlint-cli2 and helpers**

Run: `npm install --save-dev markdownlint-cli2 markdownlint-rule-helpers`

- [ ] **Step 2: Verify installation**

Run: `npx markdownlint-cli2 --version`
Expected: Version output (e.g., 0.13.0)

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install markdownlint-cli2 and rule-helpers"
```

### Task 2: Create Custom MarkdownLint Rule

**Files:**

- Create: `scripts/require-context7-reconciliation.cjs`

- [ ] **Step 1: Write the custom rule script**

```javascript
"use strict";

const { addError } = require("markdownlint-rule-helpers");

module.exports = {
  names: ["require-context7-reconciliation"],
  description:
    "Task plans must include a Research phase for Context7 reconciliation",
  tags: ["context7", "planning"],
  function: function (params, onError) {
    const { name } = params;
    // Only apply to conductor/**/plan.md files
    // Note: markdownlint-cli2 passes the full path in params.name
    if (!name.includes("conductor/") || !name.endsWith("/plan.md")) {
      return;
    }

    const content = params.lines.join("\n");
    const hasReconcile = /Research\s*&\s*Reconcile/i.test(content);
    const hasContext7 = /Context7/i.test(content);

    if (!hasReconcile && !hasContext7) {
      addError(
        onError,
        1,
        "Mandatory Context7 reconciliation phase is missing in plan. Expected 'Research & Reconcile' or 'Context7' keywords.",
      );
    }
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add scripts/require-context7-reconciliation.cjs
git commit -m "feat: add custom markdownlint rule for context7 reconciliation"
```

### Task 3: Configure MarkdownLint

**Files:**

- Create: `.markdownlint-cli2.cjs`

- [ ] **Step 1: Create the configuration file**

```javascript
"use strict";

module.exports = {
  customRules: ["./scripts/require-context7-reconciliation.cjs"],
  config: {
    default: true,
    "require-context7-reconciliation": true,
  },
  globs: ["conductor/**/plan.md"],
};
```

- [ ] **Step 2: Commit**

```bash
git add .markdownlint-cli2.cjs
git commit -m "chore: configure markdownlint-cli2 with custom rule"
```

### Task 4: Verify and Fix Plans

**Files:**

- Modify: `conductor/tracks/sop_integration_20260518/plan.md` (and others as needed)

- [ ] **Step 1: Run the linter to find non-compliant plans**

Run: `npx markdownlint-cli2`

- [ ] **Step 2: Add reconciliation phase to non-compliant plans**

Example for `conductor/tracks/sop_integration_20260518/plan.md`:

```markdown
## Phase 1: Research & Reconcile (Context7)

- Reconcile SOP requirements with existing database schema using Context7.
- ...
```

- [ ] **Step 3: Run linter again to verify it passes for updated files**

- [ ] **Step 4: Commit**

```bash
git add conductor/
git commit -m "docs: update plans to include context7 reconciliation"
```
