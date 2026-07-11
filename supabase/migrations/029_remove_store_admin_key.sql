-- Phase 2.1: close the dormant admin_access_key auth-bypass path.
--
-- stores.admin_access_key (010_admin_access_keys.sql) was a per-store secret
-- that logged straight into that store's /dashboard with no real user/
-- password, AND doubled as an HTTP-header bypass on client_contacts RLS
-- (013_client_phone_collection.sql: `admin_access_key = current_setting(
-- 'request.headers')::json->>'x-admin-key'`). Nothing in the app ever set
-- this column, so it's been an armed-but-unused backdoor rather than a
-- working feature. Global admin auth is being tightened separately (real
-- platform_admin accounts alongside the existing master ADMIN_SECRET_KEY,
-- see src/app/actions/admin-auth.ts) -- neither needs this column, and it
-- should never have doubled as a way into an individual tenant's dashboard.
--
-- Rewrite the two policies to drop the header-bypass clause before dropping
-- the column (Postgres won't allow DROP COLUMN while a policy depends on it).

DROP POLICY IF EXISTS "Stores can insert contacts" ON public.client_contacts;
CREATE POLICY "Stores can insert contacts" ON public.client_contacts
    FOR INSERT WITH CHECK (
        store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
    );

DROP POLICY IF EXISTS "Stores can view their own contacts" ON public.client_contacts;
CREATE POLICY "Stores can view their own contacts" ON public.client_contacts
    FOR SELECT USING (
        store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
    );

ALTER TABLE public.stores DROP COLUMN IF EXISTS admin_access_key;
