-- =========================================
-- DIAGNOSTIC CHECK: Debug Registration Issues
-- Run this in Supabase SQL Editor to diagnose
-- =========================================

-- 1. Check if trigger exists
SELECT 
    trigger_name, 
    event_manipulation, 
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 2. Check recent auth.users (last 10)
SELECT 
    id, 
    email, 
    created_at,
    raw_user_meta_data->>'role' as role,
    raw_user_meta_data->>'full_name' as full_name
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Check public.users table
SELECT id, email, full_name, role, created_at 
FROM public.users 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. Check public.stores with pending status
SELECT 
    id, 
    name, 
    owner_id, 
    status, 
    shop_type,
    latitude,
    longitude,
    market_name,
    created_at
FROM public.stores 
WHERE status = 'pending'
ORDER BY created_at DESC;

-- 5. Check ALL stores (any status)
SELECT 
    id, 
    name, 
    owner_id, 
    status, 
    created_at
FROM public.stores 
ORDER BY created_at DESC 
LIMIT 10;

-- 6. Check if stores table has required columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'stores' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. Check if users table has required columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 8. Check for any errors in pg_stat_activity (active queries)
SELECT pid, state, query, query_start
FROM pg_stat_activity 
WHERE state = 'active';
