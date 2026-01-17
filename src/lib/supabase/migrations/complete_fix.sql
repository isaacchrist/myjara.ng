-- =========================================
-- MASTER FIX FOR MYJARA
-- =========================================

-- 1. FIX AUTH TRIGGER (Account/Store Creation)
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
  -- Insert into public.users
  insert into public.users (id, email, full_name, role, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'customer'),
    new.raw_user_meta_data->>'avatar_url'
  );

  -- Check Role
  is_brand := (new.raw_user_meta_data->>'role' = 'brand_admin');
  is_retailer := (new.raw_user_meta_data->>'role' = 'retailer');

  -- Create Store Entry if Wholesaler (brand_admin) or Retailer
  if is_brand or is_retailer then
    
    if is_brand then
       store_name := new.raw_user_meta_data->>'store_name';
       store_slug := new.raw_user_meta_data->>'store_slug';
    else
       -- For Retailers, use Full Name as Store Name fallback
       store_name := new.raw_user_meta_data->>'full_name';
       store_slug := lower(regexp_replace(new.raw_user_meta_data->>'full_name', '\s+', '-', 'g')) || '-' || substring(new.id::text from 1 for 4);
    end if;

    insert into public.stores (owner_id, name, slug, description, status, shop_type)
    values (
      new.id,
      store_name,
      coalesce(store_slug, 'store-' || substring(new.id::text from 1 for 8)),
      coalesce(new.raw_user_meta_data->>'store_description', 'Retailer Account'),
      'pending',
      case when is_brand then 'brand' else 'retailer' end
    );
  end if;

  return new;
end;
$$;

-- Re-bind trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. FIX STORAGE POLICIES (Profile Picture Uploads)
-- Ensure 'uploads' bucket exists (idempotent insert)
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

-- Allow Public Insert (for registration uploads)
-- Note: This allows unauthenticated users to upload images.
create policy "Allow Public Uploads"
on storage.objects for insert
with check ( bucket_id = 'uploads' );

-- Allow Public Read
create policy "Allow Public Read"
on storage.objects for select
using ( bucket_id = 'uploads' );


-- 3. FIX ANALYTICS RPC (Sales by Location)
create or replace function get_sales_by_location(
  target_category_id uuid,
  is_parent_category boolean
)
returns table (
  location_name text,
  total_sales numeric,
  order_count bigint
)
language plpgsql
security definer
as $$
begin
  return query
  select
    sl.city as location_name,
    sum(oi.total_price) as total_sales,
    count(distinct o.id) as order_count
  from order_items oi
  join orders o on o.id = oi.order_id
  join products p on p.id = oi.product_id
  join categories c on c.id = p.category_id
  left join store_logistics sl on sl.id = o.logistics_option_id
  where
    o.status = 'completed'
    and (
      (is_parent_category = true and (c.id = target_category_id or c.parent_id = target_category_id))
      OR
      (is_parent_category = false and c.id = target_category_id)
      OR
      (target_category_id is null) -- Handle 'all' case if passed as null
    )
    and sl.city is not null
  group by 1
  order by 2 desc;
end;
$$;
