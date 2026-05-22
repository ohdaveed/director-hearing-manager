#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# memento.sh — claude-mem session-end observation capture
#
# Usage:
#   bash scripts/memento.sh              # interactive (prompts for decision)
#   bash scripts/memento.sh flush        # flush buffer + git log
#   bash scripts/memento.sh context      # load recent observations for session start
#
# This script produces structured JSON for `observation_add`.
# Call it at session end, then submit the output via the observation_add tool.
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
BUFFER="${PROJECT_ROOT}/.sisyphus/progress/.memento-buffer.json"

if [ -z "$PROJECT_ROOT" ]; then
  echo "Not in a git repo." >&2
  exit 1
fi

cd "$PROJECT_ROOT"

flush_buffer() {
  if [ ! -f "$BUFFER" ]; then
    echo "No buffer to flush."
    return
  fi

  echo "=== Changed files this session ==="
  jq -r '.[] | "\(.ts): \(.files)"' "$BUFFER" 2>/dev/null
  echo ""

  # Summarize
  all_files=$(jq -r '.[].files' "$BUFFER" 2>/dev/null | tr ',' '\n' | sort -u | grep -v '^$')
  echo "=== Unique files touched ==="
  echo "$all_files"
  echo ""

  # Compile git log for this session
  echo "=== Recent commits (last 10) ==="
  git log --oneline -10 2>/dev/null || true
  echo ""

  # Clean up
  rm -f "$BUFFER"
}

load_context() {
  echo "=== Recent claude-mem observations ==="
  echo "(Loaded via observation_context tool — call manually at session start)"

  # Show recent git activity as a fallback
  days="${1:-7}"
  echo ""
  echo "=== Git activity (last ${days}d) ==="
  git log --oneline --since="${days} days ago" --until=now 2>/dev/null | head -30 || true
  echo ""

  echo "=== Uncommitted changes ==="
  git status --short 2>/dev/null || true
}

gen_summary() {
  local title="$1"
  local kind="$2"
  local rationale="$3"
  local alternatives="${4:-}"

  changed_files=$(git diff --name-only HEAD 2>/dev/null | tr '\n' ',' | sed 's/,$//')
  commit_log=$(git log --oneline -5 2>/dev/null)

  cat <<JSON
{
  "content": "${title}",
  "kind": "${kind}",
  "metadata": {
    "rationale": "${rationale}",
    "alternatives": "${alternatives}",
    "affected_files": "${changed_files}",
    "commits": $(echo "$commit_log" | jq -Rs '.')
  }
}
JSON
}

case "${1:-}" in
  flush)
    flush_buffer
    echo ""
    echo "Copy the above ^^ and submit via \`observation_add\` with kind and content."
    ;;
  context)
    load_context "${2:-7}"
    ;;
  summary)
    shift
    gen_summary "$@"
    ;;
  *)
    cat <<HELP
Usage:
  bash scripts/memento.sh context [days]   — Load context at session START
  bash scripts/memento.sh flush            — Flush hook buffer at session END
  bash scripts/memento.sh summary ...      — Generate a structured observation JSON

Then call \`observation_add\` with the output to persist to claude-mem.

Examples:
  at session start:  bash scripts/memento.sh context
  at session end:    bash scripts/memento.sh flush
  manual capture:    bash scripts/memento.sh summary \\
    "Added skill_references table and service" \\
    "feature" \\
    "Need DB-backed skill reference storage to avoid loading 33k tokens on every session" \\
    "local files, env vars"

HELP
    ;;
esac
