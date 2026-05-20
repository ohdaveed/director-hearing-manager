# Claude-Mem Observation Recording

claude-mem stores persistent observations across sessions. Use `observation_add` to record important decisions, patterns, and gotchas so future AI sessions are aware.

## When to Record

Record an observation when:

- A design decision is made (with rationale)
- A pattern is established or changed
- A gotcha/workaround is discovered
- An architecture constraint is newly enforced
- A dependency is added or removed (with reason)
- A migration is applied (what and why)

## What to Record

Use this structure:

```json
{
  "content": "{decision/pattern}: {what was decided/found}",
  "kind": "decision|bugfix|feature|refactor|discovery|change",
  "metadata": {
    "rationale": "why this was chosen",
    "alternatives": "what was considered",
    "affected_files": "paths of affected files"
  }
}
```

## Observation Kinds

- `decision` — Architecture or design decisions
- `bugfix` — Root cause and fix for bugs
- `feature` — New feature additions
- `refactor` — Code restructuring
- `discovery` — Gotchas, workarounds, insights
- `change` — Dependency updates, config changes
