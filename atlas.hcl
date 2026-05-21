# ──────────────────────────────────────────────────────────────────────────────
# Atlas Configuration — Director Hearing Manager
# ──────────────────────────────────────────────────────────────────────────────
# Source of truth: sql/schema.sql (DDL manifest)
# Migration dir:  migrations/ (managed by `atlas migrate diff`)
# Dev database:   Docker PostgreSQL 17 (via `atlas tool docker` or direct URL)
# ──────────────────────────────────────────────────────────────────────────────

data "external_schema" "director_hearing_manager" {
  # Load the composite schema from the sql/ directory.
  # Each file is loaded via -- atlas:import directives in schema.sql
  url = "file://sql/schema.sql"
}

env "director_hearing_manager" {
  # The name of the project (used in Atlas Cloud, migration dir naming)
  name = "director-hearing-manager"

  # Where the desired schema definition lives
  src = data.external_schema.director_hearing_manager.url

  # Migration directory — Atlas generates numbered migration files here
  migration {
    dir = "file://migrations"
    format = atlas
  }

  # Revision table tracks applied migrations in the database
  migration_revision {
    table = "_atlas_migration_revisions"
  }

  # Dev database: used to compute diffs and validate migrations.
  # Set ATLAS_DEV_URL in your environment, e.g.:
  #   export ATLAS_DEV_URL="docker://postgres/17/dev?search_path=public"
  # Or use the Supabase shadow database:
  #   export ATLAS_DEV_URL="postgres://postgres:password@localhost:54322/dev"
  url {
    from = "env"
    name = "ATLAS_DEV_URL"
  }

  # Target database URL (the actual Supabase database).
  # Set ATLAS_DATABASE_URL in your environment:
  #   export ATLAS_DATABASE_URL="postgres://postgres:password@db.xxxxx.supabase.co:5432/postgres"
  database {
    from = "env"
    name = "ATLAS_DATABASE_URL"
  }
}

# ── Migration Linting Rules ──
lint {
  # Prevent destructive changes (DROP COLUMN, DROP TABLE) by default
  destructive {
    error = true
  }

  # Warn about changes that could cause downtime
  concurrent_index {
    error = false
    warn  = true
  }
}
