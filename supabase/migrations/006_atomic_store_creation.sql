-- Migration 006: Atomic Store Creation Trigger
-- Redefine handle_new_user to create store automatically if metadata is present

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_store_name TEXT;
  v_store_slug TEXT;
  v_store_desc TEXT;
BEGIN
  -- 1. Create Public User Profile
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer')
  );

  -- 2. Create Store if Brand Admin and metadata exists
  v_store_name := NEW.raw_user_meta_data->>'store_name';
  v_store_slug := NEW.raw_user_meta_data->>'store_slug';
  v_store_desc := NEW.raw_user_meta_data->>'store_description';

  -- Only attempt store creation if we have the minimum required data (name and slug)
  -- and the role is correct.
  IF (NEW.raw_user_meta_data->>'role') = 'brand_admin' AND v_store_name IS NOT NULL AND v_store_slug IS NOT NULL THEN
     INSERT INTO public.stores (owner_id, name, slug, description, status)
     VALUES (NEW.id, v_store_name, v_store_slug, v_store_desc, 'pending');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
