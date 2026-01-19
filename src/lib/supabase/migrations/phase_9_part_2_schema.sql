-- Phase 9 Part 2: Schema & Data Integrity
-- CRITICAL: Run this script SECOND, only AFTER Part 1 is successfully run.

-- 1. Add missing profile fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS sex TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS residential_address TEXT,
ADD COLUMN IF NOT EXISTS emergency_contacts JSONB DEFAULT '[]'::jsonb;

-- 2. Enforce Unique Phone Number
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_phone_key') THEN
        ALTER TABLE public.users ADD CONSTRAINT users_phone_key UNIQUE (phone);
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN others THEN null;
END $$;

-- 3. Feature Recommendations System
CREATE TABLE IF NOT EXISTS public.feature_recommendations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS on recommendations
ALTER TABLE public.feature_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create recommendations" ON public.feature_recommendations;
CREATE POLICY "Users can create recommendations" ON public.feature_recommendations
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own recommendations" ON public.feature_recommendations;
CREATE POLICY "Users can view own recommendations" ON public.feature_recommendations
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- This policy uses the new 'admin' enum value, which requires Part 1 to be committed first.
DROP POLICY IF EXISTS "Admins can view all recommendations" ON public.feature_recommendations;
CREATE POLICY "Admins can view all recommendations" ON public.feature_recommendations
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

-- 5. Add Profile Picture column if missing
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 6. Add "Jara" specific fields to products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS jara_is_same BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS jara_name TEXT,
ADD COLUMN IF NOT EXISTS jara_description TEXT,
ADD COLUMN IF NOT EXISTS jara_image_url TEXT,
ADD COLUMN IF NOT EXISTS jara_amount INTEGER DEFAULT 1;
