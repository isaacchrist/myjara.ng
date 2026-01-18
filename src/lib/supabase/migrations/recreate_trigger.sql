-- =========================================
-- CRITICAL FIX: Recreate Registration Trigger
-- =========================================

-- 1. DROP the existing trigger to clear any broken states
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Make sure the function exists and logs verbosely (Just in case)
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
  meta_shop_type text;
BEGIN
  -- LOG START (Verbose)
  INSERT INTO public.error_logs (process_name, error_message, error_detail, payload)
  VALUES ('handle_new_user_start', 'Trigger Started', 'INFO', to_jsonb(new));

  -- Determine role
  user_role_value := COALESCE(
    (new.raw_user_meta_data->>'role')::public.user_role, 
    'customer'::public.user_role
  );

  -- Insert into public.users
  INSERT INTO public.users (id, email, full_name, role, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
    user_role_value,
    new.raw_user_meta_data->>'avatar_url'
  );

  -- Check Flags
  is_brand := (new.raw_user_meta_data->>'role' = 'brand_admin');
  is_retailer := (new.raw_user_meta_data->>'role' = 'retailer');

  -- Log Decision
  INSERT INTO public.error_logs (process_name, error_message, error_detail, payload)
  VALUES ('handle_new_user_logic', 'Role Check', 'Is Retailer? ' || is_retailer::text, to_jsonb(new.raw_user_meta_data));

  IF is_brand OR is_retailer THEN
    
    -- Extract shop_type
    meta_shop_type := COALESCE(new.raw_user_meta_data->>'shop_type', CASE WHEN is_brand THEN 'brand' ELSE 'retailer' END);

    IF is_brand THEN
       store_name := new.raw_user_meta_data->>'store_name';
       store_slug := new.raw_user_meta_data->>'store_slug';
    ELSE
       store_name := COALESCE(new.raw_user_meta_data->>'business_name', new.raw_user_meta_data->>'full_name', 'Retailer Store');
       store_slug := lower(regexp_replace(COALESCE(new.raw_user_meta_data->>'business_name', new.raw_user_meta_data->>'full_name', 'retailer'), '\s+', '-', 'g')) || '-' || substring(new.id::text from 1 for 4);
    END IF;

    -- Insert Store
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
      meta_shop_type, 
      new.raw_user_meta_data->>'market_name',
      (new.raw_user_meta_data->>'latitude')::double precision,
      (new.raw_user_meta_data->>'longitude')::double precision
    );
    
    INSERT INTO public.error_logs (process_name, error_message, error_detail, payload)
    VALUES ('handle_new_user_success', 'Store Created', 'SUCCESS', to_jsonb(new));

  ELSE
     INSERT INTO public.error_logs (process_name, error_message, error_detail, payload)
     VALUES ('handle_new_user_skip', 'Skipped Store Creation', 'Details', jsonb_build_object('reason', 'Role mismatch', 'role', new.raw_user_meta_data->>'role'));
  END IF;

  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO public.error_logs (process_name, error_message, error_detail, payload)
    VALUES ('handle_new_user_error', SQLERRM, SQLSTATE, to_jsonb(new));
    RETURN new;
END;
$$;

-- 3. CREATE the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
