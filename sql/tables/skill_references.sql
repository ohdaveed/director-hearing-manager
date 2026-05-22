-- Skill reference files stored in Supabase instead of local disk.
-- Each skill's SKILL.md can instruct agents to query these on demand.
-- This eliminates ~33k tokens of baseline reference file overhead.

CREATE TABLE skill_references (
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
