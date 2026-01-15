-- ==========================================
-- PHASE 2: Schema Updates
-- Run in Supabase SQL Editor
-- ==========================================

-- 1. Add cause column to disputes
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS cause text;

-- 2. Add profile_picture_url to stores
ALTER TABLE stores ADD COLUMN IF NOT EXISTS profile_picture_url text;

-- 3. Add shop_type to stores (if not exists)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS shop_type text DEFAULT 'physical';

-- 4. Add phone to stores (if not exists)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS phone text;

-- 5. Add is_seed to products for dummy data tracking
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_seed boolean DEFAULT false;

-- Optional: Create trigger to delete seed products when real product is added
CREATE OR REPLACE FUNCTION delete_seed_products_on_real_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- If the new product is NOT a seed product, delete all seed products
    IF NEW.is_seed = false OR NEW.is_seed IS NULL THEN
        DELETE FROM products WHERE is_seed = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger
DROP TRIGGER IF EXISTS trigger_delete_seed_products ON products;
CREATE TRIGGER trigger_delete_seed_products
    AFTER INSERT ON products
    FOR EACH ROW
    EXECUTE FUNCTION delete_seed_products_on_real_insert();
