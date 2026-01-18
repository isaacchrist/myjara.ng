-- =========================================
-- DIAGNOSTIC TOOL
-- =========================================

CREATE OR REPLACE FUNCTION public.diagnose_registration_issues()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'stores_columns', (
      SELECT jsonb_agg(jsonb_build_object('column', column_name, 'type', data_type, 'udt', udt_name))
      FROM information_schema.columns 
      WHERE table_name = 'stores'
    ),
    'enum_shop_type', (
      SELECT jsonb_agg(e.enumlabel)
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'shop_type'
    ),
    'triggers', (
      SELECT jsonb_agg(trigger_name)
      FROM information_schema.triggers
      WHERE event_object_table = 'users' AND trigger_schema = 'auth'
    ),
    'recent_logs', (
      -- We can't access internal Postgres logs, but we can check if we have any 'brand' or 'retailer' in stores
      SELECT jsonb_agg(row_to_json(s)) FROM (SELECT id, name, shop_type, status FROM public.stores ORDER BY created_at DESC LIMIT 5) s
    ),
    'recent_users', (
       SELECT jsonb_agg(row_to_json(u)) FROM (SELECT id, role, created_at FROM public.users ORDER BY created_at DESC LIMIT 5) u
    )
  ) INTO result;

  RETURN result;
END;
$$;
