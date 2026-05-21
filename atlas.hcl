# ──────────────────────────────────────────────────────────────────────────────
# Atlas Configuration — Director Hearing Manager
# ──────────────────────────────────────────────────────────────────────────────
# Source of truth: sql/schema.sql (DDL manifest with -- atlas:import directives)
# Migration dir:  migrations/ (managed by `atlas migrate diff`)
# Dev database:   Docker PostgreSQL 17 or local Postgres (pass via --dev-url flag)
# ──────────────────────────────────────────────────────────────────────────────

env "director_hearing_manager" {
  name = "director-hearing-manager"
  src  = "file://sql/schema.sql"

  migration {
    dir    = "file://migrations"
    format = atlas
  }
}

# ── Migration Linting Rules ──
lint {
  destructive {
    error = true
  }
  # concurrent_index is not supported in this Atlas version — enabled by default
}
