# Claude-Mem Observation System

claude-mem stores persistent observations across sessions. This file describes
how the automated hook infrastructure works and how AI agents should use it.

## How It Works

```
┌─────────────┐    ┌──────────────────────┐    ┌──────────────────┐
│  PostToolUse │───▶│ .memento-buffer.json │───▶│ observation_add  │
│  (shell hook)│    │ (per-turn log)       │    │ (agent calls)    │
└─────────────┘    └──────────────────────┘    └──────────────────┘
       ▲                                               │
       │                                               ▼
  Claude Code only                           claude-mem storage
  (writes file changes)                      (available next session)
```

Two capture paths:

### Path A — Claude Code hooks (automatic, passive)

When running in Claude Code, `.claude/hooks/post-response/memento-capture.sh`
logs changed files after every response into `.sisyphus/progress/.memento-buffer.json`.
At session end, the agent flushes this buffer via `scripts/memento.sh flush` and
submits an `observation_add` call.

### Path B — OpenCode / manual (agent-initiated, active)

When running in OpenCode (no native hooks), the agent calls `scripts/memento.sh`
directly at session boundaries.

## Mandatory Agent Workflow

### Session START (BOTH environments)

```
1. Load recent context:
   observation_context(query="Current project state", limit=5)
   bash scripts/memento.sh context 7

2. Ingest findings into session awareness.
```

### Session END (BOTH environments)

```
1. Capture what changed:
   bash scripts/memento.sh flush
       ↓
   (reads hook buffer + git diff + recent commits)
       ↓
   Submit via observation_add:
     observation_add(
       content="{short summary of what was done}",
       kind="feature|bugfix|refactor|decision|change|discovery",
       metadata={
         rationale: "why",
         alternatives: "what else was considered",
         affected_files: "paths"
       }
     )

2. If no buffer (OpenCode), use manual summary:
   bash scripts/memento.sh summary \
     "Title of what was done" \
     "feature" \
     "Rationale for why" \
     "Alternatives considered"
       ↓
   Submit the output via observation_add.
```

## When to Record (besides session end)

Beyond session boundaries, record observations when:

| Trigger | Kind | Example |
|---------|------|---------|
| Architecture decision made | `decision` | "Chose Atlas over raw SQL migrations" |
| Bug root cause found | `bugfix` | "N+1 query in packet list caused by missing join hint" |
| New feature shipped | `feature` | "Added skill_references table and service" |
| Pattern established | `change` | "Moved all references from disk to Supabase" |
| Gotcha discovered | `discovery` | "Atlas dev-url must match production schema" |

## Observation Structure

```json
{
  "content": "Brief descriptive title",
  "kind": "decision|bugfix|feature|refactor|discovery|change",
  "metadata": {
    "rationale": "Why this was done",
    "alternatives": "What was considered but rejected",
    "affected_files": "Comma-separated file paths"
  }
}
```

## Observation Kinds

- `decision` — Architecture or design decisions with rationale
- `bugfix` — Root cause and fix for bugs
- `feature` — New feature additions
- `refactor` — Code restructuring
- `discovery` — Gotchas, workarounds, insights
- `change` — Dependency updates, config changes
