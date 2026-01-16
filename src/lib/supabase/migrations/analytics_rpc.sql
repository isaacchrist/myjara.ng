-- RPC to get sales volume by location for a specific category
-- Usage: select * from get_sales_by_location('category_uuid', true/false);

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
    o.status = 'completed' -- Only completed orders
    and (
      -- If parent category, match any product whose category's parent is the target
      (is_parent_category = true and (c.id = target_category_id or c.parent_id = target_category_id))
      OR
      -- If subcategory, match exact category id
      (is_parent_category = false and c.id = target_category_id)
    )
    and sl.city is not null
  group by 1
  order by 2 desc;
end;
$$;
