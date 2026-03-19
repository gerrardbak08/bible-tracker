-- =============================================================
-- Migration: 002_church_phase2
-- Purpose: Duplicate prevention, admin role, verse management,
--          RLS hardening.
-- Run AFTER 001_church_tables.sql
-- =============================================================


-- ─────────────────────────────────────────────────────────────
-- 1. ALTER church_profiles — add new columns
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.church_profiles
  -- Identity stabilisation for duplicate detection
  ADD COLUMN IF NOT EXISTS birth_hint        text,
  ADD COLUMN IF NOT EXISTS device_fingerprint text,

  -- Role-based access control
  ADD COLUMN IF NOT EXISTS role              text NOT NULL DEFAULT 'member'
    CHECK (role IN ('member', 'admin')),

  -- Soft-link: duplicate profiles point to the canonical (original) profile
  ADD COLUMN IF NOT EXISTS canonical_id      uuid REFERENCES public.church_profiles(id)
    ON DELETE SET NULL;


-- ─────────────────────────────────────────────────────────────
-- 2. ALTER church_verses — add management flags
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.church_verses
  ADD COLUMN IF NOT EXISTS is_active    boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_key_verse boolean NOT NULL DEFAULT false;


-- ─────────────────────────────────────────────────────────────
-- 3. INDEXES
-- ─────────────────────────────────────────────────────────────

-- Fast duplicate lookup by identity triple
CREATE INDEX IF NOT EXISTS church_profiles_identity_idx
  ON public.church_profiles (name, affiliation, birth_hint)
  WHERE canonical_id IS NULL;  -- only original (canonical) profiles

-- Fast canonical link traversal
CREATE INDEX IF NOT EXISTS church_profiles_canonical_idx
  ON public.church_profiles (canonical_id)
  WHERE canonical_id IS NOT NULL;


-- ─────────────────────────────────────────────────────────────
-- 4. SECURITY DEFINER HELPER FUNCTIONS
--    These bypass RLS and are safe because they expose only
--    boolean results or UUIDs — no raw profile data.
-- ─────────────────────────────────────────────────────────────

-- Returns true if the current session belongs to an admin.
-- STABLE: result is consistent within a single query.
CREATE OR REPLACE FUNCTION public.is_church_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.church_profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

-- Returns the canonical user_id for the current session.
-- For regular users: their own id.
-- For duplicates: the canonical profile's id.
-- For unauthenticated: NULL.
CREATE OR REPLACE FUNCTION public.get_church_canonical_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(canonical_id, id)
  FROM public.church_profiles
  WHERE id = auth.uid();
$$;

-- Finds a canonical profile matching the registration identity triple.
-- Returns the profile id if found, NULL otherwise.
-- Used client-side during registration to detect duplicates.
CREATE OR REPLACE FUNCTION public.find_matching_church_profile(
  p_name        text,
  p_affiliation text,
  p_birth_hint  text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id
  FROM public.church_profiles
  WHERE name        = p_name
    AND affiliation = p_affiliation
    AND birth_hint  = p_birth_hint
    AND canonical_id IS NULL   -- only canonical, not other duplicates
  LIMIT 1;

  RETURN v_id;  -- NULL if not found
END;
$$;


-- ─────────────────────────────────────────────────────────────
-- 5. RLS — DROP OLD POLICIES, CREATE NEW ONES
-- ─────────────────────────────────────────────────────────────

-- ── church_profiles ─────────────────────────────────────────

-- Drop old blanket policy from migration 001
DROP POLICY IF EXISTS "church_profiles: own row only" ON public.church_profiles;

-- Policy A: Every user can manage their own row (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "church_profiles: own row"
  ON public.church_profiles
  FOR ALL
  USING  (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Policy B (SELECT only): Admins can read ALL profiles
--   Permissive policies combine with OR, so admins get SELECT on all rows
--   while the FOR ALL policy still restricts writes to own row.
CREATE POLICY "church_profiles: admin read all"
  ON public.church_profiles
  FOR SELECT
  USING (public.is_church_admin());


-- ── church_verses ────────────────────────────────────────────

-- No change to the existing "authenticated read" policy — it still works.
-- (Leaving it in place from migration 001.)


-- ── church_progress ──────────────────────────────────────────

-- Drop old policy from migration 001
DROP POLICY IF EXISTS "church_progress: own rows only" ON public.church_progress;

-- Policy A: Owner or canonical can modify progress (ALL = SELECT + write)
--   get_church_canonical_id() returns the canonical id for the current user,
--   so duplicates can read/write progress belonging to their canonical profile.
CREATE POLICY "church_progress: owner or canonical"
  ON public.church_progress
  FOR ALL
  USING  (user_id = public.get_church_canonical_id())
  WITH CHECK (user_id = public.get_church_canonical_id());

-- Policy B (SELECT only): Admins can read ALL progress rows
CREATE POLICY "church_progress: admin read all"
  ON public.church_progress
  FOR SELECT
  USING (public.is_church_admin());


-- ─────────────────────────────────────────────────────────────
-- 6. SET ADMIN (manual step — run for each admin user)
-- ─────────────────────────────────────────────────────────────
-- After a church administrator registers via the /church page,
-- promote them with:
--
--   UPDATE church_profiles
--   SET    role = 'admin'
--   WHERE  name = '관리자이름'
--     AND  affiliation = '부서명';
--
-- Only one person with DB access needs to run this once.


-- ─────────────────────────────────────────────────────────────
-- 7. OPTIONAL: mark key verses (update as needed)
-- ─────────────────────────────────────────────────────────────
-- Example — mark 롬8:28 and 롬8:38-39 as key verses:
-- UPDATE church_verses SET is_key_verse = true WHERE id IN (8, 9);


-- ─────────────────────────────────────────────────────────────
-- VERIFICATION QUERIES
-- ─────────────────────────────────────────────────────────────
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'church_profiles';
-- SELECT proname FROM pg_proc WHERE proname LIKE '%church%';
-- SELECT policyname, cmd FROM pg_policies WHERE tablename LIKE 'church_%';
