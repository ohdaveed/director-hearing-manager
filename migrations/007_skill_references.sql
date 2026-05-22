-- =============================================================================
-- Migration 007: Skill References Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS skill_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name TEXT NOT NULL,
  ref_name TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  token_estimate INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(skill_name, ref_name)
);

COMMENT ON TABLE skill_references IS 'Optional deep-dive reference files for AI agent skills, stored in DB to avoid token waste from eager local file loading';
COMMENT ON COLUMN skill_references.skill_name IS 'Name of the skill (e.g. playwright-cli, supabase-postgres-best-practices)';
COMMENT ON COLUMN skill_references.ref_name IS 'Short reference name (e.g. tracing, index-types)';
COMMENT ON COLUMN skill_references.content IS 'Full markdown content of the reference file';
COMMENT ON COLUMN skill_references.metadata IS 'Source URL, version, hash, etc.';
COMMENT ON COLUMN skill_references.token_estimate IS 'Pre-computed approximate token count (~4 chars/token)';

CREATE INDEX IF NOT EXISTS idx_skill_references_skill_name ON skill_references(skill_name);
CREATE INDEX IF NOT EXISTS idx_skill_references_lookup ON skill_references(skill_name, ref_name);
