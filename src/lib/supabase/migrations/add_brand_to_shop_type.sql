-- Add 'brand' to shop_type enum if not exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shop_type') THEN
        BEGIN
            ALTER TYPE public.shop_type ADD VALUE 'brand';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;
