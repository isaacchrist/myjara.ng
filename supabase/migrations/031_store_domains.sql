-- Phase 2.2: custom domain connection.
-- store_domains has existed since 001_initial_schema.sql with RLS enabled
-- but zero policies attached, so nothing (not even the owning store) could
-- read or write it, and there was no way to prove domain ownership before
-- activating a hostname rewrite. This adds a verification token, owner CRUD
-- policies, and a narrow public-read policy limited to verified domains so
-- the anon-key edge middleware can resolve custom-domain hostnames to a
-- store without exposing pending/unverified domain attempts.

ALTER TABLE store_domains ADD COLUMN IF NOT EXISTS verification_token TEXT;

CREATE POLICY "Store owners can view own domains"
    ON store_domains FOR SELECT
    USING (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()));

CREATE POLICY "Store owners can add own domains"
    ON store_domains FOR INSERT
    WITH CHECK (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()));

CREATE POLICY "Store owners can update own domains"
    ON store_domains FOR UPDATE
    USING (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()));

CREATE POLICY "Store owners can delete own domains"
    ON store_domains FOR DELETE
    USING (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()));

CREATE POLICY "Verified domains are publicly readable"
    ON store_domains FOR SELECT
    USING (is_verified = true);
