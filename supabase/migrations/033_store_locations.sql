-- Phase 2.5: physical retailer multi-shop support.
-- "One store per owner" stays true (avoids fragmenting chat/orders/the
-- public storefront, which all key off a single stores.id) -- what changes
-- is that a store can now have multiple physical/market-day locations under
-- it, via this child table, generalizing the existing store_logistics
-- multi-row-per-store pattern rather than the abandoned multiple-stores-
-- rows-per-owner scaffold (src/lib/store-context.ts) that never shipped a
-- working "create a second store" flow.

-- Guard against the numbered-migration/ad-hoc-migration history gap
-- documented in supabase/migrations/README.md: these columns are assumed
-- by the backfill below, but which of the pre-021 migrations actually ran
-- against this specific database is unknown. All idempotent no-ops if the
-- column is already there.
ALTER TABLE stores ADD COLUMN IF NOT EXISTS shop_type TEXT DEFAULT 'physical';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS market_name TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS gallery_urls JSONB DEFAULT '[]'::jsonb;

CREATE TABLE store_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    phone TEXT,
    gallery_urls JSONB DEFAULT '[]'::jsonb,
    location_type TEXT NOT NULL DEFAULT 'physical' CHECK (location_type IN ('physical', 'market_day')),
    market_name TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE store_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active locations are publicly readable"
    ON store_locations FOR SELECT
    USING (is_active = true);

CREATE POLICY "Store owners can view own locations"
    ON store_locations FOR SELECT
    USING (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()));

CREATE POLICY "Store owners can add own locations"
    ON store_locations FOR INSERT
    WITH CHECK (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()));

CREATE POLICY "Store owners can update own locations"
    ON store_locations FOR UPDATE
    USING (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()));

CREATE POLICY "Store owners can delete own locations"
    ON store_locations FOR DELETE
    USING (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()));

-- Backfill one primary location per existing store from its denormalized
-- fields. Those fields (stores.market_name/latitude/longitude/phone/
-- gallery_urls) stay in place as the "primary location" for now -- every
-- read site that depends on them directly (storefront, seller dashboard,
-- profile edit) keeps working unchanged; new multi-location UI is additive.
INSERT INTO store_locations (store_id, name, latitude, longitude, phone, gallery_urls, location_type, market_name, is_primary, is_active)
SELECT
    id,
    name,
    latitude,
    longitude,
    phone,
    COALESCE(gallery_urls, '[]'::jsonb),
    CASE WHEN shop_type = 'market_day' THEN 'market_day' ELSE 'physical' END,
    market_name,
    true,
    true
FROM stores
WHERE NOT EXISTS (SELECT 1 FROM store_locations sl WHERE sl.store_id = stores.id);

-- Lets store_logistics (pickup/delivery config) attach to a specific
-- location instead of only to the store as a whole -- nullable so existing
-- rows (store-wide config) keep working unchanged.
ALTER TABLE store_logistics ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES store_locations(id) ON DELETE CASCADE;
