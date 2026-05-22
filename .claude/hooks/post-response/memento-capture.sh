#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Post-response claude-mem hook — captures changed files and decision context
# after each assistant response, writing to a buffer file.
#
# Claude Code passes the response JSON on stdin with this schema:
#   { "role": "assistant", "content": "...", "toolUses": [...] }
#
# This hook:
#   1. Captures git status (what files changed during this turn)
#   2. Appends a structured log entry to .sisyphus/progress/.memento-buffer.json
#
# At session end, the agent runs `scripts/memento.sh` to flush the buffer
# into claude-mem observations.
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

BUFFER_FILE="$(git rev-parse --show-toplevel 2>/dev/null)/.sisyphus/progress/.memento-buffer.json"
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"

# Only run inside a git repo (this project)
if [ -z "$PROJECT_ROOT" ]; then
  exit 0
fi

# Collect what changed in this turn
changed_files=""
if git diff --name-only 2>/dev/null | head -20 | tr '\n' ',' > /dev/null; then
  changed_files=$(git diff --name-only 2>/dev/null | head -20 | tr '\n' ',' | sed 's/,$//')
fi
if [ -z "$changed_files" ]; then
  exit 0  # no changes, nothing to capture
fi

# Build a timestamped entry
now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

entry=$(cat <<EOF
{
  "ts": "${now}",
  "files": "${changed_files}"
}
EOF
)

# Append to buffer
mkdir -p "$(dirname "$BUFFER_FILE")"
if [ -f "$BUFFER_FILE" ]; then
  # Insert into the JSON array
  tmp=$(mktemp)
  jq --argjson entry "$entry" '. += [$entry]' "$BUFFER_FILE" > "$tmp" && mv "$tmp" "$BUFFER_FILE"
else
  echo "[${entry}]" > "$BUFFER_FILE"
fi

exit 0
