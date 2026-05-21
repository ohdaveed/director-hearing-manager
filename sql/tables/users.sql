-- atlas:import ../types/enum_users_role.sql
-- atlas:import ../types/enum_users_signature_style.sql

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  role users_role_enum,
  last_login TIMESTAMPTZ,
  signature_text TEXT,
  signature_style users_signature_style_enum,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);
