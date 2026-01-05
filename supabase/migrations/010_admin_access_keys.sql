-- Migration 010: Admin Access Keys
-- Add support for key-based authentication for stores.

ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS admin_access_key TEXT UNIQUE;

-- We also want to ensure this key is private and not exposed in public reads
-- (Assuming RLS is set up, but let's be safe - typically this column shouldn't be selected by public)

COMMENT ON COLUMN public.stores.admin_access_key IS 'Secret key for direct admin access to this store dashboard';
