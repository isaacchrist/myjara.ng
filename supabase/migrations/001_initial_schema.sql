-- MyJara Database Schema
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('customer', 'brand_admin', 'platform_admin');
CREATE TYPE store_status AS ENUM ('pending', 'active', 'suspended');
CREATE TYPE product_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE logistics_type AS ENUM ('pickup', 'delivery');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE transaction_status AS ENUM ('pending', 'success', 'failed');
CREATE TYPE message_sender_type AS ENUM ('customer', 'brand');

-- ============================================
-- TABLES
-- ============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    full_name TEXT NOT NULL,
    role user_role DEFAULT 'customer',
    avatar_url TEXT,
    addresses JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stores table
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    banner_url TEXT,
    description TEXT,
    flutterwave_subaccount_id TEXT,
    settings JSONB DEFAULT '{}',
    status store_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store domains for subdomain/custom domain mapping
CREATE TABLE store_domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    domain TEXT UNIQUE NOT NULL,
    type TEXT DEFAULT 'subdomain' CHECK (type IN ('subdomain', 'custom')),
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(12, 2) NOT NULL CHECK (price >= 0),
    jara_buy_quantity INTEGER DEFAULT 1 CHECK (jara_buy_quantity > 0),
    jara_get_quantity INTEGER DEFAULT 0 CHECK (jara_get_quantity >= 0),
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    attributes JSONB DEFAULT '{}',
    status product_status DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product images
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store logistics (pickup points and delivery zones)
CREATE TABLE store_logistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    type logistics_type NOT NULL,
    location_name TEXT NOT NULL,
    city TEXT NOT NULL,
    delivery_fee DECIMAL(10, 2) DEFAULT 0 CHECK (delivery_fee >= 0),
    delivery_timeline TEXT,
    coverage_zones JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    order_number TEXT UNIQUE NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL CHECK (subtotal >= 0),
    logistics_fee DECIMAL(10, 2) DEFAULT 0 CHECK (logistics_fee >= 0),
    total DECIMAL(12, 2) NOT NULL CHECK (total >= 0),
    status order_status DEFAULT 'pending',
    logistics_option_id UUID REFERENCES store_logistics(id),
    delivery_address JSONB,
    flutterwave_tx_ref TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    jara_quantity INTEGER DEFAULT 0 CHECK (jara_quantity >= 0),
    unit_price DECIMAL(12, 2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(12, 2) NOT NULL CHECK (total_price >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    flutterwave_tx_id TEXT,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    status transaction_status DEFAULT 'pending',
    gateway_response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat conversations
CREATE TABLE chat_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, store_id)
);

-- Chat messages
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    sender_type message_sender_type NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Stores
CREATE INDEX idx_stores_owner ON stores(owner_id);
CREATE INDEX idx_stores_slug ON stores(slug);
CREATE INDEX idx_stores_status ON stores(status);

