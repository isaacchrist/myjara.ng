-- Phase 0.2: Fix disputes table for admin/store-owner access
--
-- disputes previously had no store_id column at all (the migration's own
-- comment called the admin/retailer policy a "placeholder"), so:
--   * seller/disputes/page.tsx filtered on a store_id column that didn't
--     exist -> always returned an error / empty result for store owners.
--   * There was no RLS path for a store owner to see disputes filed
--     against orders placed at their store.
--
-- Admin access itself does not need an RLS policy: the admin panel
-- authenticates via a separate signed cookie (src/app/actions/admin-auth.ts),
-- not a Supabase auth session, so auth.uid() is always null for the admin
-- panel. Admin pages must use the service-role client (which bypasses RLS
-- entirely) rather than rely on a policy here -- see the accompanying code
-- change to admin/disputes/page.tsx.

ALTER TABLE public.disputes
    ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id);

-- The wholesaler "Help Center" form (dashboard/help/page.tsx) files general
-- support tickets that aren't necessarily tied to a specific order -- make
-- order_id optional so those inserts stop failing on a NOT NULL violation.
ALTER TABLE public.disputes
    ALTER COLUMN order_id DROP NOT NULL;

-- Best-effort backfill for any existing rows: resolve store_id from the
-- order they reference, where order_id happens to be a valid UUID matching
-- a real order.
UPDATE public.disputes d
SET store_id = o.store_id
FROM public.orders o
WHERE d.store_id IS NULL
  AND d.order_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND o.id = d.order_id::uuid;

CREATE POLICY "Store owners can view disputes against their store"
    ON public.disputes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.stores s
            WHERE s.id = public.disputes.store_id
              AND s.owner_id = auth.uid()
        )
    );
