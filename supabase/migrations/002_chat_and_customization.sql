-- Migration 002: Add Chat Context and Store Customization

-- ============================================
-- 1. CHAT UPDATES
-- ============================================

-- Add product_id to chat_conversations to link chats to specific products
ALTER TABLE chat_conversations 
ADD COLUMN product_id UUID REFERENCES products(id) ON DELETE SET NULL;

-- Drop the old unique constraint (one chat per user-store)
ALTER TABLE chat_conversations 
DROP CONSTRAINT IF EXISTS chat_conversations_user_id_store_id_key;

-- Create new unique indexes to allow:
-- 1. One "General" chat per user/store (where product_id is NULL)
-- 2. One "Product" chat per user/store/product (where product_id is NOT NULL)

CREATE UNIQUE INDEX idx_chat_conversations_unique_general 
ON chat_conversations(user_id, store_id) 
WHERE product_id IS NULL;

CREATE UNIQUE INDEX idx_chat_conversations_unique_product 
ON chat_conversations(user_id, store_id, product_id) 
WHERE product_id IS NOT NULL;


-- ============================================
-- 2. STORE CUSTOMIZATION UPDATES
-- ============================================

-- No schema change needed for table columns as we use `settings` JSONB.
-- But we can define the expected structure of settings for documentation/types.

-- settings = {
--   "theme": {
--     "primaryColor": "#10b981",
--     "layout": "grid" | "list" | "featured"
--   }
-- }

-- ============================================
-- 3. UPDATED POLICIES
-- ============================================

-- No changes needed to policies yet, simply owning the conversation row grants access.
