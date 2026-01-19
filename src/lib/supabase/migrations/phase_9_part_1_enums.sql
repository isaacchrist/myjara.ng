-- Phase 9 Part 1: Enums
-- CRITICAL: Run this script FIRST.
-- This adds the necessary enum values. It must be committed before running Part 2.

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'super_admin';
