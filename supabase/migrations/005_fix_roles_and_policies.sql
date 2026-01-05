-- Migration 005: Fix User Role Trigger and Store Policies

-- 1. Update handle_new_user to correctly assign role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure RLS allows brand_admin to create their store
-- The existing policy checks "owner_id = auth.uid()", which is good.
-- But we'll add a specific check for safety if needed, or rely on the existing one.
-- Existing: CREATE POLICY "Authenticated users can create stores" ... WITH CHECK (owner_id = auth.uid());
-- This is sufficient IF the user is authenticated.

-- 3. If you previously had users created with incorrect roles, you might want to fix them:
-- UPDATE users SET role = 'brand_admin' WHERE email LIKE '%@brand.com'; -- Example (commented out)
