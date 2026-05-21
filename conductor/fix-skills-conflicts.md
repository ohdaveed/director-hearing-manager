# Implementation Plan: Fix Skills Conflicts

## 1. Objective

Unify the dual-layer skill system, synchronize the skill lockfile, and resolve overlapping tool instructions to eliminate all "skills conflicts".

## 2. Key Files & Context

- `.agents/skills/` (Source of truth)
- `.claude/skills/` (Mirror destination)
- `skills-lock.json`
- `package.json`
- `scripts/sync_skills.cjs`
- `.claude/settings.local.json`

## 3. Background & Motivation

The project uses a Dual-Layer Gemini/Claude Agent Skill System. Over time, the `.agents/skills` and `.claude/skills` directories have drifted, causing duplication and divergence (e.g., `plankton-code-quality` exists in `.agents` but not `.claude` or `skills-lock.json`). Additionally, there are conflicting instructions within the skills themselves (such as Plankton's formatting hooks conflicting with ECC's Prettier hooks), and potential lingering Git conflicts in the lockfiles or markdown files.

## 4. Scope & Impact

This plan impacts the AI agent environment and tooling configuration. It has zero impact on application source code or production bundles.

## 5. Proposed Solution

We will adopt the **Sync Script & Separation** approach:

1. **Directory Duplication**: Treat `.agents/skills` as the authoritative source of truth. Mirror its contents to `.claude/skills` via an automated sync script.
2. **Registry Sync**: Update `skills-lock.json` so all active skills (including `plankton-code-quality` and `impeccable`) are correctly registered.
3. **Instruction Overlaps**: Disable conflicting ECC Prettier hooks in `.claude/settings.local.json` to respect Plankton's Biome formatting enforcement, per the documented `plankton-code-quality` SKILL.md.
4. **Git Conflicts**: Audit the skills directories and lockfile for standard Git conflict markers (`<<<<<<<`) and resolve them.

## 6. Alternatives Considered

- **Symlinking `.claude/skills` to `.agents/skills`**: Rejected by user preference to avoid potential cross-platform compatibility issues and to accommodate strict toolchains that require discrete files.

## 7. Implementation Plan

**Phase 1: Synchronization Script**

- Create `scripts/sync_skills.cjs` utilizing Node's `fs.cpSync` or a similar recursive copy to mirror `.agents/skills` into `.claude/skills`.
- Ensure the script first clears `.claude/skills` to remove orphaned files.

**Phase 2: Toolchain Integration**

- Add a `"sync:skills"` entry to the `scripts` block in `package.json` pointing to `node scripts/sync_skills.cjs`.
- Alias it so `vp sync-skills` maps to this script.
- Optionally add it to `postinstall` to guarantee alignment on fresh clones.

**Phase 3: Registry Synchronization**

- Update `skills-lock.json` to properly map `plankton-code-quality` and `impeccable`.

**Phase 4: Resolve Instruction Overlaps**

- Update `.claude/settings.local.json` to explicitly disable `ECC` Prettier hooks so `plankton-code-quality` Biome hooks take precedence. Remove orphaned overrides if they no longer apply.

**Phase 5: Git Conflict Resolution**

- Run a final Git audit to ensure no `.orig` files, unmerged paths, or standard merge conflict markers exist in any skill or lockfile.

## 8. Verification

- Execute `npm run sync:skills`.
- List `.claude/skills` to confirm it matches `.agents/skills` perfectly.
- Validate `skills-lock.json` structure using a JSON linter.

## 9. Migration & Rollback

If the sync script introduces issues with Claude Code's internal tracking, we will revert the `package.json` additions, restore `.claude/skills` from Git history, and re-evaluate the sync behavior.
