-- Phase 2.3: admin-editable subscription plan pricing.
-- Prices/tiers were hardcoded in src/lib/constants.ts (SUBSCRIPTION_PLANS,
-- WHOLESALER_PLANS), shared flat across all retailer shop types. This moves
-- them into a real table so admins can edit prices/features per shop_type
-- from the admin dashboard, and so retailer plans can actually differ by
-- shop_type (physical/online/market_day) as intended.

CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_type TEXT NOT NULL CHECK (shop_type IN ('physical', 'online', 'market_day', 'brand')),
    plan_key TEXT NOT NULL,
    name TEXT NOT NULL,
    price INTEGER NOT NULL DEFAULT 0,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (shop_type, plan_key)
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Public read for active plans (subscription pages and registration need
-- this without an admin session). Writes are service-role only, gated by
-- getAdminSession() in src/app/actions/plans.ts -- same pattern as
-- notifications (migration 030).
CREATE POLICY "Active plans are publicly readable"
    ON subscription_plans FOR SELECT
    USING (is_active = true);

-- Seed data preserves the exact prices previously hardcoded in
-- src/lib/constants.ts so this migration is a pure refactor, not a pricing
-- change -- physical/online/market_day start identical and can be
-- differentiated later from the admin dashboard.
INSERT INTO subscription_plans (shop_type, plan_key, name, price, features, sort_order) VALUES
    ('physical', 'basic', 'Basic Plan', 2000, '["Standard Search", "Access to Market Days", "Basic Support"]', 1),
    ('physical', 'pro', 'Pro Plan', 5000, '["Priority Search", "Advanced Analytics", "Email Support", "Jara Deal Alerts"]', 2),
    ('physical', 'exclusive', 'Exclusive Plan', 7500, '["Top Visibility", "Dedicated Manager", "Premium Jara Offers", "Instant Notifications"]', 3),
    ('online', 'basic', 'Basic Plan', 2000, '["Standard Search", "Access to Market Days", "Basic Support"]', 1),
    ('online', 'pro', 'Pro Plan', 5000, '["Priority Search", "Advanced Analytics", "Email Support", "Jara Deal Alerts"]', 2),
    ('online', 'exclusive', 'Exclusive Plan', 7500, '["Top Visibility", "Dedicated Manager", "Premium Jara Offers", "Instant Notifications"]', 3),
    ('market_day', 'basic', 'Basic Plan', 2000, '["Standard Search", "Access to Market Days", "Basic Support"]', 1),
    ('market_day', 'pro', 'Pro Plan', 5000, '["Priority Search", "Advanced Analytics", "Email Support", "Jara Deal Alerts"]', 2),
    ('market_day', 'exclusive', 'Exclusive Plan', 7500, '["Top Visibility", "Dedicated Manager", "Premium Jara Offers", "Instant Notifications"]', 3),
    ('brand', 'supplier_basic', 'Supplier Basic', 15000, '["List up to 50 Products", "Verify 2 Retailers", "Basic Analytics"]', 1),
    ('brand', 'supplier_pro', 'Supplier Pro', 45000, '["Unlimited Products", "Unlimited Retailers", "Advanced Market Trends", "Priority Support"]', 2)
ON CONFLICT (shop_type, plan_key) DO NOTHING;
