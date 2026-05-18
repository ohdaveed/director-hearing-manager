-- =============================================================================
-- Migration 003a: Fix missing INSERT RLS policy on users table
-- =============================================================================
--
-- Problem: When a new user signs in, AuthContext.tsx auto-creates a profile
-- row in public.users. Migration 001c only created SELECT/UPDATE policies
-- on users, so the profile insert fails silently. This means the user row
-- never exists, and the complaints INSERT policy (which requires the user
-- to exist in public.users) always returns 403 (code 42501).
--
-- Fix: Add an INSERT policy allowing users to create their own profile.

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());
