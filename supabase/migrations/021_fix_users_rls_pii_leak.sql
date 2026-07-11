-- Phase 0.1: Fix PII exposure on public.users
--
-- The original policy ("Public can view basic user info", 001_initial_schema.sql)
-- was USING (true) on SELECT -- i.e. any anon or authenticated API caller could
-- read every column of every user row. Later migrations (007/008_kyc, and the
-- ad-hoc phase_9_part_2_schema.sql) added sensitive columns directly onto this
-- table -- date_of_birth, residential_address, business_address, bank_name,
-- account_number, account_name, rc_number, tax_id_number, directors_info,
-- emergency_contacts -- without ever narrowing that policy. Anyone with the
-- anon key could read all of it for every user via a direct REST call.
--
-- This migration replaces the blanket policy with:
--   1. Full self-access (a user can always read their own row).
--   2. Narrow, relationship-scoped access for the two legitimate cross-user
--      cases already relied on elsewhere in the app: chat participants
--      (src/app/actions/chat.ts, seller/messages) and order counterparts
--      (seller/orders, seller/disputes, brand dashboard orders) -- both of
--      which only ever SELECT full_name/email/avatar_url/phone in app code,
--      never the sensitive KYC/financial columns above.
--   3. No public/anonymous policy at all. The one page that previously
--      depended on public read access (the storefront at /store/[slug],
--      showing the owner's avatar/phone/name/email to anonymous visitors)
--      is changed in the same change-set to use the service-role admin
--      client instead, since it's a server component and never exposes
--      that key to the browser.
--
-- Residual risk / follow-up: RLS is row-level, not column-level, so a
-- malicious chat/order counterpart could in principle craft a raw REST call
-- requesting the sensitive columns on a row they can now see. That's a
-- vastly smaller blast radius than "anyone on the internet" (today's bug),
-- but the durable fix is to move the KYC/financial columns into a separate
-- table with self-only RLS. Tracked as Phase 1 follow-up, not done here to
-- avoid a larger, riskier schema migration in an emergency security patch.

DROP POLICY IF EXISTS "Public can view basic user info" ON public.users;

CREATE POLICY "Users can view own full profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Chat participants can view each other"
    ON public.users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_rooms cr
            JOIN public.stores s ON s.id = cr.store_id
            WHERE (cr.user_id = public.users.id AND s.owner_id = auth.uid())
               OR (s.owner_id = public.users.id AND cr.user_id = auth.uid())
        )
    );

CREATE POLICY "Order counterparts can view each other"
    ON public.users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.stores s ON s.id = o.store_id
            WHERE (o.user_id = public.users.id AND s.owner_id = auth.uid())
               OR (s.owner_id = public.users.id AND o.user_id = auth.uid())
        )
    );
