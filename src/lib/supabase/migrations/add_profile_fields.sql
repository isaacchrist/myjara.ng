-- Add profile fields to public.users table if they don't exist

DO $$
BEGIN
    -- Add phone if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'phone') THEN
        ALTER TABLE public.users ADD COLUMN phone text;
    END IF;

    -- Add billing_address if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'billing_address') THEN
        ALTER TABLE public.users ADD COLUMN billing_address text;
    END IF;

    -- Add home_address if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'home_address') THEN
        ALTER TABLE public.users ADD COLUMN home_address text;
    END IF;
END $$;
