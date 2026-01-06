-- Create Enum for Shop Type
CREATE TYPE public.shop_type AS ENUM ('physical', 'online', 'market_day');
CREATE TYPE public.subscription_plan AS ENUM ('basic', 'pro', 'exclusive');
CREATE TYPE public.subscription_status AS ENUM ('active', 'paused', 'cancelled', 'expired');

-- Update Users Table
ALTER TABLE public.users 
ADD COLUMN shop_type public.shop_type,
ADD COLUMN market_days JSONB DEFAULT '[]'::jsonb, -- Array of strings e.g. ["Monday", "Tuesday"]
ADD COLUMN phone_number TEXT;

-- Create Subscriptions Table
CREATE TABLE public.subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    plan_type public.subscription_plan NOT NULL,
    status public.subscription_status DEFAULT 'active',
    current_period_start TIMESTAMPTZ DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL,
    payment_method TEXT DEFAULT 'flutterwave', -- or 'promo_code'
    flutterwave_ref TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Associate one active subscription per user usually, but history is good.
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- Create Promo Codes Table
CREATE TABLE public.promo_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount_percentage INT DEFAULT 100,
    max_uses INT DEFAULT 1,
    uses_count INT DEFAULT 0,
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Subscriptions: Users can view their own
CREATE POLICY "Users can view own subscriptions" 
ON public.subscriptions FOR SELECT 
USING (auth.uid() = user_id);

-- Subscriptions: Only Service Role/Admins can insert/update (handled via Server Actions usually)
-- But if we want direct writes from authenticated users (risky without triggers), sticking to Service Role for writes is safer for payments.
-- Let's allow users to read only.

-- Promo Codes: Public read (or auth read) to check validity? 
-- Better to check validity via a Secure RPC or Server Action to avoid scraping.
-- We will keep RLS strict: No public select.

-- RPC to increment usage
CREATE OR REPLACE FUNCTION increment_promo_usage(code_input TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.promo_codes
  SET uses_count = uses_count + 1
  WHERE code = code_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
