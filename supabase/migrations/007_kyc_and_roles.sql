-- Migration 007: KYC Profile Fields and Retailer Role

-- 1. Update user_role Enum (if supported, otherwise we might need a text check or just stick to 'customer' for retailer but tag them)
-- Supabase allows adding enum values.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'retailer';

-- 2. Create Verification Status Enum
CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'approved', 'rejected');

-- 3. Add KYC columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS residential_address TEXT,
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS has_physical_store BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS product_range TEXT[], -- Array of categories/product types
ADD COLUMN IF NOT EXISTS is_multi_category BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_status verification_status DEFAULT 'unverified';

-- 4. Update the Atomic Trigger to handle all this new data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role user_role;
  v_store_name TEXT;
  v_store_slug TEXT;
  v_store_desc TEXT;
BEGIN
  -- Extract Role
  v_role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer');

  -- 1. Create Public User Profile with KYC Data
  INSERT INTO public.users (
      id, 
      email, 
      full_name, 
      role,
      date_of_birth,
      residential_address,
      business_address,
      has_physical_store,
      product_range,
      is_multi_category,
      verification_status
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    v_role,
    (NEW.raw_user_meta_data->>'date_of_birth')::DATE,
    NEW.raw_user_meta_data->>'residential_address',
    NEW.raw_user_meta_data->>'business_address',
    (NEW.raw_user_meta_data->>'has_physical_store')::BOOLEAN,
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(NEW.raw_user_meta_data->'product_range', '[]'::jsonb))),
    (NEW.raw_user_meta_data->>'is_multi_category')::BOOLEAN,
    CASE WHEN v_role = 'brand_admin' THEN 'pending'::verification_status ELSE 'unverified'::verification_status END
  );

  -- 2. Create Store if Wholesaler (brand_admin) and metadata exists
  -- Retailers do NOT get a store.
  v_store_name := NEW.raw_user_meta_data->>'store_name';
  v_store_slug := NEW.raw_user_meta_data->>'store_slug';
  v_store_desc := NEW.raw_user_meta_data->>'store_description';

  IF v_role = 'brand_admin' AND v_store_name IS NOT NULL AND v_store_slug IS NOT NULL THEN
     INSERT INTO public.stores (owner_id, name, slug, description, status)
     VALUES (NEW.id, v_store_name, v_store_slug, v_store_desc, 'pending');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
