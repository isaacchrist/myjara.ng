-- ==========================================
-- DISPUTES (Help Center)
-- ==========================================

DO $$ BEGIN
    CREATE TYPE dispute_status AS ENUM ('open', 'resolved', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS disputes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    order_id uuid REFERENCES orders(id), -- Optional, linked to an order
    subject text NOT NULL,
    description text NOT NULL,
    status dispute_status DEFAULT 'open',
    admin_response text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- RLS: Users can see their own disputes
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own disputes" ON disputes;
CREATE POLICY "Users can view own disputes" ON disputes
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create disputes" ON disputes;
CREATE POLICY "Users can create disputes" ON disputes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Stores/Admins policies would go here (omitted for now as Admin accesses via Service Role usually)


-- ==========================================
-- MESSAGING (Inbox Enhancements)
-- ==========================================
-- We already have 'chat_rooms' and 'messages' from previous partial impl.
-- Let's ensure they are robust.

-- 1. Ensure chat_rooms has 'updated_at' for sorting inbox
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chat_rooms' AND column_name='updated_at') THEN
        ALTER TABLE chat_rooms ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
END $$;

-- 2. Ensure chat_rooms supports 'last_message_preview' for listing efficiency
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chat_rooms' AND column_name='last_message_content') THEN
        ALTER TABLE chat_rooms ADD COLUMN last_message_content text;
    END IF;
END $$;


-- 3. Trigger to update chat_room timestamp on new message
CREATE OR REPLACE FUNCTION update_chat_room_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_rooms
    SET updated_at = now(),
        last_message_content = NEW.content
    WHERE id = NEW.room_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_chat_room_on_message ON messages;

CREATE TRIGGER trigger_update_chat_room_on_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_chat_room_timestamp();


-- ==========================================
-- SUBSCRIPTIONS & PAYMENTS
-- ==========================================

-- 1. Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    plan_type text NOT NULL, -- 'basic', 'pro', 'exclusive'
    status text DEFAULT 'active', -- 'active', 'cancelled', 'expired'
    current_period_start timestamptz DEFAULT now(),
    current_period_end timestamptz,
    payment_method text, -- 'flutterwave', 'promo_code'
    flutterwave_ref text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- RLS for Subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
CREATE POLICY "Users can view own subscription" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- 2. Promo Codes Table
CREATE TABLE IF NOT EXISTS promo_codes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    code text UNIQUE NOT NULL,
    discount_percentage integer DEFAULT 100,
    valid_until timestamptz,
    max_uses integer,
    uses_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- RLS for Promo Codes (Public read for validation, strictly controlled write)
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can validate code" ON promo_codes;
CREATE POLICY "Anyone can validate code" ON promo_codes
    FOR SELECT USING (true); 

-- 3. Promo Code Usage Increment RPC
CREATE OR REPLACE FUNCTION increment_promo_usage(code_input text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE promo_codes
  SET uses_count = uses_count + 1
  WHERE code = code_input;
END;
$$;

-- 4. Seed Data: Default Promo Code
INSERT INTO promo_codes (code, discount_percentage, max_uses, valid_until)
VALUES ('MYJARA_LAUNCH', 100, 1000, now() + interval '1 year')
ON CONFLICT (code) DO NOTHING;
