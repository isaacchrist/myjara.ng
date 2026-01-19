-- Add missing columns to stores table for registration data persistence

-- 1. Create Enums if they don't exist
DO $$ BEGIN
    CREATE TYPE subscription_plan_type AS ENUM ('basic', 'pro', 'exclusive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status_type AS ENUM ('active', 'expired', 'pending', 'trial');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add columns to stores table
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS subscription_plan subscription_plan_type DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS subscription_expiry TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_status payment_status_type DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS categories JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS frequent_markets JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS pickup_location JSONB;

-- 3. Add index for performance (optional but good practice)
CREATE INDEX IF NOT EXISTS idx_stores_subscription_plan ON stores(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_stores_payment_status ON stores(payment_status);

-- 4. Comment on columns
COMMENT ON COLUMN stores.categories IS 'Array of selected category IDs or names';
COMMENT ON COLUMN stores.frequent_markets IS 'Array of market names where the retailer frequents (for market_day type)';
