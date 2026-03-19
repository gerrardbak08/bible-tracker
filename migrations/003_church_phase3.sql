-- =============================================================
-- Migration: 003_church_phase3
-- Purpose: Weekly challenge + streak tracking
-- Run AFTER 002_church_phase2.sql
-- =============================================================

ALTER TABLE public.church_profiles
  ADD COLUMN IF NOT EXISTS streak_count        integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_completed_week date;

-- No new RLS needed:
-- The existing "church_profiles: own row" FOR ALL policy already
-- covers UPDATE on own row (id = auth.uid()), so streak updates
-- work without any additional policies.

-- VERIFICATION:
-- SELECT id, name, streak_count, last_completed_week
-- FROM church_profiles ORDER BY streak_count DESC LIMIT 10;
