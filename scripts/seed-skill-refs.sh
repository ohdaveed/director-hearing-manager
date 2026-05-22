#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Seed skill_references table from upstream source repos.
#
# Usage:
#   bash scripts/seed-skill-refs.sh
#
# Requires: curl, VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY in .env
#
# Fetches reference files from the original skill repos and inserts them
# into the skill_references table via the Supabase REST API.
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# --- Load env ---
if [ -f .env ]; then
  set -a; source .env; set +a
fi

: "${VITE_SUPABASE_URL:?Must set VITE_SUPABASE_URL}"
: "${VITE_SUPABASE_ANON_KEY:?Must set VITE_SUPABASE_ANON_KEY}"

API="${VITE_SUPABASE_URL}/rest/v1/skill_references"
HEADERS=(
  -H "apikey: ${VITE_SUPABASE_ANON_KEY}"
  -H "Authorization: Bearer ${VITE_SUPABASE_ANON_KEY}"
  -H "Content-Type: application/json"
  -H "Prefer: resolution=merge-duplicates"
)

upsert() {
  local skill_name="$1" ref_name="$2" content="$3" source="$4"
  local token_estimate=$(( ${#content} / 4 ))

  payload=$(jq -n \
    --arg sn "$skill_name" \
    --arg rn "$ref_name" \
    --arg ct "$content" \
    --arg src "$source" \
    --argjson te "$token_estimate" \
    '{skill_name: $sn, ref_name: $rn, content: $ct, metadata: {source: $src}, token_estimate: $te}')

  curl -s -X POST "${API}" "${HEADERS[@]}" \
    --data-binary "$payload" > /dev/null
  echo "  ✓ ${skill_name}/${ref_name} (~${token_estimate} tokens)"
}

# ── playwright-cli refs ──────────────────────────────────────────────────
echo "== playwright-cli =="
BASE="https://raw.githubusercontent.com/microsoft/playwright-cli/main/skill/references"

upsert playwright-cli playwright-tests \
  "$(curl -sf "${BASE}/playwright-tests.md" 2>/dev/null || echo "Content not yet fetched — see upstream repo")" \
  "https://github.com/microsoft/playwright-cli"

upsert playwright-cli request-mocking \
  "$(curl -sf "${BASE}/request-mocking.md" 2>/dev/null || echo "Content not yet fetched — see upstream repo")" \
  "https://github.com/microsoft/playwright-cli"

upsert playwright-cli running-code \
  "$(curl -sf "${BASE}/running-code.md" 2>/dev/null || echo "Content not yet fetched — see upstream repo")" \
  "https://github.com/microsoft/playwright-cli"

upsert playwright-cli session-management \
  "$(curl -sf "${BASE}/session-management.md" 2>/dev/null || echo "Content not yet fetched — see upstream repo")" \
  "https://github.com/microsoft/playwright-cli"

upsert playwright-cli spec-driven-testing \
  "$(curl -sf "${BASE}/spec-driven-testing.md" 2>/dev/null || echo "Content not yet fetched — see upstream repo")" \
  "https://github.com/microsoft/playwright-cli"

upsert playwright-cli storage-state \
  "$(curl -sf "${BASE}/storage-state.md" 2>/dev/null || echo "Content not yet fetched — see upstream repo")" \
  "https://github.com/microsoft/playwright-cli"

upsert playwright-cli test-generation \
  "$(curl -sf "${BASE}/test-generation.md" 2>/dev/null || echo "Content not yet fetched — see upstream repo")" \
  "https://github.com/microsoft/playwright-cli"

upsert playwright-cli tracing \
  "$(curl -sf "${BASE}/tracing.md" 2>/dev/null || echo "Content not yet fetched — see upstream repo")" \
  "https://github.com/microsoft/playwright-cli"

upsert playwright-cli video-recording \
  "$(curl -sf "${BASE}/video-recording.md" 2>/dev/null || echo "Content not yet fetched — see upstream repo")" \
  "https://github.com/microsoft/playwright-cli"

upsert playwright-cli element-attributes \
  "$(curl -sf "${BASE}/element-attributes.md" 2>/dev/null || echo "Content not yet fetched — see upstream repo")" \
  "https://github.com/microsoft/playwright-cli"

# ── context7-cli refs ────────────────────────────────────────────────────
echo "== context7-cli =="
BASE="https://raw.githubusercontent.com/upstash/context7/main/skill/references"

upsert context7-cli docs \
  "$(curl -sf "${BASE}/docs.md" 2>/dev/null || echo "Content not yet fetched — see upstream repo")" \
  "https://github.com/upstash/context7"

upsert context7-cli skills \
  "$(curl -sf "${BASE}/skills.md" 2>/dev/null || echo "Content not yet fetched — see upstream repo")" \
  "https://github.com/upstash/context7"

upsert context7-cli setup \
  "$(curl -sf "${BASE}/setup.md" 2>/dev/null || echo "Content not yet fetched — see upstream repo")" \
  "https://github.com/upstash/context7"

# ── supabase-postgres-best-practices refs ────────────────────────────────
echo "== supabase-postgres-best-practices =="
BASE="https://raw.githubusercontent.com/supabase/agent-skills/main/supabase-postgres-best-practices"

upsert supabase-postgres-best-practices query-missing-indexes \
  "$(curl -sf "${BASE}/references/query-missing-indexes.md" 2>/dev/null || echo "Content not yet fetched — see upstream repo")" \
  "https://github.com/supabase/agent-skills"

upsert supabase-postgres-best-practices query-partial-indexes \
  "$(curl -sf "${BASE}/references/query-partial-indexes.md" 2>/dev/null || echo "Content not yet fetched — see upstream repo")" \
  "https://github.com/supabase/agent-skills"

upsert supabase-postgres-best-practices sections \
  "$(curl -sf "${BASE}/references/_sections.md" 2>/dev/null || echo "Content not yet fetched — see upstream repo")" \
  "https://github.com/supabase/agent-skills"

# ── supabase refs ────────────────────────────────────────────────────────
echo "== supabase =="
BASE="https://raw.githubusercontent.com/supabase/agent-skills/main/supabase"

upsert supabase skill-feedback \
  "$(curl -sf "${BASE}/references/skill-feedback.md" 2>/dev/null || echo "Content not yet fetched — see upstream repo")" \
  "https://github.com/supabase/agent-skills"

# ── sequential-thinking refs ─────────────────────────────────────────────
echo "== sequential-thinking =="
BASE="https://raw.githubusercontent.com/iantbutler01/sequential-thinking/main/skill/references"

upsert sequential-thinking advanced \
  "$(curl -sf "${BASE}/advanced.md" 2>/dev/null || echo "Content not yet fetched — see upstream repo")" \
  "https://github.com/iantbutler01/sequential-thinking"

upsert sequential-thinking examples \
  "$(curl -sf "${BASE}/examples.md" 2>/dev/null || echo "Content not yet fetched — see upstream repo")" \
  "https://github.com/iantbutler01/sequential-thinking"

echo ""
echo "Done. Run \`curl -s \"${API}?select=count\" \"${HEADERS[@]}\"\` to verify."