-- Products
CREATE INDEX idx_products_store ON products(store_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_name_search ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Store logistics
CREATE INDEX idx_store_logistics_store ON store_logistics(store_id);
CREATE INDEX idx_store_logistics_city ON store_logistics(city);
CREATE INDEX idx_store_logistics_type ON store_logistics(type);

-- Orders
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_store ON orders(store_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- Chat
CREATE INDEX idx_chat_conversations_user ON chat_conversations(user_id);
CREATE INDEX idx_chat_conversations_store ON chat_conversations(store_id);
CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_logistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Public can view basic user info"
    ON users FOR SELECT
    USING (true);

-- Stores policies
CREATE POLICY "Anyone can view active stores"
    ON stores FOR SELECT
    USING (status = 'active');

CREATE POLICY "Store owners can view own store"
    ON stores FOR SELECT
    USING (owner_id = auth.uid());

CREATE POLICY "Store owners can update own store"
    ON stores FOR UPDATE
    USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create stores"
    ON stores FOR INSERT
    WITH CHECK (owner_id = auth.uid());

-- Categories policies (public read)
CREATE POLICY "Anyone can view categories"
    ON categories FOR SELECT
    USING (true);

-- Products policies
CREATE POLICY "Anyone can view active products"
    ON products FOR SELECT
    USING (status = 'active');

CREATE POLICY "Store owners can manage own products"
    ON products FOR ALL
    USING (
        store_id IN (
            SELECT id FROM stores WHERE owner_id = auth.uid()
        )
    );

-- Product images policies
CREATE POLICY "Anyone can view product images"
    ON product_images FOR SELECT
    USING (true);

CREATE POLICY "Store owners can manage product images"
    ON product_images FOR ALL
    USING (
        product_id IN (
            SELECT p.id FROM products p
            JOIN stores s ON p.store_id = s.id
            WHERE s.owner_id = auth.uid()
        )
    );

-- Store logistics policies
CREATE POLICY "Anyone can view active logistics"
    ON store_logistics FOR SELECT
    USING (is_active = true);

CREATE POLICY "Store owners can manage logistics"
    ON store_logistics FOR ALL
    USING (
        store_id IN (
            SELECT id FROM stores WHERE owner_id = auth.uid()
        )
    );

-- Orders policies
CREATE POLICY "Users can view own orders"
    ON orders FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Store owners can view store orders"
    ON orders FOR SELECT
    USING (
        store_id IN (
            SELECT id FROM stores WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can create orders"
    ON orders FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Store owners can update order status"
    ON orders FOR UPDATE
    USING (
        store_id IN (
            SELECT id FROM stores WHERE owner_id = auth.uid()
        )
    );

-- Order items policies
CREATE POLICY "Users can view own order items"
    ON order_items FOR SELECT
    USING (
        order_id IN (
            SELECT id FROM orders WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Store owners can view order items"
    ON order_items FOR SELECT
    USING (
        order_id IN (
            SELECT o.id FROM orders o
            JOIN stores s ON o.store_id = s.id
            WHERE s.owner_id = auth.uid()
        )
    );

-- Transactions policies
CREATE POLICY "Users can view own transactions"
    ON transactions FOR SELECT
    USING (
        order_id IN (
            SELECT id FROM orders WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Store owners can view store transactions"
    ON transactions FOR SELECT
    USING (
        store_id IN (
            SELECT id FROM stores WHERE owner_id = auth.uid()
        )
    );

-- Chat policies
CREATE POLICY "Users can view own conversations"
    ON chat_conversations FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Store owners can view store conversations"
    ON chat_conversations FOR SELECT
    USING (
        store_id IN (
            SELECT id FROM stores WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can create conversations"
    ON chat_conversations FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Participants can view messages"
    ON chat_messages FOR SELECT
    USING (
        conversation_id IN (
            SELECT id FROM chat_conversations
            WHERE user_id = auth.uid()
            OR store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
        )
    );

CREATE POLICY "Participants can send messages"
    ON chat_messages FOR INSERT
    WITH CHECK (
        conversation_id IN (
            SELECT id FROM chat_conversations
            WHERE user_id = auth.uid()
            OR store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
        )
    );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_stores_updated_at
    BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Product search function
CREATE OR REPLACE FUNCTION search_products(
    search_query TEXT DEFAULT NULL,
    filter_city TEXT DEFAULT NULL,
    filter_category_id UUID DEFAULT NULL,
    filter_min_price DECIMAL DEFAULT NULL,
    filter_max_price DECIMAL DEFAULT NULL,
    filter_min_jara INTEGER DEFAULT NULL,
    page_limit INTEGER DEFAULT 20,
    page_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    price DECIMAL,
    jara_buy_quantity INTEGER,
    jara_get_quantity INTEGER,
    store_id UUID,
    store_name TEXT,
    store_slug TEXT,
    store_logo_url TEXT,
    category_id UUID,
    category_name TEXT,
    primary_image_url TEXT,
    cities TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (p.id)
        p.id,
        p.name,
        p.description,
        p.price,
        p.jara_buy_quantity,
        p.jara_get_quantity,
        s.id AS store_id,
        s.name AS store_name,
        s.slug AS store_slug,
        s.logo_url AS store_logo_url,
        c.id AS category_id,
        c.name AS category_name,
        pi.url AS primary_image_url,
        ARRAY_AGG(DISTINCT sl.city) FILTER (WHERE sl.city IS NOT NULL) AS cities
    FROM products p
    JOIN stores s ON p.store_id = s.id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true
    LEFT JOIN store_logistics sl ON sl.store_id = s.id AND sl.is_active = true
    WHERE p.status = 'active'
        AND s.status = 'active'
        AND (search_query IS NULL OR to_tsvector('english', p.name || ' ' || COALESCE(p.description, '')) @@ plainto_tsquery('english', search_query))
        AND (filter_category_id IS NULL OR p.category_id = filter_category_id)
        AND (filter_min_price IS NULL OR p.price >= filter_min_price)
        AND (filter_max_price IS NULL OR p.price <= filter_max_price)
        AND (filter_min_jara IS NULL OR p.jara_get_quantity >= filter_min_jara)
        AND (filter_city IS NULL OR EXISTS (
            SELECT 1 FROM store_logistics sl2 
            WHERE sl2.store_id = s.id 
            AND sl2.city ILIKE filter_city 
            AND sl2.is_active = true
        ))
    GROUP BY p.id, p.name, p.description, p.price, p.jara_buy_quantity, p.jara_get_quantity,
             s.id, s.name, s.slug, s.logo_url, c.id, c.name, pi.url
    ORDER BY p.id, p.created_at DESC
    LIMIT page_limit
    OFFSET page_offset;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEED DATA (Categories)
-- ============================================

INSERT INTO categories (name, slug, icon, sort_order) VALUES
('Electronics', 'electronics', '📱', 1),
('Fashion', 'fashion', '👕', 2),
('Food & Groceries', 'food-groceries', '🍎', 3),
('Health & Beauty', 'health-beauty', '💄', 4),
('Home & Garden', 'home-garden', '🏠', 5),
('Sports & Outdoors', 'sports-outdoors', '⚽', 6),
('Books & Media', 'books-media', '📚', 7),
('Automotive', 'automotive', '🚗', 8),
('Baby & Kids', 'baby-kids', '👶', 9),
('Services', 'services', '🔧', 10);
