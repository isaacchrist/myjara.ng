-- =========================================
-- CRITICAL FIX: Type Casting for Enum Columns
-- The trigger was failing because it was inserting TEXT into ENUM columns
-- =========================================

-- 1. Drop and recreate the trigger function with proper type casting
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  is_brand boolean;
  is_retailer boolean;
  store_name text;
  store_slug text;
  user_role_value public.user_role;
BEGIN
  -- Determine role with proper enum casting
  user_role_value := COALESCE(
    (new.raw_user_meta_data->>'role')::public.user_role, 
    'customer'::public.user_role
  );

  -- Insert into public.users with proper type casting
  INSERT INTO public.users (id, email, full_name, role, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'),  -- Fallback for NOT NULL column
    user_role_value,
    new.raw_user_meta_data->>'avatar_url'
  );

  -- Check Role
  is_brand := (new.raw_user_meta_data->>'role' = 'brand_admin');
  is_retailer := (new.raw_user_meta_data->>'role' = 'retailer');

  -- Create Store Entry for retailers and brands
  IF is_brand OR is_retailer THEN
    
    IF is_brand THEN
       store_name := new.raw_user_meta_data->>'store_name';
       store_slug := new.raw_user_meta_data->>'store_slug';
    ELSE
       -- Retailer Fallback
       store_name := COALESCE(new.raw_user_meta_data->>'full_name', 'Retailer Store');
       store_slug := lower(regexp_replace(COALESCE(new.raw_user_meta_data->>'full_name', 'retailer'), '\s+', '-', 'g')) || '-' || substring(new.id::text from 1 for 4);
    END IF;

    INSERT INTO public.stores (
      owner_id, 
      name, 
      slug, 
      description, 
      status, 
      shop_type, 
      market_name, 
      latitude, 
      longitude
    )
    VALUES (
      new.id,
      store_name,
      COALESCE(store_slug, 'store-' || substring(new.id::text from 1 for 8)),
      COALESCE(new.raw_user_meta_data->>'store_description', 'Retailer Account'),
      'pending',
      CASE WHEN is_brand THEN 'brand' ELSE 'retailer' END,
      new.raw_user_meta_data->>'market_name',
      (new.raw_user_meta_data->>'latitude')::double precision,
      (new.raw_user_meta_data->>'longitude')::double precision
    );
  END IF;

  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block auth user creation
    RAISE WARNING 'handle_new_user trigger error: %', SQLERRM;
    RETURN new;
END;
$$;

-- 2. Re-bind trigger (in case function signature changed)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Verify the fix
SELECT 'Trigger function updated successfully!' as status;
