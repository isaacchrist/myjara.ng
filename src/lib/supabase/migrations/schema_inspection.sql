-- =========================================
-- FULL DATABASE SCHEMA INSPECTION
-- Run each section separately in Supabase SQL Editor
-- =========================================

-- 1. LIST ALL TABLES in public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Check public.users table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- 3. Check public.stores table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'stores'
ORDER BY ordinal_position;

-- 4. Check if there are any RLS policies blocking inserts on public.users
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'users';

-- 5. Check if there are any RLS policies blocking inserts on public.stores
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'stores';

-- 6. Check if RLS is enabled on these tables
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname IN ('users', 'stores');

-- 7. Check for any existing triggers on auth.users
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' AND event_object_table = 'users';

-- 8. Test the handle_new_user function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';
