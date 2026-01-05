-- Migration 008: Enhanced KYC and Policy Acceptance

-- 1. Add Business Verification Fields to Users (or Stores)
-- We will store strict business info on the user profile since they are the "Subject" of verification for now.
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS rc_number TEXT,
ADD COLUMN IF NOT EXISTS tax_id_number TEXT,
ADD COLUMN IF NOT EXISTS directors_info JSONB DEFAULT '[]', -- List of directors
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS account_name TEXT,
ADD COLUMN IF NOT EXISTS policy_accepted_at TIMESTAMPTZ;

-- 2. Update handle_new_user to ingest this extra data
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

  -- 1. Create Public User Profile with Enhanced KYC Data
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
      verification_status,
      -- New Fields
      rc_number,
      tax_id_number,
      bank_name,
      account_number,
      account_name,
      policy_accepted_at
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
    CASE WHEN v_role = 'brand_admin' THEN 'pending'::verification_status ELSE 'unverified'::verification_status END,
    -- New Values
    NEW.raw_user_meta_data->>'rc_number',
    NEW.raw_user_meta_data->>'tax_id_number',
    NEW.raw_user_meta_data->>'bank_name',
    NEW.raw_user_meta_data->>'account_number',
    NEW.raw_user_meta_data->>'account_name',
    (NEW.raw_user_meta_data->>'policy_accepted_at')::TIMESTAMPTZ
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
