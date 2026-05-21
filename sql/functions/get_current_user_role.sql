-- Helper for RLS policies: safe role check (SECURITY DEFINER avoids RLS recursion).
-- Created by migration 001c.

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role::text FROM public.users WHERE id = auth.uid();
$$;
