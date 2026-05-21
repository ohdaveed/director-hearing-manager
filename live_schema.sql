-- Add new schema named "auth"
CREATE SCHEMA "auth";
-- Add new schema named "extensions"
CREATE SCHEMA "extensions";
-- Add new schema named "graphql"
CREATE SCHEMA "graphql";
-- Add new schema named "graphql_public"
CREATE SCHEMA "graphql_public";
-- Add new schema named "pgbouncer"
CREATE SCHEMA "pgbouncer";
-- Add new schema named "pgmq"
CREATE SCHEMA "pgmq";
-- Add new schema named "pgmq_public"
CREATE SCHEMA "pgmq_public";
-- Add new schema named "private"
CREATE SCHEMA "private";
-- Add new schema named "public"
CREATE SCHEMA IF NOT EXISTS "public";
-- Set comment to schema: "public"
COMMENT ON SCHEMA "public" IS 'standard public schema';
-- Add new schema named "realtime"
CREATE SCHEMA "realtime";
-- Add new schema named "storage"
CREATE SCHEMA "storage";
-- Add new schema named "supabase_functions"
CREATE SCHEMA "supabase_functions";
-- Add new schema named "supabase_migrations"
CREATE SCHEMA "supabase_migrations";
-- Add new schema named "vault"
CREATE SCHEMA "vault";
-- Create enum type "factor_type"
CREATE TYPE "auth"."factor_type" AS ENUM ('totp', 'webauthn', 'phone');
-- Create enum type "factor_status"
CREATE TYPE "auth"."factor_status" AS ENUM ('unverified', 'verified');
-- Create enum type "aal_level"
CREATE TYPE "auth"."aal_level" AS ENUM ('aal1', 'aal2', 'aal3');
-- Create enum type "code_challenge_method"
CREATE TYPE "auth"."code_challenge_method" AS ENUM ('s256', 'plain');
-- Create enum type "one_time_token_type"
CREATE TYPE "auth"."one_time_token_type" AS ENUM ('confirmation_token', 'reauthentication_token', 'recovery_token', 'email_change_token_new', 'email_change_token_current', 'phone_change_token');
-- Create enum type "oauth_registration_type"
CREATE TYPE "auth"."oauth_registration_type" AS ENUM ('dynamic', 'manual');
-- Create enum type "oauth_authorization_status"
CREATE TYPE "auth"."oauth_authorization_status" AS ENUM ('pending', 'approved', 'denied', 'expired');
-- Create enum type "oauth_response_type"
CREATE TYPE "auth"."oauth_response_type" AS ENUM ('code');
-- Create enum type "oauth_client_type"
CREATE TYPE "auth"."oauth_client_type" AS ENUM ('public', 'confidential');
-- Create "audit_log_entries" table
CREATE TABLE "auth"."audit_log_entries" (
  "instance_id" uuid NULL,
  "id" uuid NOT NULL,
  "payload" json NULL,
  "created_at" timestamptz NULL,
  "ip_address" character varying(64) NOT NULL DEFAULT '',
  PRIMARY KEY ("id")
);
-- Create index "audit_logs_instance_id_idx" to table: "audit_log_entries"
CREATE INDEX "audit_logs_instance_id_idx" ON "auth"."audit_log_entries" ("instance_id");
-- Set comment to table: "audit_log_entries"
COMMENT ON TABLE "auth"."audit_log_entries" IS 'Auth: Audit trail for user actions.';
-- Create "custom_oauth_providers" table
CREATE TABLE "auth"."custom_oauth_providers" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "provider_type" text NOT NULL,
  "identifier" text NOT NULL,
  "name" text NOT NULL,
  "client_id" text NOT NULL,
  "client_secret" text NOT NULL,
  "acceptable_client_ids" text[] NOT NULL DEFAULT '{}',
  "scopes" text[] NOT NULL DEFAULT '{}',
  "pkce_enabled" boolean NOT NULL DEFAULT true,
  "attribute_mapping" jsonb NOT NULL DEFAULT '{}',
  "authorization_params" jsonb NOT NULL DEFAULT '{}',
  "enabled" boolean NOT NULL DEFAULT true,
  "email_optional" boolean NOT NULL DEFAULT false,
  "issuer" text NULL,
  "discovery_url" text NULL,
  "skip_nonce_check" boolean NOT NULL DEFAULT false,
  "cached_discovery" jsonb NULL,
  "discovery_cached_at" timestamptz NULL,
  "authorization_url" text NULL,
  "token_url" text NULL,
  "userinfo_url" text NULL,
  "jwks_uri" text NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "custom_oauth_providers_identifier_key" UNIQUE ("identifier"),
  CONSTRAINT "custom_oauth_providers_authorization_url_https" CHECK ((authorization_url IS NULL) OR (authorization_url ~~ 'https://%'::text)),
  CONSTRAINT "custom_oauth_providers_authorization_url_length" CHECK ((authorization_url IS NULL) OR (char_length(authorization_url) <= 2048)),
  CONSTRAINT "custom_oauth_providers_client_id_length" CHECK ((char_length(client_id) >= 1) AND (char_length(client_id) <= 512)),
  CONSTRAINT "custom_oauth_providers_discovery_url_length" CHECK ((discovery_url IS NULL) OR (char_length(discovery_url) <= 2048)),
  CONSTRAINT "custom_oauth_providers_identifier_format" CHECK (identifier ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::text),
  CONSTRAINT "custom_oauth_providers_issuer_length" CHECK ((issuer IS NULL) OR ((char_length(issuer) >= 1) AND (char_length(issuer) <= 2048))),
  CONSTRAINT "custom_oauth_providers_jwks_uri_https" CHECK ((jwks_uri IS NULL) OR (jwks_uri ~~ 'https://%'::text)),
  CONSTRAINT "custom_oauth_providers_jwks_uri_length" CHECK ((jwks_uri IS NULL) OR (char_length(jwks_uri) <= 2048)),
  CONSTRAINT "custom_oauth_providers_name_length" CHECK ((char_length(name) >= 1) AND (char_length(name) <= 100)),
  CONSTRAINT "custom_oauth_providers_oauth2_requires_endpoints" CHECK ((provider_type <> 'oauth2'::text) OR ((authorization_url IS NOT NULL) AND (token_url IS NOT NULL) AND (userinfo_url IS NOT NULL))),
  CONSTRAINT "custom_oauth_providers_oidc_discovery_url_https" CHECK ((provider_type <> 'oidc'::text) OR (discovery_url IS NULL) OR (discovery_url ~~ 'https://%'::text)),
  CONSTRAINT "custom_oauth_providers_oidc_issuer_https" CHECK ((provider_type <> 'oidc'::text) OR (issuer IS NULL) OR (issuer ~~ 'https://%'::text)),
  CONSTRAINT "custom_oauth_providers_oidc_requires_issuer" CHECK ((provider_type <> 'oidc'::text) OR (issuer IS NOT NULL)),
  CONSTRAINT "custom_oauth_providers_provider_type_check" CHECK (provider_type = ANY (ARRAY['oauth2'::text, 'oidc'::text])),
  CONSTRAINT "custom_oauth_providers_token_url_https" CHECK ((token_url IS NULL) OR (token_url ~~ 'https://%'::text)),
  CONSTRAINT "custom_oauth_providers_token_url_length" CHECK ((token_url IS NULL) OR (char_length(token_url) <= 2048)),
  CONSTRAINT "custom_oauth_providers_userinfo_url_https" CHECK ((userinfo_url IS NULL) OR (userinfo_url ~~ 'https://%'::text)),
  CONSTRAINT "custom_oauth_providers_userinfo_url_length" CHECK ((userinfo_url IS NULL) OR (char_length(userinfo_url) <= 2048))
);
-- Create index "custom_oauth_providers_created_at_idx" to table: "custom_oauth_providers"
CREATE INDEX "custom_oauth_providers_created_at_idx" ON "auth"."custom_oauth_providers" ("created_at");
-- Create index "custom_oauth_providers_enabled_idx" to table: "custom_oauth_providers"
CREATE INDEX "custom_oauth_providers_enabled_idx" ON "auth"."custom_oauth_providers" ("enabled");
-- Create index "custom_oauth_providers_identifier_idx" to table: "custom_oauth_providers"
CREATE INDEX "custom_oauth_providers_identifier_idx" ON "auth"."custom_oauth_providers" ("identifier");
-- Create index "custom_oauth_providers_provider_type_idx" to table: "custom_oauth_providers"
CREATE INDEX "custom_oauth_providers_provider_type_idx" ON "auth"."custom_oauth_providers" ("provider_type");
-- Create "instances" table
CREATE TABLE "auth"."instances" (
  "id" uuid NOT NULL,
  "uuid" uuid NULL,
  "raw_base_config" text NULL,
  "created_at" timestamptz NULL,
  "updated_at" timestamptz NULL,
  PRIMARY KEY ("id")
);
-- Set comment to table: "instances"
COMMENT ON TABLE "auth"."instances" IS 'Auth: Manages users across multiple sites.';
-- Create "oauth_client_states" table
CREATE TABLE "auth"."oauth_client_states" (
  "id" uuid NOT NULL,
  "provider_type" text NOT NULL,
  "code_verifier" text NULL,
  "created_at" timestamptz NOT NULL,
  PRIMARY KEY ("id")
);
-- Create index "idx_oauth_client_states_created_at" to table: "oauth_client_states"
CREATE INDEX "idx_oauth_client_states_created_at" ON "auth"."oauth_client_states" ("created_at");
-- Set comment to table: "oauth_client_states"
COMMENT ON TABLE "auth"."oauth_client_states" IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';
-- Create "schema_migrations" table
CREATE TABLE "auth"."schema_migrations" (
  "version" character varying(255) NOT NULL,
  PRIMARY KEY ("version")
);
-- Set comment to table: "schema_migrations"
COMMENT ON TABLE "auth"."schema_migrations" IS 'Auth: Manages updates to the auth system.';
-- Create enum type "inspection_photos_photo_type_enum"
CREATE TYPE "public"."inspection_photos_photo_type_enum" AS ENUM ('Violation', 'Abatement', 'Memo of Visit', 'General');
-- Create enum type "complaints_status_enum"
CREATE TYPE "public"."complaints_status_enum" AS ENUM ('New', 'Contact Pending', 'Inspection Scheduled', 'NOV Issued', 'Re-Inspection Due', 'Non-Compliant', 'Escalated', 'Monitoring', 'Closed — Compliant', 'Closed — No Violation', 'Closed — Unfounded', 'Open', 'Withdrawn', 'Referred to Outside Agency');
-- Create enum type "complaints_hearing_status_enum"
CREATE TYPE "public"."complaints_hearing_status_enum" AS ENUM ('None', 'Referral Pending', 'Referred', 'Hearing Scheduled', 'Heard', 'Decision Issued');
-- Create enum type "complaints_method_received_enum"
CREATE TYPE "public"."complaints_method_received_enum" AS ENUM ('Email', 'Phone', 'In-Person', '311', 'Walk-In', 'Letter');
-- Create enum type "complaints_assigned_program_enum"
CREATE TYPE "public"."complaints_assigned_program_enum" AS ENUM ('Healthy Housing and Vector Control', 'Environmental Health', 'Vector Control');
-- Create enum type "locations_facility_type_enum"
CREATE TYPE "public"."locations_facility_type_enum" AS ENUM ('Tourist Hotel', 'Residential Hotel', 'Apartments', 'Residential Property', 'Vacant Lot', 'City Owned Property', 'Other');
-- Create enum type "inspections_inspection_type_enum"
CREATE TYPE "public"."inspections_inspection_type_enum" AS ENUM ('Routine', 'Routine Re-inspection', 'Complaint', 'Complaint Re-inspection', 'Citation to Hearing Issued', 'Field Consultation / Survey', 'Imported');
-- Create enum type "inspections_inspection_rating_enum"
CREATE TYPE "public"."inspections_inspection_rating_enum" AS ENUM ('Satisfactory', 'Unsatisfactory');
-- Create enum type "inspections_access_granted_by_enum"
CREATE TYPE "public"."inspections_access_granted_by_enum" AS ENUM ('Tenant', 'Owner', 'Property Manager', 'Could Not Access', 'Memo of Visit Left on Site', 'Observed from Adjacent Lot', 'Observed from Public Right of Way');
-- Create enum type "inspections_status_enum"
CREATE TYPE "public"."inspections_status_enum" AS ENUM ('Draft', 'Submitted');
-- Create enum type "violations_responsible_party_enum"
CREATE TYPE "public"."violations_responsible_party_enum" AS ENUM ('Owner', 'Tenant');
-- Create enum type "violations_status_enum"
CREATE TYPE "public"."violations_status_enum" AS ENUM ('Violation', 'Abated', 'Corrected on Site');
-- Create enum type "chronology_entry_type_enum"
CREATE TYPE "public"."chronology_entry_type_enum" AS ENUM ('Inspection', 'NOV', 'Re-inspection', 'Contact Attempt', 'Hearing Referral', 'Other');
-- Create enum type "chronology_visibility_enum"
CREATE TYPE "public"."chronology_visibility_enum" AS ENUM ('Public', 'Internal');
-- Create enum type "chronology_citation_code_enum"
CREATE TYPE "public"."chronology_citation_code_enum" AS ENUM ('§ 581(b)(1) — Garbage / Refuse / Waste', '§ 581(b)(2) — Overgrown Vegetation', '§ 581(b)(3) — Accumulation of Paper Materials', '§ 581(b)(4) — Unsanitary Conditions', '§ 581(b)(5) — Sewage / Human Waste', '§ 581(b)(6) — Mold Growth', '§ 581(b)(7) — Pigeons / Birds', '§ 581(b)(8) — Noxious Insects / Vermin', '§ 581(b)(11) — Poison Oak', '§ 581(b)(13) — Rodents', '§ 581(b)(18) — Public Health Safety Threat', '§ 609 — Unpaid Fees');
-- Create enum type "owner_documents_category_enum"
CREATE TYPE "public"."owner_documents_category_enum" AS ENUM ('Proof of Service', 'NOV', 'Correspondence', 'Permit', 'Owner Response', 'Other');
-- Create enum type "exhibits_exhibit_type_enum"
CREATE TYPE "public"."exhibits_exhibit_type_enum" AS ENUM ('Photo', 'Inspection Report', 'NOV', 'Correspondence', 'Other');
-- Create enum type "exhibits_category_enum"
CREATE TYPE "public"."exhibits_category_enum" AS ENUM ('Inspection Report', 'Photos', 'NOV', 'Correspondence', 'Proof of Service', 'Other');
-- Create enum type "service_log_service_method_enum"
CREATE TYPE "public"."service_log_service_method_enum" AS ENUM ('Certified Mail', 'Personal Service', 'Posting', 'Email');
-- Create enum type "service_log_status_enum"
CREATE TYPE "public"."service_log_status_enum" AS ENUM ('Draft', 'Mailed', 'Posted', 'Personally Served', 'Returned', 'Proof Complete');
-- Create enum type "hearing_packets_packet_status_enum"
CREATE TYPE "public"."hearing_packets_packet_status_enum" AS ENUM ('Not Started', 'In Progress', 'Under Review', 'Complete', 'Submitted', 'Changes Requested', 'Approved');
-- Create enum type "hearing_packets_program_code_enum"
CREATE TYPE "public"."hearing_packets_program_code_enum" AS ENUM ('HHV', 'HHP', 'VEC', 'ENV');
-- Create enum type "hearing_packets_packet_type_enum"
CREATE TYPE "public"."hearing_packets_packet_type_enum" AS ENUM ('Draft', 'Final');
-- Create enum type "users_role_enum"
CREATE TYPE "public"."users_role_enum" AS ENUM ('Admin', 'Inspector', 'Program Manager', 'Super Admin');
-- Create enum type "users_signature_style_enum"
CREATE TYPE "public"."users_signature_style_enum" AS ENUM ('Style 1 — Classic', 'Style 2 — Flowing', 'Style 3 — Formal', 'Style 4 — Modern');
-- Create enum type "imported_reports_parsing_status_enum"
CREATE TYPE "public"."imported_reports_parsing_status_enum" AS ENUM ('Pending', 'Parsed', 'Failed', 'Manual');
-- Create enum type "document_category_enum"
CREATE TYPE "public"."document_category_enum" AS ENUM ('Regulatory SOP', 'Legal Logic & Citations', 'Draft Hearing Packet', 'Official Hearing Record', 'Evidence: Inspection Report', 'Evidence: Photographic', 'Service & Notice Proof', 'General Reference', 'Article 11 Health Code');
-- Create "complaints" table
CREATE TABLE "public"."complaints" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "date_entered" date NULL,
  "address" text NULL,
  "complaintid" text NULL,
  "locationid" text NULL,
  "status" "public"."complaints_status_enum" NULL,
  "description" text NULL,
  "assigned_to" text NULL,
  "category" text[] NULL,
  "date_last_report_sent" text NULL,
  "reinspection_due_on_after" date NULL,
  "attachments" boolean NULL,
  "inspections" text NULL,
  "location" text NULL,
  "complainant_name" text NULL,
  "complainant_phone" text NULL,
  "complainant_email" text NULL,
  "chronology" text NULL,
  "owner_documents" text NULL,
  "exhibits" text NULL,
  "service_log" text NULL,
  "hearing_packets" text NULL,
  "hearing_status" "public"."complaints_hearing_status_enum" NULL,
  "hearing_date" date NULL,
  "thread_parent" text NULL,
  "violations" text NULL,
  "inspection_photos" text NULL,
  "311_case_number" text NULL,
  "unit_number" text NULL,
  "complaint_type" text NULL,
  "complaint_subtype" text NULL,
  "method_received" "public"."complaints_method_received_enum" NULL,
  "assigned_program" "public"."complaints_assigned_program_enum" NULL,
  "date_assigned" date NULL,
  "complainant_anonymous" boolean NULL,
  "complainant_address" text NULL,
  "complainant_contact_dates" text NULL,
  "facility_name" text NULL,
  "facility_ownership" text NULL,
  "date_closed" date NULL,
  "deleted_at" timestamptz NULL,
  "hearing_rp_name" text NULL,
  "hearing_rp_phone" text NULL,
  "hearing_rp_email" text NULL,
  "hearing_rp_address" text NULL,
  "purpose_of_hearing" text NULL,
  "notice_of_hearing_date" date NULL,
  "hearing_order_date" date NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NULL,
  "case_number" text NULL,
  "date_referred_to_hearing" date NULL,
  "hearing_officer_name" text NULL,
  "post_order_service_date" date NULL,
  "is_sample" boolean NULL DEFAULT false,
  "date_last_report_sent_parsed" date NULL,
  PRIMARY KEY ("id")
);
-- Create index "idx_complaints_assigned_date" to table: "complaints"
CREATE INDEX "idx_complaints_assigned_date" ON "public"."complaints" ("assigned_to", "date_entered" DESC);
-- Create index "idx_complaints_assigned_program" to table: "complaints"
CREATE INDEX "idx_complaints_assigned_program" ON "public"."complaints" ("assigned_program");
-- Create index "idx_complaints_assigned_to" to table: "complaints"
CREATE INDEX "idx_complaints_assigned_to" ON "public"."complaints" ("assigned_to");
-- Create index "idx_complaints_case_number" to table: "complaints"
CREATE INDEX "idx_complaints_case_number" ON "public"."complaints" ("case_number");
-- Create index "idx_complaints_complaintid" to table: "complaints"
CREATE INDEX "idx_complaints_complaintid" ON "public"."complaints" ("complaintid");
-- Create index "idx_complaints_date_entered" to table: "complaints"
CREATE INDEX "idx_complaints_date_entered" ON "public"."complaints" ("date_entered" DESC);
-- Create index "idx_complaints_deleted_at" to table: "complaints"
CREATE INDEX "idx_complaints_deleted_at" ON "public"."complaints" ("deleted_at");
-- Create index "idx_complaints_hearing_status" to table: "complaints"
CREATE INDEX "idx_complaints_hearing_status" ON "public"."complaints" ("hearing_status");
-- Create index "idx_complaints_locationid" to table: "complaints"
CREATE INDEX "idx_complaints_locationid" ON "public"."complaints" ("locationid");
-- Create index "idx_complaints_status" to table: "complaints"
CREATE INDEX "idx_complaints_status" ON "public"."complaints" ("status");
-- Create "demo" table
CREATE TABLE "public"."demo" (
  "id" text NULL,
  "url" text NULL,
  "created_time" timestamp NULL,
  "last_edited_time" timestamp NULL,
  "archived" boolean NULL,
  "attrs" jsonb NULL
);
-- Create "exhibit_default_sequence" table
CREATE TABLE "public"."exhibit_default_sequence" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "exhibit_letter" text NOT NULL,
  "default_content" text NOT NULL,
  "description" text NULL,
  "sort_order" integer NOT NULL,
  "is_required" boolean NULL DEFAULT true,
  "created_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "exhibit_default_sequence_exhibit_letter_key" UNIQUE ("exhibit_letter")
);
-- Create "packet_reviewers" table
CREATE TABLE "public"."packet_reviewers" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "role" text NOT NULL,
  "review_order" integer NOT NULL,
  "review_notes" text NULL,
  "is_active" boolean NULL DEFAULT true,
  "created_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "packet_reviewers_name_key" UNIQUE ("name")
);
-- Create "pdf_field_map" table
CREATE TABLE "public"."pdf_field_map" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "template_name" text NOT NULL,
  "pdf_field_name" text NOT NULL,
  "canonical_field" text NOT NULL,
  "field_type" text NULL,
  "source_table" text NULL,
  "source_column" text NULL,
  "notes" text NULL,
  "created_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "pdf_field_map_template_name_pdf_field_name_key" UNIQUE ("template_name", "pdf_field_name")
);
-- Create "proposed_order_terms" table
CREATE TABLE "public"."proposed_order_terms" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "sort_order" integer NOT NULL,
  "slug" text NOT NULL,
  "term_text" text NOT NULL,
  "is_default" boolean NULL DEFAULT true,
  "source_section" text NULL,
  "created_at" timestamptz NULL DEFAULT now(),
  "updated_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "proposed_order_terms_slug_key" UNIQUE ("slug")
);
-- Create "sop_validation_rules" table
CREATE TABLE "public"."sop_validation_rules" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "rule_slug" text NOT NULL,
  "rule_name" text NOT NULL,
  "description" text NOT NULL,
  "threshold_value" integer NULL,
  "threshold_unit" text NULL,
  "severity" text NULL DEFAULT 'critical',
  "source_section" text NULL,
  "is_active" boolean NULL DEFAULT true,
  "created_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "sop_validation_rules_rule_slug_key" UNIQUE ("rule_slug")
);
-- Create enum type "equality_op"
CREATE TYPE "realtime"."equality_op" AS ENUM ('eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'in');
-- Create enum type "action"
CREATE TYPE "realtime"."action" AS ENUM ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'ERROR');
-- Create "messages" table
CREATE TABLE "realtime"."messages" (
  "topic" text NOT NULL,
  "extension" text NOT NULL,
  "payload" jsonb NULL,
  "event" text NULL,
  "private" boolean NULL DEFAULT false,
  "updated_at" timestamp NOT NULL DEFAULT now(),
  "inserted_at" timestamp NOT NULL DEFAULT now(),
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  PRIMARY KEY ("id", "inserted_at")
) PARTITION BY RANGE ("inserted_at");
-- Create index "messages_inserted_at_topic_index" to table: "messages"
CREATE INDEX "messages_inserted_at_topic_index" ON "realtime"."messages" ("inserted_at" DESC, "topic") WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));
-- Create "schema_migrations" table
CREATE TABLE "realtime"."schema_migrations" (
  "version" bigint NOT NULL,
  "inserted_at" timestamp(0) NULL,
  PRIMARY KEY ("version")
);
-- Create "subscription" table
CREATE TABLE "realtime"."subscription" (
  "id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
  "subscription_id" uuid NOT NULL,
  "entity" regclass NOT NULL,
  "filters" realtime.user_defined_filter[] NOT NULL DEFAULT '{}',
  "claims" jsonb NOT NULL,
  "claims_role" regrole NOT NULL GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED,
  "created_at" timestamp NOT NULL DEFAULT timezone('utc'::text, now()),
  "action_filter" text NULL DEFAULT '*',
  CONSTRAINT "pk_subscription" PRIMARY KEY ("id"),
  CONSTRAINT "subscription_action_filter_check" CHECK (action_filter = ANY (ARRAY['*'::text, 'INSERT'::text, 'UPDATE'::text, 'DELETE'::text]))
);
-- Create index "ix_realtime_subscription_entity" to table: "subscription"
CREATE INDEX "ix_realtime_subscription_entity" ON "realtime"."subscription" ("entity");
-- Create index "subscription_subscription_id_entity_filters_action_filter_key" to table: "subscription"
CREATE UNIQUE INDEX "subscription_subscription_id_entity_filters_action_filter_key" ON "realtime"."subscription" ("subscription_id", "entity", "filters", "action_filter");
-- Create enum type "buckettype"
CREATE TYPE "storage"."buckettype" AS ENUM ('STANDARD', 'ANALYTICS', 'VECTOR');
-- Create "buckets_analytics" table
CREATE TABLE "storage"."buckets_analytics" (
  "name" text NOT NULL,
  "type" "storage"."buckettype" NOT NULL DEFAULT 'ANALYTICS',
  "format" text NOT NULL DEFAULT 'ICEBERG',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id")
);
-- Create index "buckets_analytics_unique_name_idx" to table: "buckets_analytics"
CREATE UNIQUE INDEX "buckets_analytics_unique_name_idx" ON "storage"."buckets_analytics" ("name") WHERE (deleted_at IS NULL);
-- Create "migrations" table
CREATE TABLE "storage"."migrations" (
  "id" integer NOT NULL,
  "name" character varying(100) NOT NULL,
  "hash" character varying(40) NOT NULL,
  "executed_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  CONSTRAINT "migrations_name_key" UNIQUE ("name")
);
-- Create "hooks" table
CREATE TABLE "supabase_functions"."hooks" (
  "id" bigserial NOT NULL,
  "hook_table_id" integer NOT NULL,
  "hook_name" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "request_id" bigint NULL,
  PRIMARY KEY ("id")
);
-- Create index "supabase_functions_hooks_h_table_id_h_name_idx" to table: "hooks"
CREATE INDEX "supabase_functions_hooks_h_table_id_h_name_idx" ON "supabase_functions"."hooks" ("hook_table_id", "hook_name");
-- Create index "supabase_functions_hooks_request_id_idx" to table: "hooks"
CREATE INDEX "supabase_functions_hooks_request_id_idx" ON "supabase_functions"."hooks" ("request_id");
-- Set comment to table: "hooks"
COMMENT ON TABLE "supabase_functions"."hooks" IS 'Supabase Functions Hooks: Audit trail for triggered hooks.';
-- Create "migrations" table
CREATE TABLE "supabase_functions"."migrations" (
  "version" text NOT NULL,
  "inserted_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("version")
);
-- Create "schema_migrations" table
CREATE TABLE "supabase_migrations"."schema_migrations" (
  "version" text NOT NULL,
  "statements" text[] NULL,
  "name" text NULL,
  "created_by" text NULL,
  "idempotency_key" text NULL,
  "rollback" text[] NULL,
  PRIMARY KEY ("version"),
  CONSTRAINT "schema_migrations_idempotency_key_key" UNIQUE ("idempotency_key")
);
-- Create "chronology" table
CREATE TABLE "public"."chronology" (
  "summary" text NULL,
  "entry_date" date NULL,
  "entry_type" "public"."chronology_entry_type_enum" NULL,
  "created_by" text NULL,
  "complaint" text NULL,
  "related_inspection" text NULL,
  "frozen_at" timestamptz NULL,
  "source_record" text NULL,
  "visibility" "public"."chronology_visibility_enum" NULL,
  "violations_observed" text NULL,
  "exhibit_refs" text NULL,
  "chronology_order" numeric NULL,
  "attachment_page_ref" text NULL,
  "citation_code" "public"."chronology_citation_code_enum" NULL,
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NULL,
  "deleted_at" timestamptz NULL,
  "complaint_uuid" uuid NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "chronology_complaint_uuid_fkey" FOREIGN KEY ("complaint_uuid") REFERENCES "public"."complaints" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "idx_chronology_complaint" to table: "chronology"
CREATE INDEX "idx_chronology_complaint" ON "public"."chronology" ("complaint");
-- Create index "idx_chronology_complaint_uuid" to table: "chronology"
CREATE INDEX "idx_chronology_complaint_uuid" ON "public"."chronology" ("complaint_uuid");
-- Create index "idx_chronology_entry_date" to table: "chronology"
CREATE INDEX "idx_chronology_entry_date" ON "public"."chronology" ("entry_date");
-- Create index "idx_chronology_entry_type" to table: "chronology"
CREATE INDEX "idx_chronology_entry_type" ON "public"."chronology" ("entry_type");
-- Create index "idx_chronology_order" to table: "chronology"
CREATE INDEX "idx_chronology_order" ON "public"."chronology" ("chronology_order");
-- Create index "idx_chronology_visibility" to table: "chronology"
CREATE INDEX "idx_chronology_visibility" ON "public"."chronology" ("visibility");
-- Create "users" table
CREATE TABLE "auth"."users" (
  "instance_id" uuid NULL,
  "id" uuid NOT NULL,
  "aud" character varying(255) NULL,
  "role" character varying(255) NULL,
  "email" character varying(255) NULL,
  "encrypted_password" character varying(255) NULL,
  "email_confirmed_at" timestamptz NULL,
  "invited_at" timestamptz NULL,
  "confirmation_token" character varying(255) NULL,
  "confirmation_sent_at" timestamptz NULL,
  "recovery_token" character varying(255) NULL,
  "recovery_sent_at" timestamptz NULL,
  "email_change_token_new" character varying(255) NULL,
  "email_change" character varying(255) NULL,
  "email_change_sent_at" timestamptz NULL,
  "last_sign_in_at" timestamptz NULL,
  "raw_app_meta_data" jsonb NULL,
  "raw_user_meta_data" jsonb NULL,
  "is_super_admin" boolean NULL,
  "created_at" timestamptz NULL,
  "updated_at" timestamptz NULL,
  "phone" text NULL DEFAULT NULL::character varying,
  "phone_confirmed_at" timestamptz NULL,
  "phone_change" text NULL DEFAULT '',
  "phone_change_token" character varying(255) NULL DEFAULT '',
  "phone_change_sent_at" timestamptz NULL,
  "confirmed_at" timestamptz NULL GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
  "email_change_token_current" character varying(255) NULL DEFAULT '',
  "email_change_confirm_status" smallint NULL DEFAULT 0,
  "banned_until" timestamptz NULL,
  "reauthentication_token" character varying(255) NULL DEFAULT '',
  "reauthentication_sent_at" timestamptz NULL,
  "is_sso_user" boolean NOT NULL DEFAULT false,
  "deleted_at" timestamptz NULL,
  "is_anonymous" boolean NOT NULL DEFAULT false,
  PRIMARY KEY ("id"),
  CONSTRAINT "users_phone_key" UNIQUE ("phone"),
  CONSTRAINT "users_email_change_confirm_status_check" CHECK ((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2))
);
-- Create index "confirmation_token_idx" to table: "users"
CREATE UNIQUE INDEX "confirmation_token_idx" ON "auth"."users" ("confirmation_token") WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);
-- Create index "email_change_token_current_idx" to table: "users"
CREATE UNIQUE INDEX "email_change_token_current_idx" ON "auth"."users" ("email_change_token_current") WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);
-- Create index "email_change_token_new_idx" to table: "users"
CREATE UNIQUE INDEX "email_change_token_new_idx" ON "auth"."users" ("email_change_token_new") WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);
-- Create index "idx_users_created_at_desc" to table: "users"
CREATE INDEX "idx_users_created_at_desc" ON "auth"."users" ("created_at" DESC);
-- Create index "idx_users_email" to table: "users"
CREATE INDEX "idx_users_email" ON "auth"."users" ("email");
-- Create index "idx_users_last_sign_in_at_desc" to table: "users"
CREATE INDEX "idx_users_last_sign_in_at_desc" ON "auth"."users" ("last_sign_in_at" DESC);
-- Create index "idx_users_name" to table: "users"
CREATE INDEX "idx_users_name" ON "auth"."users" (((raw_user_meta_data ->> 'name'::text))) WHERE ((raw_user_meta_data ->> 'name'::text) IS NOT NULL);
-- Create index "reauthentication_token_idx" to table: "users"
CREATE UNIQUE INDEX "reauthentication_token_idx" ON "auth"."users" ("reauthentication_token") WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);
-- Create index "recovery_token_idx" to table: "users"
CREATE UNIQUE INDEX "recovery_token_idx" ON "auth"."users" ("recovery_token") WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);
-- Create index "users_email_partial_key" to table: "users"
CREATE UNIQUE INDEX "users_email_partial_key" ON "auth"."users" ("email") WHERE (is_sso_user = false);
-- Create index "users_instance_id_email_idx" to table: "users"
CREATE INDEX "users_instance_id_email_idx" ON "auth"."users" ("instance_id", (lower((email)::text)));
-- Create index "users_instance_id_idx" to table: "users"
CREATE INDEX "users_instance_id_idx" ON "auth"."users" ("instance_id");
-- Create index "users_is_anonymous_idx" to table: "users"
CREATE INDEX "users_is_anonymous_idx" ON "auth"."users" ("is_anonymous");
-- Set comment to table: "users"
COMMENT ON TABLE "auth"."users" IS 'Auth: Stores user login data within a secure schema.';
-- Set comment to column: "is_sso_user" on table: "users"
COMMENT ON COLUMN "auth"."users"."is_sso_user" IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';
-- Set comment to index: "users_email_partial_key" on table: "users"
COMMENT ON INDEX "auth"."users_email_partial_key" IS 'Auth: A partial unique index that applies only when is_sso_user is false';
-- Create "users" table
CREATE TABLE "public"."users" (
  "email" text NULL,
  "first_name" text NULL,
  "last_name" text NULL,
  "role" "public"."users_role_enum" NULL,
  "last_login" timestamptz NULL,
  "signature_text" text NULL,
  "signature_style" "public"."users_signature_style_enum" NULL,
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NULL,
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id")
);
-- Create index "idx_users_email" to table: "users"
CREATE INDEX "idx_users_email" ON "public"."users" ("email");
-- Create index "idx_users_role" to table: "users"
CREATE INDEX "idx_users_role" ON "public"."users" ("role");
-- Create "documents" table
CREATE TABLE "public"."documents" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "title" text NOT NULL,
  "category" "public"."document_category_enum" NOT NULL,
  "file_path" text NOT NULL,
  "file_type" text NULL,
  "version" text NULL DEFAULT '1.0',
  "metadata" jsonb NULL DEFAULT '{}',
  "created_at" timestamptz NULL DEFAULT now(),
  "updated_at" timestamptz NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  "uploaded_by" uuid NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Set comment to table: "documents"
