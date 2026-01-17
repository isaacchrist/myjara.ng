-- Trigger function to handle new user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  is_brand boolean;
  is_retailer boolean;
  store_name text;
  store_slug text;
begin
  -- 1. Insert into public.users
  insert into public.users (id, email, full_name, role, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'customer'),
    new.raw_user_meta_data->>'avatar_url'
  );

  -- 2. Check Role
  is_brand := (new.raw_user_meta_data->>'role' = 'brand_admin');
  is_retailer := (new.raw_user_meta_data->>'role' = 'retailer');

  -- 3. Create Store Entry if Wholesaler (brand_admin) or Retailer
  if is_brand or is_retailer then
    
    -- Determine Store Name/Slug
    if is_brand then
       store_name := new.raw_user_meta_data->>'store_name';
       store_slug := new.raw_user_meta_data->>'store_slug';
    else
       -- For Retailers, use Full Name as Store Name fallback if not provided
       store_name := new.raw_user_meta_data->>'full_name';
       -- Generate a rough slug from name + random or id snippet (for uniqueness)
       store_slug := lower(regexp_replace(new.raw_user_meta_data->>'full_name', '\s+', '-', 'g')) || '-' || substring(new.id::text from 1 for 4);
    end if;

    -- Insert into stores
    -- Note: We use 'pending' status by default for these roles
    insert into public.stores (owner_id, name, slug, description, status, shop_type)
    values (
      new.id,
      store_name,
      coalesce(store_slug, 'store-' || substring(new.id::text from 1 for 8)), -- Fallback slug
      coalesce(new.raw_user_meta_data->>'store_description', 'Retailer Account'),
      'pending',
      case when is_brand then 'brand' else 'retailer' end
    );
  end if;

  return new;
end;
$$;

-- Ensure the trigger exists
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
