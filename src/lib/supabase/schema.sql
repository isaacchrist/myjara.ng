-- ==========================================
-- 1. Analytics Optimization (O(N) -> O(log N))
-- ==========================================
create or replace function get_daily_revenue(
  store_id_input uuid,
  start_date timestamp with time zone
)
returns table (
  day text,
  revenue numeric,
  order_count bigint
)
language plpgsql
security definer
as $$
begin
  return query
  select
    to_char(created_at, 'Mon DD') as day,
    coalesce(sum(total), 0) as revenue,
    count(id) as order_count
  from orders
  where 
    store_id = store_id_input 
    and created_at >= start_date
    and status != 'cancelled' -- Exclude cancelled orders
  group by 1
  order by min(created_at);
end;
$$;

-- ==========================================
-- 2. Payment & Inventory Atomicity
-- ==========================================
create or replace function process_order_payment(
  p_order_id uuid,
  p_tx_ref text,
  p_gateway_res jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_order record;
  v_item record;
  v_new_stock int;
begin
  -- 1. Lock Order Row to prevent race conditions
  select * into v_order from orders where id = p_order_id for update;
  
  if not found then
    return jsonb_build_object('success', false, 'error', 'Order not found');
  end if;

  if v_order.status = 'paid' then
    return jsonb_build_object('success', true, 'message', 'Order already paid');
  end if;

  -- 2. Update Order Status
  update orders 
  set 
    status = 'paid',
    flutterwave_tx_ref = p_tx_ref,
    updated_at = now()
  where id = p_order_id;

  -- 3. Decrement Inventory (The Critical Step)
  for v_item in select * from order_items where order_id = p_order_id loop
    -- Check if stock is sufficient (Optional: We might allow negative stock for backorders, but let's be safe)
    update products
    set stock_quantity = stock_quantity - v_item.quantity
    where id = v_item.product_id;
  end loop;

  -- 4. Record Transaction
  insert into transactions (order_id, store_id, flutterwave_tx_id, amount, status, gateway_response)
  values (
    p_order_id, 
    v_order.store_id, 
    p_tx_ref, 
    v_order.total, 
    'success', 
    p_gateway_res
  );

  return jsonb_build_object('success', true);
exception when others then
  return jsonb_build_object('success', false, 'error', SQLERRM);
end;
$$;