COMMENT ON TABLE "public"."documents" IS 'Central registry for all uploaded files (SOPs, drafts, etc.)';
-- Create "locations" table
CREATE TABLE "public"."locations" (
  "address" text NULL,
  "location_id" text NULL,
  "owner_name" text NULL,
  "owner_address" text NULL,
  "owner_phone" text NULL,
  "owner_email" text NULL,
  "facility_type" "public"."locations_facility_type_enum" NULL,
  "number_of_units" numeric NULL,
  "number_of_rooms" numeric NULL,
  "healthy_housing" boolean NULL,
  "census_tract" text NULL,
  "current_fees" numeric(10,2) NULL,
  "inspections" text NULL,
  "open_complaint_inspections_list" text NULL,
  "block_lot" text NULL,
  "dba" text NULL,
  "management_name" text NULL,
  "responsible_party" text NULL,
  "responsible_party_phone" text NULL,
  "responsible_party_email" text NULL,
  "building_features" text[] NULL,
  "verification_date" date NULL,
  "imported_reports" text NULL,
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NULL,
  "deleted_at" timestamptz NULL,
  "apn" text NULL,
  "city" text NULL DEFAULT 'San Francisco',
  "state" text NULL DEFAULT 'CA',
  "zip" text NULL,
  "latitude" numeric(10,7) NULL,
  "longitude" numeric(10,7) NULL,
  "notes" text NULL,
  PRIMARY KEY ("id")
);
-- Create index "idx_locations_address_trgm" to table: "locations"
CREATE INDEX "idx_locations_address_trgm" ON "public"."locations" USING GIN ("address" public.gin_trgm_ops);
-- Create index "idx_locations_facility_type" to table: "locations"
CREATE INDEX "idx_locations_facility_type" ON "public"."locations" ("facility_type");
-- Create index "idx_locations_location_id" to table: "locations"
CREATE INDEX "idx_locations_location_id" ON "public"."locations" ("location_id");
-- Create index "idx_locations_owner_name" to table: "locations"
CREATE INDEX "idx_locations_owner_name" ON "public"."locations" ("owner_name");
-- Create "inspections" table
CREATE TABLE "public"."inspections" (
  "inspection_id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
  "location" text NULL,
  "complaint" text NULL,
  "inspector" text NULL,
  "inspection_date" date NULL,
  "time_in" text NULL,
  "time_out" text NULL,
  "inspection_type" "public"."inspections_inspection_type_enum" NULL,
  "inspection_rating" "public"."inspections_inspection_rating_enum" NULL,
  "access_granted_by" "public"."inspections_access_granted_by_enum" NULL,
  "dba" text NULL,
  "contact_phone" text NULL,
  "contact_email" text NULL,
  "facility_address" text NULL,
  "complaint_id" text NULL,
  "location_id" text NULL,
  "notes" text NULL,
  "completed_report" text NULL,
  "violation_count" numeric NULL,
  "violations" text NULL,
  "status" "public"."inspections_status_enum" NULL,
  "submitted_at" timestamptz NULL,
  "chronology" text NULL,
  "exhibits" text NULL,
  "deleted_at" timestamptz NULL,
  "imported_reports" text NULL,
  "inspection_photos" text NULL,
  "complaint_id_uuid" uuid NULL,
  "location_id_uuid" uuid NULL,
  "photo_count" integer NULL DEFAULT 0,
  "nov_issued" boolean NULL DEFAULT false,
  "nov_date" date NULL,
  "nov_posted_date" date NULL,
  "created_at" timestamptz NULL DEFAULT now(),
  "updated_at" timestamptz NULL DEFAULT now(),
  "time_in_parsed" time NULL,
  "time_out_parsed" time NULL,
  PRIMARY KEY ("inspection_id"),
  CONSTRAINT "inspections_complaint_id_uuid_fkey" FOREIGN KEY ("complaint_id_uuid") REFERENCES "public"."complaints" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "inspections_location_id_uuid_fkey" FOREIGN KEY ("location_id_uuid") REFERENCES "public"."locations" ("id") ON UPDATE NO ACTION ON DELETE SET NULL
);
-- Create index "idx_inspections_complaint" to table: "inspections"
CREATE INDEX "idx_inspections_complaint" ON "public"."inspections" ("complaint");
-- Create index "idx_inspections_complaint_id" to table: "inspections"
CREATE INDEX "idx_inspections_complaint_id" ON "public"."inspections" ("complaint_id");
-- Create index "idx_inspections_complaint_uuid" to table: "inspections"
CREATE INDEX "idx_inspections_complaint_uuid" ON "public"."inspections" ("complaint_id_uuid");
-- Create index "idx_inspections_date" to table: "inspections"
CREATE INDEX "idx_inspections_date" ON "public"."inspections" ("inspection_date" DESC);
-- Create index "idx_inspections_deleted_at" to table: "inspections"
CREATE INDEX "idx_inspections_deleted_at" ON "public"."inspections" ("deleted_at");
-- Create index "idx_inspections_inspector" to table: "inspections"
CREATE INDEX "idx_inspections_inspector" ON "public"."inspections" ("inspector");
-- Create index "idx_inspections_location" to table: "inspections"
CREATE INDEX "idx_inspections_location" ON "public"."inspections" ("location");
-- Create index "idx_inspections_location_id" to table: "inspections"
CREATE INDEX "idx_inspections_location_id" ON "public"."inspections" ("location_id");
-- Create index "idx_inspections_location_uuid" to table: "inspections"
CREATE INDEX "idx_inspections_location_uuid" ON "public"."inspections" ("location_id_uuid");
-- Create index "idx_inspections_status" to table: "inspections"
CREATE INDEX "idx_inspections_status" ON "public"."inspections" ("status");
-- Create "exhibits" table
CREATE TABLE "public"."exhibits" (
  "exhibit_label" text NULL,
  "exhibit_type" "public"."exhibits_exhibit_type_enum" NULL,
  "description" text NULL,
  "sort_order" numeric NULL,
  "complaint" text NULL,
  "source_inspection" text NULL,
  "source_photo" text NULL,
  "file" jsonb NULL,
  "caption" text NULL,
  "category" "public"."exhibits_category_enum" NULL,
  "deleted_at" timestamptz NULL,
  "exhibit_date" date NULL,
  "page_count" numeric NULL,
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NULL,
  "complaint_uuid" uuid NULL,
  "source_inspection_id" bigint NULL,
  "included_in_packet" boolean NOT NULL DEFAULT false,
  "packet_sort_order" integer NULL,
  "packet_page_start" integer NULL,
  "packet_page_end" integer NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "exhibits_complaint_uuid_fkey" FOREIGN KEY ("complaint_uuid") REFERENCES "public"."complaints" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "exhibits_source_inspection_id_fkey" FOREIGN KEY ("source_inspection_id") REFERENCES "public"."inspections" ("inspection_id") ON UPDATE NO ACTION ON DELETE SET NULL
);
-- Create index "idx_exhibits_category" to table: "exhibits"
CREATE INDEX "idx_exhibits_category" ON "public"."exhibits" ("category");
-- Create index "idx_exhibits_complaint" to table: "exhibits"
CREATE INDEX "idx_exhibits_complaint" ON "public"."exhibits" ("complaint");
-- Create index "idx_exhibits_complaint_uuid" to table: "exhibits"
CREATE INDEX "idx_exhibits_complaint_uuid" ON "public"."exhibits" ("complaint_uuid");
-- Create index "idx_exhibits_deleted_at" to table: "exhibits"
CREATE INDEX "idx_exhibits_deleted_at" ON "public"."exhibits" ("deleted_at");
-- Create index "idx_exhibits_inspection_id" to table: "exhibits"
CREATE INDEX "idx_exhibits_inspection_id" ON "public"."exhibits" ("source_inspection_id");
-- Create index "idx_exhibits_source_inspection" to table: "exhibits"
CREATE INDEX "idx_exhibits_source_inspection" ON "public"."exhibits" ("source_inspection");
-- Create "hearing_packets" table
CREATE TABLE "public"."hearing_packets" (
  "hearing_date" date NULL,
  "packet_status" "public"."hearing_packets_packet_status_enum" NULL,
  "assigned_to" text NULL,
  "notes" text NULL,
  "generated_at" timestamptz NULL,
  "complaint" text NULL,
  "case_number" text NULL,
  "program_code" "public"."hearing_packets_program_code_enum" NULL,
  "proposed_actions" text[] NULL,
  "hearing_time" text NULL,
  "hearing_location" text NULL,
  "chronology_snapshot" text NULL,
  "packet_type" "public"."hearing_packets_packet_type_enum" NULL,
  "bates_start" numeric NULL,
  "bates_end" numeric NULL,
  "hearing_order_data" text NULL,
  "selected_report_ids" text NULL,
  "selected_photo_ids" text NULL,
  "admin_fee" text NULL,
  "checklist_data" text NULL,
  "enforcement_flags" text NULL,
  "selected_reports" text[] NULL,
  "selected_photos" text[] NULL,
  "inspector_signature" text NULL,
  "manager_signature" text NULL,
  "revision_notes" text NULL,
  "status_history" text NULL,
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NULL,
  "deleted_at" timestamptz NULL,
  "complaint_uuid" uuid NULL,
  "deadline_14day_met" boolean NULL,
  "deadline_5day_met" boolean NULL,
  "deadline_24hr_met" boolean NULL,
  "hearing_coordinator_name" text NULL,
  "hearing_coordinator_email" text NULL,
  "notice_service_date" date NULL,
  "final_reinspection_date" date NULL,
  "coordinator_submittal_date" date NULL,
  "teams_upload_date" date NULL,
  "post_order_service_date" date NULL,
  "internal_review_date" date NULL,
  "page_numbering_complete" boolean NULL DEFAULT false,
  "exhibit_labeling_complete" boolean NULL DEFAULT false,
  "checklist_json" jsonb NULL DEFAULT '{}',
  "enforcement_json" jsonb NULL DEFAULT '{}',
  "status_history_json" jsonb NULL DEFAULT '[]',
  "hearing_rp_name" text NULL,
  "hearing_rp_email" text NULL,
  "hearing_rp_phone" text NULL,
  "selected_report_ids_json" jsonb NOT NULL DEFAULT '[]',
  "selected_photo_ids_json" jsonb NOT NULL DEFAULT '[]',
  "packet_snapshot_json" jsonb NOT NULL DEFAULT '{}',
  "validation_results_json" jsonb NOT NULL DEFAULT '[]',
  "generated_file_path" text NULL,
  "final_file_path" text NULL,
  "approved_at" timestamptz NULL,
  "submitted_at" timestamptz NULL,
  "locked_at" timestamptz NULL,
  "locked_by" uuid NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "hearing_packets_complaint_uuid_fkey" FOREIGN KEY ("complaint_uuid") REFERENCES "public"."complaints" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "idx_hearing_packets_case_number" to table: "hearing_packets"
CREATE INDEX "idx_hearing_packets_case_number" ON "public"."hearing_packets" ("case_number");
-- Create index "idx_hearing_packets_complaint" to table: "hearing_packets"
CREATE INDEX "idx_hearing_packets_complaint" ON "public"."hearing_packets" ("complaint_uuid");
-- Create index "idx_hearing_packets_complaint_uuid" to table: "hearing_packets"
CREATE INDEX "idx_hearing_packets_complaint_uuid" ON "public"."hearing_packets" ("complaint_uuid") WHERE (deleted_at IS NULL);
-- Create index "idx_packets_assigned" to table: "hearing_packets"
CREATE INDEX "idx_packets_assigned" ON "public"."hearing_packets" ("assigned_to");
-- Create index "idx_packets_complaint" to table: "hearing_packets"
CREATE INDEX "idx_packets_complaint" ON "public"."hearing_packets" ("complaint");
-- Create index "idx_packets_hearing_date" to table: "hearing_packets"
CREATE INDEX "idx_packets_hearing_date" ON "public"."hearing_packets" ("hearing_date");
-- Create index "idx_packets_status" to table: "hearing_packets"
CREATE INDEX "idx_packets_status" ON "public"."hearing_packets" ("packet_status");
-- Create index "idx_packets_type" to table: "hearing_packets"
CREATE INDEX "idx_packets_type" ON "public"."hearing_packets" ("packet_type");
-- Set comment to column: "selected_report_ids_json" on table: "hearing_packets"
COMMENT ON COLUMN "public"."hearing_packets"."selected_report_ids_json" IS 'Structured list of report/document IDs selected for the hearing packet.';
-- Set comment to column: "selected_photo_ids_json" on table: "hearing_packets"
COMMENT ON COLUMN "public"."hearing_packets"."selected_photo_ids_json" IS 'Structured list of inspection photo IDs selected for the hearing packet.';
-- Set comment to column: "packet_snapshot_json" on table: "hearing_packets"
COMMENT ON COLUMN "public"."hearing_packets"."packet_snapshot_json" IS 'Frozen structured packet object used to generate a draft or final packet.';
-- Set comment to column: "validation_results_json" on table: "hearing_packets"
COMMENT ON COLUMN "public"."hearing_packets"."validation_results_json" IS 'Latest readiness/validation result set for the packet.';
-- Create "generated_packet_files" table
CREATE TABLE "public"."generated_packet_files" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "hearing_packet_id" uuid NULL,
  "complaint_uuid" uuid NULL,
  "file_type" text NOT NULL,
  "file_path" text NOT NULL,
  "file_name" text NULL,
  "mime_type" text NULL,
  "version_number" integer NOT NULL DEFAULT 1,
  "generated_by" uuid NULL,
  "generated_at" timestamptz NOT NULL DEFAULT now(),
  "packet_hash" text NULL,
  "is_final" boolean NOT NULL DEFAULT false,
  "notes" text NULL,
  "metadata" jsonb NOT NULL DEFAULT '{}',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "generated_packet_files_complaint_uuid_fkey" FOREIGN KEY ("complaint_uuid") REFERENCES "public"."complaints" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "generated_packet_files_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "auth"."users" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "generated_packet_files_hearing_packet_id_fkey" FOREIGN KEY ("hearing_packet_id") REFERENCES "public"."hearing_packets" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "generated_packet_files_file_type_check" CHECK (file_type = ANY (ARRAY['draft_pdf'::text, 'final_pdf'::text, 'draft_docx'::text, 'final_docx'::text, 'packet_json'::text, 'exhibit_index'::text, 'other'::text])),
  CONSTRAINT "generated_packet_files_version_number_check" CHECK (version_number > 0)
);
-- Create index "idx_generated_packet_files_complaint" to table: "generated_packet_files"
CREATE INDEX "idx_generated_packet_files_complaint" ON "public"."generated_packet_files" ("complaint_uuid");
-- Create index "idx_generated_packet_files_final" to table: "generated_packet_files"
CREATE INDEX "idx_generated_packet_files_final" ON "public"."generated_packet_files" ("hearing_packet_id", "is_final");
-- Create index "idx_generated_packet_files_packet" to table: "generated_packet_files"
CREATE INDEX "idx_generated_packet_files_packet" ON "public"."generated_packet_files" ("hearing_packet_id");
-- Set comment to table: "generated_packet_files"
COMMENT ON TABLE "public"."generated_packet_files" IS 'Registry of all generated Director hearing packet files and versions.';
-- Create "identities" table
CREATE TABLE "auth"."identities" (
  "provider_id" text NOT NULL,
  "user_id" uuid NOT NULL,
  "identity_data" jsonb NOT NULL,
  "provider" text NOT NULL,
  "last_sign_in_at" timestamptz NULL,
  "created_at" timestamptz NULL,
  "updated_at" timestamptz NULL,
  "email" text NULL GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  PRIMARY KEY ("id"),
  CONSTRAINT "identities_provider_id_provider_unique" UNIQUE ("provider_id", "provider"),
  CONSTRAINT "identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "identities_email_idx" to table: "identities"
CREATE INDEX "identities_email_idx" ON "auth"."identities" ("email" text_pattern_ops);
-- Create index "identities_user_id_idx" to table: "identities"
CREATE INDEX "identities_user_id_idx" ON "auth"."identities" ("user_id");
-- Set comment to table: "identities"
COMMENT ON TABLE "auth"."identities" IS 'Auth: Stores identities associated to a user.';
-- Set comment to column: "email" on table: "identities"
COMMENT ON COLUMN "auth"."identities"."email" IS 'Auth: Email is a generated column that references the optional email property in the identity_data';
-- Set comment to index: "identities_email_idx" on table: "identities"
COMMENT ON INDEX "auth"."identities_email_idx" IS 'Auth: Ensures indexed queries on the email column';
-- Create "imported_reports" table
CREATE TABLE "public"."imported_reports" (
  "report_title" text NULL,
  "location" text NULL,
  "pdf_file" jsonb NULL,
  "inspection_date" date NULL,
  "inspection_type" text NULL,
  "inspection_rating" text NULL,
  "inspector_name" text NULL,
  "violation_count" numeric NULL,
  "parsing_status" "public"."imported_reports_parsing_status_enum" NULL,
  "uploaded_by" text NULL,
  "uploaded_at" timestamptz NULL,
  "linked_inspection" text NULL,
  "hearing_packets" text[] NULL,
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NULL,
  "deleted_at" timestamptz NULL,
  "location_uuid" uuid NULL,
  "linked_inspection_id" bigint NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "imported_reports_linked_inspection_id_fkey" FOREIGN KEY ("linked_inspection_id") REFERENCES "public"."inspections" ("inspection_id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "imported_reports_location_uuid_fkey" FOREIGN KEY ("location_uuid") REFERENCES "public"."locations" ("id") ON UPDATE NO ACTION ON DELETE SET NULL
);
-- Create index "idx_imported_reports_linked_inspection" to table: "imported_reports"
CREATE INDEX "idx_imported_reports_linked_inspection" ON "public"."imported_reports" ("linked_inspection");
-- Create index "idx_imported_reports_location" to table: "imported_reports"
CREATE INDEX "idx_imported_reports_location" ON "public"."imported_reports" ("location");
-- Create index "idx_imported_reports_parsing_status" to table: "imported_reports"
CREATE INDEX "idx_imported_reports_parsing_status" ON "public"."imported_reports" ("parsing_status");
-- Create "inspection_photos" table
CREATE TABLE "public"."inspection_photos" (
  "photo_url" text NULL,
  "photo_type" "public"."inspection_photos_photo_type_enum" NULL,
  "caption" text NULL,
  "violation_label" text NULL,
  "complaint_id" text NULL,
  "inspector" text NULL,
  "uploaded_at" timestamptz NULL,
  "exhibits" text NULL,
  "complaint" text NULL,
  "inspection" text NULL,
  "hearing_packets" text[] NULL,
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NULL,
  "deleted_at" timestamptz NULL,
  "inspection_id" bigint NULL,
  "photo_taken_at" timestamptz NULL,
  "display_address" text NULL,
  "exhibit_label" text NULL,
  "packet_include" boolean NOT NULL DEFAULT false,
  "packet_sort_order" integer NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "inspection_photos_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "public"."inspections" ("inspection_id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "idx_inspection_photos_inspection_id" to table: "inspection_photos"
CREATE INDEX "idx_inspection_photos_inspection_id" ON "public"."inspection_photos" ("inspection_id") WHERE (deleted_at IS NULL);
-- Create index "idx_photos_complaint_id" to table: "inspection_photos"
CREATE INDEX "idx_photos_complaint_id" ON "public"."inspection_photos" ("complaint_id");
-- Create index "idx_photos_photo_type" to table: "inspection_photos"
CREATE INDEX "idx_photos_photo_type" ON "public"."inspection_photos" ("photo_type");
-- Set comment to column: "photo_taken_at" on table: "inspection_photos"
COMMENT ON COLUMN "public"."inspection_photos"."photo_taken_at" IS 'Timestamp used for hearing packet photo page date and time display.';
-- Set comment to column: "display_address" on table: "inspection_photos"
COMMENT ON COLUMN "public"."inspection_photos"."display_address" IS 'Address shown on generated hearing packet photo page.';
-- Set comment to column: "exhibit_label" on table: "inspection_photos"
COMMENT ON COLUMN "public"."inspection_photos"."exhibit_label" IS 'Exhibit label stamped or printed for this photo in a hearing packet.';
-- Create "oauth_clients" table
CREATE TABLE "auth"."oauth_clients" (
  "id" uuid NOT NULL,
  "client_secret_hash" text NULL,
  "registration_type" "auth"."oauth_registration_type" NOT NULL,
  "redirect_uris" text NOT NULL,
  "grant_types" text NOT NULL,
  "client_name" text NULL,
  "client_uri" text NULL,
  "logo_uri" text NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  "client_type" "auth"."oauth_client_type" NOT NULL DEFAULT 'confidential',
  "token_endpoint_auth_method" text NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "oauth_clients_client_name_length" CHECK (char_length(client_name) <= 1024),
  CONSTRAINT "oauth_clients_client_uri_length" CHECK (char_length(client_uri) <= 2048),
  CONSTRAINT "oauth_clients_logo_uri_length" CHECK (char_length(logo_uri) <= 2048),
  CONSTRAINT "oauth_clients_token_endpoint_auth_method_check" CHECK (token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text]))
);
-- Create index "oauth_clients_deleted_at_idx" to table: "oauth_clients"
CREATE INDEX "oauth_clients_deleted_at_idx" ON "auth"."oauth_clients" ("deleted_at");
-- Create "sessions" table
CREATE TABLE "auth"."sessions" (
  "id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "created_at" timestamptz NULL,
  "updated_at" timestamptz NULL,
  "factor_id" uuid NULL,
  "aal" "auth"."aal_level" NULL,
  "not_after" timestamptz NULL,
  "refreshed_at" timestamp NULL,
  "user_agent" text NULL,
  "ip" inet NULL,
  "tag" text NULL,
  "oauth_client_id" uuid NULL,
  "refresh_token_hmac_key" text NULL,
  "refresh_token_counter" bigint NULL,
  "scopes" text NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "sessions_oauth_client_id_fkey" FOREIGN KEY ("oauth_client_id") REFERENCES "auth"."oauth_clients" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "sessions_scopes_length" CHECK (char_length(scopes) <= 4096)
);
-- Create index "sessions_not_after_idx" to table: "sessions"
CREATE INDEX "sessions_not_after_idx" ON "auth"."sessions" ("not_after" DESC);
-- Create index "sessions_oauth_client_id_idx" to table: "sessions"
CREATE INDEX "sessions_oauth_client_id_idx" ON "auth"."sessions" ("oauth_client_id");
-- Create index "sessions_user_id_idx" to table: "sessions"
CREATE INDEX "sessions_user_id_idx" ON "auth"."sessions" ("user_id");
-- Create index "user_id_created_at_idx" to table: "sessions"
CREATE INDEX "user_id_created_at_idx" ON "auth"."sessions" ("user_id", "created_at");
-- Set comment to table: "sessions"
COMMENT ON TABLE "auth"."sessions" IS 'Auth: Stores session data associated to a user.';
-- Set comment to column: "not_after" on table: "sessions"
COMMENT ON COLUMN "auth"."sessions"."not_after" IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';
-- Set comment to column: "refresh_token_hmac_key" on table: "sessions"
COMMENT ON COLUMN "auth"."sessions"."refresh_token_hmac_key" IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';
-- Set comment to column: "refresh_token_counter" on table: "sessions"
COMMENT ON COLUMN "auth"."sessions"."refresh_token_counter" IS 'Holds the ID (counter) of the last issued refresh token.';
-- Create "mfa_amr_claims" table
CREATE TABLE "auth"."mfa_amr_claims" (
  "session_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "authentication_method" text NOT NULL,
  "id" uuid NOT NULL,
  CONSTRAINT "amr_id_pk" PRIMARY KEY ("id"),
  CONSTRAINT "mfa_amr_claims_session_id_authentication_method_pkey" UNIQUE ("session_id", "authentication_method"),
  CONSTRAINT "mfa_amr_claims_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "auth"."sessions" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Set comment to table: "mfa_amr_claims"
COMMENT ON TABLE "auth"."mfa_amr_claims" IS 'auth: stores authenticator method reference claims for multi factor authentication';
-- Create "mfa_factors" table
CREATE TABLE "auth"."mfa_factors" (
  "id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "friendly_name" text NULL,
  "factor_type" "auth"."factor_type" NOT NULL,
  "status" "auth"."factor_status" NOT NULL,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "secret" text NULL,
  "phone" text NULL,
  "last_challenged_at" timestamptz NULL,
  "web_authn_credential" jsonb NULL,
  "web_authn_aaguid" uuid NULL,
  "last_webauthn_challenge_data" jsonb NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "mfa_factors_last_challenged_at_key" UNIQUE ("last_challenged_at"),
  CONSTRAINT "mfa_factors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "factor_id_created_at_idx" to table: "mfa_factors"
CREATE INDEX "factor_id_created_at_idx" ON "auth"."mfa_factors" ("user_id", "created_at");
-- Create index "mfa_factors_user_friendly_name_unique" to table: "mfa_factors"
CREATE UNIQUE INDEX "mfa_factors_user_friendly_name_unique" ON "auth"."mfa_factors" ("friendly_name", "user_id") WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);
-- Create index "mfa_factors_user_id_idx" to table: "mfa_factors"
CREATE INDEX "mfa_factors_user_id_idx" ON "auth"."mfa_factors" ("user_id");
-- Create index "unique_phone_factor_per_user" to table: "mfa_factors"
CREATE UNIQUE INDEX "unique_phone_factor_per_user" ON "auth"."mfa_factors" ("user_id", "phone");
-- Set comment to table: "mfa_factors"
COMMENT ON TABLE "auth"."mfa_factors" IS 'auth: stores metadata about factors';
-- Set comment to column: "last_webauthn_challenge_data" on table: "mfa_factors"
COMMENT ON COLUMN "auth"."mfa_factors"."last_webauthn_challenge_data" IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';
-- Create "mfa_challenges" table
CREATE TABLE "auth"."mfa_challenges" (
  "id" uuid NOT NULL,
  "factor_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL,
  "verified_at" timestamptz NULL,
  "ip_address" inet NOT NULL,
  "otp_code" text NULL,
  "web_authn_session_data" jsonb NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "mfa_challenges_auth_factor_id_fkey" FOREIGN KEY ("factor_id") REFERENCES "auth"."mfa_factors" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "mfa_challenge_created_at_idx" to table: "mfa_challenges"
CREATE INDEX "mfa_challenge_created_at_idx" ON "auth"."mfa_challenges" ("created_at" DESC);
-- Set comment to table: "mfa_challenges"
COMMENT ON TABLE "auth"."mfa_challenges" IS 'auth: stores metadata about challenge requests made';
-- Create "oauth_authorizations" table
CREATE TABLE "auth"."oauth_authorizations" (
  "id" uuid NOT NULL,
  "authorization_id" text NOT NULL,
  "client_id" uuid NOT NULL,
  "user_id" uuid NULL,
  "redirect_uri" text NOT NULL,
  "scope" text NOT NULL,
  "state" text NULL,
  "resource" text NULL,
  "code_challenge" text NULL,
  "code_challenge_method" "auth"."code_challenge_method" NULL,
  "response_type" "auth"."oauth_response_type" NOT NULL DEFAULT 'code',
  "status" "auth"."oauth_authorization_status" NOT NULL DEFAULT 'pending',
  "authorization_code" text NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "expires_at" timestamptz NOT NULL DEFAULT (now() + '00:03:00'::interval),
  "approved_at" timestamptz NULL,
  "nonce" text NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "oauth_authorizations_authorization_code_key" UNIQUE ("authorization_code"),
  CONSTRAINT "oauth_authorizations_authorization_id_key" UNIQUE ("authorization_id"),
  CONSTRAINT "oauth_authorizations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "auth"."oauth_clients" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "oauth_authorizations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "oauth_authorizations_authorization_code_length" CHECK (char_length(authorization_code) <= 255),
  CONSTRAINT "oauth_authorizations_code_challenge_length" CHECK (char_length(code_challenge) <= 128),
  CONSTRAINT "oauth_authorizations_expires_at_future" CHECK (expires_at > created_at),
  CONSTRAINT "oauth_authorizations_nonce_length" CHECK (char_length(nonce) <= 255),
  CONSTRAINT "oauth_authorizations_redirect_uri_length" CHECK (char_length(redirect_uri) <= 2048),
  CONSTRAINT "oauth_authorizations_resource_length" CHECK (char_length(resource) <= 2048),
  CONSTRAINT "oauth_authorizations_scope_length" CHECK (char_length(scope) <= 4096),
  CONSTRAINT "oauth_authorizations_state_length" CHECK (char_length(state) <= 4096)
);
-- Create index "oauth_auth_pending_exp_idx" to table: "oauth_authorizations"
CREATE INDEX "oauth_auth_pending_exp_idx" ON "auth"."oauth_authorizations" ("expires_at") WHERE (status = 'pending'::auth.oauth_authorization_status);
-- Create "oauth_consents" table
CREATE TABLE "auth"."oauth_consents" (
  "id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "client_id" uuid NOT NULL,
  "scopes" text NOT NULL,
  "granted_at" timestamptz NOT NULL DEFAULT now(),
  "revoked_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "oauth_consents_user_client_unique" UNIQUE ("user_id", "client_id"),
  CONSTRAINT "oauth_consents_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "auth"."oauth_clients" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "oauth_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "oauth_consents_revoked_after_granted" CHECK ((revoked_at IS NULL) OR (revoked_at >= granted_at)),
  CONSTRAINT "oauth_consents_scopes_length" CHECK (char_length(scopes) <= 2048),
  CONSTRAINT "oauth_consents_scopes_not_empty" CHECK (char_length(TRIM(BOTH FROM scopes)) > 0)
);
-- Create index "oauth_consents_active_client_idx" to table: "oauth_consents"
CREATE INDEX "oauth_consents_active_client_idx" ON "auth"."oauth_consents" ("client_id") WHERE (revoked_at IS NULL);
-- Create index "oauth_consents_active_user_client_idx" to table: "oauth_consents"
CREATE INDEX "oauth_consents_active_user_client_idx" ON "auth"."oauth_consents" ("user_id", "client_id") WHERE (revoked_at IS NULL);
-- Create index "oauth_consents_user_order_idx" to table: "oauth_consents"
CREATE INDEX "oauth_consents_user_order_idx" ON "auth"."oauth_consents" ("user_id", "granted_at" DESC);
-- Create "buckets" table
CREATE TABLE "storage"."buckets" (
  "id" text NOT NULL,
  "name" text NOT NULL,
  "owner" uuid NULL,
  "created_at" timestamptz NULL DEFAULT now(),
  "updated_at" timestamptz NULL DEFAULT now(),
  "public" boolean NULL DEFAULT false,
  "avif_autodetection" boolean NULL DEFAULT false,
  "file_size_limit" bigint NULL,
  "allowed_mime_types" text[] NULL,
  "owner_id" text NULL,
  "type" "storage"."buckettype" NOT NULL DEFAULT 'STANDARD',
  PRIMARY KEY ("id")
);
-- Create index "bname" to table: "buckets"
CREATE UNIQUE INDEX "bname" ON "storage"."buckets" ("name");
-- Set comment to column: "owner" on table: "buckets"
COMMENT ON COLUMN "storage"."buckets"."owner" IS 'Field is deprecated, use owner_id instead';
-- Create "objects" table
CREATE TABLE "storage"."objects" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "bucket_id" text NULL,
  "name" text NULL,
  "owner" uuid NULL,
  "created_at" timestamptz NULL DEFAULT now(),
  "updated_at" timestamptz NULL DEFAULT now(),
  "last_accessed_at" timestamptz NULL DEFAULT now(),
  "metadata" jsonb NULL,
  "path_tokens" text[] NULL GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
  "version" text NULL,
  "owner_id" text NULL,
  "user_metadata" jsonb NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "bucketid_objname" to table: "objects"
CREATE UNIQUE INDEX "bucketid_objname" ON "storage"."objects" ("bucket_id", "name");
-- Create index "idx_objects_bucket_id_name" to table: "objects"
CREATE INDEX "idx_objects_bucket_id_name" ON "storage"."objects" ("bucket_id", "name");
-- Create index "idx_objects_bucket_id_name_lower" to table: "objects"
CREATE INDEX "idx_objects_bucket_id_name_lower" ON "storage"."objects" ("bucket_id", (lower(name)));
-- Create index "name_prefix_search" to table: "objects"
CREATE INDEX "name_prefix_search" ON "storage"."objects" ("name" text_pattern_ops);
-- Set comment to column: "owner" on table: "objects"
COMMENT ON COLUMN "storage"."objects"."owner" IS 'Field is deprecated, use owner_id instead';
-- Create "one_time_tokens" table
CREATE TABLE "auth"."one_time_tokens" (
  "id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "token_type" "auth"."one_time_token_type" NOT NULL,
  "token_hash" text NOT NULL,
  "relates_to" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "one_time_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "one_time_tokens_token_hash_check" CHECK (char_length(token_hash) > 0)
);
-- Create index "one_time_tokens_relates_to_hash_idx" to table: "one_time_tokens"
CREATE INDEX "one_time_tokens_relates_to_hash_idx" ON "auth"."one_time_tokens" USING HASH ("relates_to");
-- Create index "one_time_tokens_token_hash_hash_idx" to table: "one_time_tokens"
CREATE INDEX "one_time_tokens_token_hash_hash_idx" ON "auth"."one_time_tokens" USING HASH ("token_hash");
-- Create index "one_time_tokens_user_id_token_type_key" to table: "one_time_tokens"
CREATE UNIQUE INDEX "one_time_tokens_user_id_token_type_key" ON "auth"."one_time_tokens" ("user_id", "token_type");
-- Create "owner_documents" table
CREATE TABLE "public"."owner_documents" (
  "document_type" text NULL,
  "submission_date" date NULL,
  "notes" text NULL,
  "received_by" text NULL,
  "complaint" text NULL,
  "category" "public"."owner_documents_category_enum" NULL,
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NULL,
  "deleted_at" timestamptz NULL,
  "complaint_uuid" uuid NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "owner_documents_complaint_uuid_fkey" FOREIGN KEY ("complaint_uuid") REFERENCES "public"."complaints" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "idx_owner_docs_category" to table: "owner_documents"
CREATE INDEX "idx_owner_docs_category" ON "public"."owner_documents" ("category");
-- Create index "idx_owner_docs_complaint" to table: "owner_documents"
CREATE INDEX "idx_owner_docs_complaint" ON "public"."owner_documents" ("complaint");
-- Create index "idx_owner_docs_complaint_uuid" to table: "owner_documents"
CREATE INDEX "idx_owner_docs_complaint_uuid" ON "public"."owner_documents" ("complaint_uuid");
-- Create index "idx_owner_documents_complaint_uuid" to table: "owner_documents"
CREATE INDEX "idx_owner_documents_complaint_uuid" ON "public"."owner_documents" ("complaint_uuid", "submission_date") WHERE (deleted_at IS NULL);
-- Create "packet_generation_events" table
CREATE TABLE "public"."packet_generation_events" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "hearing_packet_id" uuid NULL,
  "complaint_uuid" uuid NULL,
  "event_type" text NOT NULL,
  "event_status" text NOT NULL,
  "event_message" text NULL,
  "event_data" jsonb NOT NULL DEFAULT '{}',
  "created_by" uuid NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "packet_generation_events_complaint_uuid_fkey" FOREIGN KEY ("complaint_uuid") REFERENCES "public"."complaints" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "packet_generation_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "packet_generation_events_hearing_packet_id_fkey" FOREIGN KEY ("hearing_packet_id") REFERENCES "public"."hearing_packets" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "packet_generation_events_event_status_check" CHECK (event_status = ANY (ARRAY['info'::text, 'success'::text, 'warning'::text, 'error'::text, 'blocked'::text]))
);
-- Create index "idx_packet_generation_events_complaint" to table: "packet_generation_events"
CREATE INDEX "idx_packet_generation_events_complaint" ON "public"."packet_generation_events" ("complaint_uuid", "created_at" DESC);
-- Create index "idx_packet_generation_events_packet" to table: "packet_generation_events"
CREATE INDEX "idx_packet_generation_events_packet" ON "public"."packet_generation_events" ("hearing_packet_id", "created_at" DESC);
-- Set comment to table: "packet_generation_events"
COMMENT ON TABLE "public"."packet_generation_events" IS 'Audit log of packet validation, generation, review, finalization, and submission events.';
-- Create "parsed_document_content" table
CREATE TABLE "public"."parsed_document_content" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "document_id" uuid NULL,
  "raw_text" text NULL,
  "structured_data" jsonb NULL,
  "tokens_used" integer NULL,
  "ai_model" text NULL,
  "processed_at" timestamptz NULL DEFAULT now(),
  "created_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "parsed_document_content_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Set comment to table: "parsed_document_content"
COMMENT ON TABLE "public"."parsed_document_content" IS 'Stored results of AI extraction and analysis to prevent redundant processing';
-- Create "refresh_tokens" table
CREATE TABLE "auth"."refresh_tokens" (
  "instance_id" uuid NULL,
  "id" bigserial NOT NULL,
  "token" character varying(255) NULL,
  "user_id" character varying(255) NULL,
  "revoked" boolean NULL,
  "created_at" timestamptz NULL,
  "updated_at" timestamptz NULL,
  "parent" character varying(255) NULL,
  "session_id" uuid NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "refresh_tokens_token_unique" UNIQUE ("token"),
  CONSTRAINT "refresh_tokens_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "auth"."sessions" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "refresh_tokens_instance_id_idx" to table: "refresh_tokens"
CREATE INDEX "refresh_tokens_instance_id_idx" ON "auth"."refresh_tokens" ("instance_id");
-- Create index "refresh_tokens_instance_id_user_id_idx" to table: "refresh_tokens"
CREATE INDEX "refresh_tokens_instance_id_user_id_idx" ON "auth"."refresh_tokens" ("instance_id", "user_id");
-- Create index "refresh_tokens_parent_idx" to table: "refresh_tokens"
CREATE INDEX "refresh_tokens_parent_idx" ON "auth"."refresh_tokens" ("parent");
-- Create index "refresh_tokens_session_id_revoked_idx" to table: "refresh_tokens"
CREATE INDEX "refresh_tokens_session_id_revoked_idx" ON "auth"."refresh_tokens" ("session_id", "revoked");
-- Create index "refresh_tokens_updated_at_idx" to table: "refresh_tokens"
CREATE INDEX "refresh_tokens_updated_at_idx" ON "auth"."refresh_tokens" ("updated_at" DESC);
-- Set comment to table: "refresh_tokens"
COMMENT ON TABLE "auth"."refresh_tokens" IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';
-- Create "regulatory_reference" table
CREATE TABLE "public"."regulatory_reference" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "violation_code" text NOT NULL,
  "short_title" text NOT NULL,
  "verbatim_text" text NOT NULL,
  "source_document_id" uuid NULL,
  "source_section" text NULL,
  "standard_corrective_action" text NULL,
  "is_active" boolean NULL DEFAULT true,
  "metadata" jsonb NULL DEFAULT '{}',
  "created_at" timestamptz NULL DEFAULT now(),
  "updated_at" timestamptz NULL DEFAULT now(),
  "fts" tsvector NULL GENERATED ALWAYS AS (to_tsvector('english'::regconfig, ((short_title || ' '::text) || verbatim_text))) STORED,
  PRIMARY KEY ("id"),
  CONSTRAINT "regulatory_reference_violation_code_key" UNIQUE ("violation_code"),
  CONSTRAINT "regulatory_reference_source_document_id_fkey" FOREIGN KEY ("source_document_id") REFERENCES "public"."documents" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "idx_regulatory_ref_code" to table: "regulatory_reference"
CREATE INDEX "idx_regulatory_ref_code" ON "public"."regulatory_reference" ("violation_code");
-- Create index "idx_regulatory_reference_fts" to table: "regulatory_reference"
CREATE INDEX "idx_regulatory_reference_fts" ON "public"."regulatory_reference" USING GIN ("fts");
-- Set comment to table: "regulatory_reference"
COMMENT ON TABLE "public"."regulatory_reference" IS 'Source of truth for pre-authorized legal language and standard corrective actions';
-- Create "s3_multipart_uploads" table
CREATE TABLE "storage"."s3_multipart_uploads" (
  "id" text NOT NULL,
  "in_progress_size" bigint NOT NULL DEFAULT 0,
  "upload_signature" text NOT NULL,
  "bucket_id" text NOT NULL,
  "key" text NOT NULL COLLATE "C",
  "version" text NOT NULL,
  "owner_id" text NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "user_metadata" jsonb NULL,
  "metadata" jsonb NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "s3_multipart_uploads_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "idx_multipart_uploads_list" to table: "s3_multipart_uploads"
CREATE INDEX "idx_multipart_uploads_list" ON "storage"."s3_multipart_uploads" ("bucket_id", "key", "created_at");
-- Create "s3_multipart_uploads_parts" table
CREATE TABLE "storage"."s3_multipart_uploads_parts" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "upload_id" text NOT NULL,
  "size" bigint NOT NULL DEFAULT 0,
  "part_number" integer NOT NULL,
  "bucket_id" text NOT NULL,
  "key" text NOT NULL COLLATE "C",
  "etag" text NOT NULL,
  "owner_id" text NULL,
  "version" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "s3_multipart_uploads_parts_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "s3_multipart_uploads_parts_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "storage"."s3_multipart_uploads" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create "sso_providers" table
CREATE TABLE "auth"."sso_providers" (
  "id" uuid NOT NULL,
  "resource_id" text NULL,
  "created_at" timestamptz NULL,
  "updated_at" timestamptz NULL,
  "disabled" boolean NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "resource_id not empty" CHECK ((resource_id = NULL::text) OR (char_length(resource_id) > 0))
);
-- Create index "sso_providers_resource_id_idx" to table: "sso_providers"
CREATE UNIQUE INDEX "sso_providers_resource_id_idx" ON "auth"."sso_providers" ((lower(resource_id)));
-- Create index "sso_providers_resource_id_pattern_idx" to table: "sso_providers"
CREATE INDEX "sso_providers_resource_id_pattern_idx" ON "auth"."sso_providers" ("resource_id" text_pattern_ops);
-- Set comment to table: "sso_providers"
COMMENT ON TABLE "auth"."sso_providers" IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';
-- Set comment to column: "resource_id" on table: "sso_providers"
COMMENT ON COLUMN "auth"."sso_providers"."resource_id" IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';
-- Create "saml_providers" table
CREATE TABLE "auth"."saml_providers" (
  "id" uuid NOT NULL,
  "sso_provider_id" uuid NOT NULL,
  "entity_id" text NOT NULL,
  "metadata_xml" text NOT NULL,
  "metadata_url" text NULL,
  "attribute_mapping" jsonb NULL,
  "created_at" timestamptz NULL,
  "updated_at" timestamptz NULL,
  "name_id_format" text NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "saml_providers_entity_id_key" UNIQUE ("entity_id"),
  CONSTRAINT "saml_providers_sso_provider_id_fkey" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "entity_id not empty" CHECK (char_length(entity_id) > 0),
  CONSTRAINT "metadata_url not empty" CHECK ((metadata_url = NULL::text) OR (char_length(metadata_url) > 0)),
  CONSTRAINT "metadata_xml not empty" CHECK (char_length(metadata_xml) > 0)
);
-- Create index "saml_providers_sso_provider_id_idx" to table: "saml_providers"
CREATE INDEX "saml_providers_sso_provider_id_idx" ON "auth"."saml_providers" ("sso_provider_id");
-- Set comment to table: "saml_providers"
COMMENT ON TABLE "auth"."saml_providers" IS 'Auth: Manages SAML Identity Provider connections.';
-- Create "flow_state" table
CREATE TABLE "auth"."flow_state" (
  "id" uuid NOT NULL,
  "user_id" uuid NULL,
  "auth_code" text NULL,
  "code_challenge_method" "auth"."code_challenge_method" NULL,
  "code_challenge" text NULL,
  "provider_type" text NOT NULL,
  "provider_access_token" text NULL,
  "provider_refresh_token" text NULL,
  "created_at" timestamptz NULL,
  "updated_at" timestamptz NULL,
  "authentication_method" text NOT NULL,
  "auth_code_issued_at" timestamptz NULL,
  "invite_token" text NULL,
  "referrer" text NULL,
  "oauth_client_state_id" uuid NULL,
  "linking_target_id" uuid NULL,
  "email_optional" boolean NOT NULL DEFAULT false,
  PRIMARY KEY ("id")
);
-- Create index "flow_state_created_at_idx" to table: "flow_state"
CREATE INDEX "flow_state_created_at_idx" ON "auth"."flow_state" ("created_at" DESC);
-- Create index "idx_auth_code" to table: "flow_state"
CREATE INDEX "idx_auth_code" ON "auth"."flow_state" ("auth_code");
-- Create index "idx_user_id_auth_method" to table: "flow_state"
CREATE INDEX "idx_user_id_auth_method" ON "auth"."flow_state" ("user_id", "authentication_method");
-- Set comment to table: "flow_state"
COMMENT ON TABLE "auth"."flow_state" IS 'Stores metadata for all OAuth/SSO login flows';
-- Create "saml_relay_states" table
CREATE TABLE "auth"."saml_relay_states" (
  "id" uuid NOT NULL,
  "sso_provider_id" uuid NOT NULL,
  "request_id" text NOT NULL,
  "for_email" text NULL,
  "redirect_to" text NULL,
  "created_at" timestamptz NULL,
  "updated_at" timestamptz NULL,
  "flow_state_id" uuid NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "saml_relay_states_flow_state_id_fkey" FOREIGN KEY ("flow_state_id") REFERENCES "auth"."flow_state" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "saml_relay_states_sso_provider_id_fkey" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "request_id not empty" CHECK (char_length(request_id) > 0)
);
-- Create index "saml_relay_states_created_at_idx" to table: "saml_relay_states"
CREATE INDEX "saml_relay_states_created_at_idx" ON "auth"."saml_relay_states" ("created_at" DESC);
-- Create index "saml_relay_states_for_email_idx" to table: "saml_relay_states"
CREATE INDEX "saml_relay_states_for_email_idx" ON "auth"."saml_relay_states" ("for_email");
-- Create index "saml_relay_states_sso_provider_id_idx" to table: "saml_relay_states"
CREATE INDEX "saml_relay_states_sso_provider_id_idx" ON "auth"."saml_relay_states" ("sso_provider_id");
-- Set comment to table: "saml_relay_states"
COMMENT ON TABLE "auth"."saml_relay_states" IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';
-- Create "service_log" table
CREATE TABLE "public"."service_log" (
  "notice_type" text NULL,
  "service_method" "public"."service_log_service_method_enum" NULL,
  "service_date" date NULL,
  "recipient" text NULL,
  "tracking_number" text NULL,
  "proof_of_service" boolean NULL,
  "notes" text NULL,
  "status" "public"."service_log_status_enum" NULL,
  "complaint" text NULL,
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NULL,
  "deleted_at" timestamptz NULL,
  "complaint_uuid" uuid NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "service_log_complaint_uuid_fkey" FOREIGN KEY ("complaint_uuid") REFERENCES "public"."complaints" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "idx_service_log_complaint" to table: "service_log"
CREATE INDEX "idx_service_log_complaint" ON "public"."service_log" ("complaint");
-- Create index "idx_service_log_complaint_uuid" to table: "service_log"
CREATE INDEX "idx_service_log_complaint_uuid" ON "public"."service_log" ("complaint_uuid");
-- Create index "idx_service_log_status" to table: "service_log"
CREATE INDEX "idx_service_log_status" ON "public"."service_log" ("status");
-- Create "sso_domains" table
CREATE TABLE "auth"."sso_domains" (
  "id" uuid NOT NULL,
  "sso_provider_id" uuid NOT NULL,
  "domain" text NOT NULL,
  "created_at" timestamptz NULL,
  "updated_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "sso_domains_sso_provider_id_fkey" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "domain not empty" CHECK (char_length(domain) > 0)
);
-- Create index "sso_domains_domain_idx" to table: "sso_domains"
CREATE UNIQUE INDEX "sso_domains_domain_idx" ON "auth"."sso_domains" ((lower(domain)));
-- Create index "sso_domains_sso_provider_id_idx" to table: "sso_domains"
CREATE INDEX "sso_domains_sso_provider_id_idx" ON "auth"."sso_domains" ("sso_provider_id");
-- Set comment to table: "sso_domains"
COMMENT ON TABLE "auth"."sso_domains" IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';
-- Create "buckets_vectors" table
CREATE TABLE "storage"."buckets_vectors" (
  "id" text NOT NULL,
  "type" "storage"."buckettype" NOT NULL DEFAULT 'VECTOR',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- Create "vector_indexes" table
CREATE TABLE "storage"."vector_indexes" (
  "id" text NOT NULL DEFAULT gen_random_uuid(),
  "name" text NOT NULL COLLATE "C",
  "bucket_id" text NOT NULL,
  "data_type" text NOT NULL,
  "dimension" integer NOT NULL,
  "distance_metric" text NOT NULL,
  "metadata_configuration" jsonb NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "vector_indexes_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets_vectors" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "vector_indexes_name_bucket_id_idx" to table: "vector_indexes"
CREATE UNIQUE INDEX "vector_indexes_name_bucket_id_idx" ON "storage"."vector_indexes" ("name", "bucket_id");
-- Create "violations" table
CREATE TABLE "public"."violations" (
  "violation_label" text NULL,
  "inspection" text NULL,
  "violation_code" text NULL,
  "category" text NULL,
  "location_in_property" text NULL,
  "corrective_action" text NULL,
  "due_date" date NULL,
  "responsible_party" "public"."violations_responsible_party_enum" NULL,
  "status" "public"."violations_status_enum" NULL,
  "complaint" text NULL,
  "deleted_at" timestamptz NULL,
  "observation" text NULL,
  "exhibit_refs" text NULL,
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "inspection_id" bigint NULL,
  "regulatory_reference_id" uuid NULL,
  "complaint_uuid" uuid NULL,
  "abatement_deadline_days" integer NULL DEFAULT 30,
  "exhibit_label" text NULL,
  "created_at" timestamptz NULL DEFAULT now(),
  "updated_at" timestamptz NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "violations_complaint_uuid_fkey" FOREIGN KEY ("complaint_uuid") REFERENCES "public"."complaints" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "violations_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "public"."inspections" ("inspection_id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "violations_regulatory_reference_id_fkey" FOREIGN KEY ("regulatory_reference_id") REFERENCES "public"."regulatory_reference" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "idx_violations_complaint" to table: "violations"
CREATE INDEX "idx_violations_complaint" ON "public"."violations" ("complaint");
-- Create index "idx_violations_complaint_uuid" to table: "violations"
CREATE INDEX "idx_violations_complaint_uuid" ON "public"."violations" ("complaint_uuid");
-- Create index "idx_violations_deleted_at" to table: "violations"
CREATE INDEX "idx_violations_deleted_at" ON "public"."violations" ("deleted_at");
-- Create index "idx_violations_inspection" to table: "violations"
CREATE INDEX "idx_violations_inspection" ON "public"."violations" ("inspection");
-- Create index "idx_violations_inspection_id" to table: "violations"
CREATE INDEX "idx_violations_inspection_id" ON "public"."violations" ("inspection_id");
-- Create index "idx_violations_reg_ref_id" to table: "violations"
CREATE INDEX "idx_violations_reg_ref_id" ON "public"."violations" ("regulatory_reference_id");
-- Create index "idx_violations_status" to table: "violations"
CREATE INDEX "idx_violations_status" ON "public"."violations" ("status");
-- Create "webauthn_challenges" table
CREATE TABLE "auth"."webauthn_challenges" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NULL,
  "challenge_type" text NOT NULL,
  "session_data" jsonb NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "expires_at" timestamptz NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "webauthn_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "webauthn_challenges_challenge_type_check" CHECK (challenge_type = ANY (ARRAY['signup'::text, 'registration'::text, 'authentication'::text]))
);
-- Create index "webauthn_challenges_expires_at_idx" to table: "webauthn_challenges"
CREATE INDEX "webauthn_challenges_expires_at_idx" ON "auth"."webauthn_challenges" ("expires_at");
-- Create index "webauthn_challenges_user_id_idx" to table: "webauthn_challenges"
CREATE INDEX "webauthn_challenges_user_id_idx" ON "auth"."webauthn_challenges" ("user_id");
-- Create "webauthn_credentials" table
CREATE TABLE "auth"."webauthn_credentials" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "credential_id" bytea NOT NULL,
  "public_key" bytea NOT NULL,
  "attestation_type" text NOT NULL DEFAULT '',
  "aaguid" uuid NULL,
  "sign_count" bigint NOT NULL DEFAULT 0,
  "transports" jsonb NOT NULL DEFAULT '[]',
  "backup_eligible" boolean NOT NULL DEFAULT false,
  "backed_up" boolean NOT NULL DEFAULT false,
  "friendly_name" text NOT NULL DEFAULT '',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "last_used_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "webauthn_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "webauthn_credentials_credential_id_key" to table: "webauthn_credentials"
CREATE UNIQUE INDEX "webauthn_credentials_credential_id_key" ON "auth"."webauthn_credentials" ("credential_id");
-- Create index "webauthn_credentials_user_id_idx" to table: "webauthn_credentials"
CREATE INDEX "webauthn_credentials_user_id_idx" ON "auth"."webauthn_credentials" ("user_id");
