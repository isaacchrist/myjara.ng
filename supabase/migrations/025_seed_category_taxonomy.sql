-- Phase 1.1: seed the real subcategory rows (and 3 missing top-level
-- categories) that the app has been assuming exist since 014_subcategory_icons.sql,
-- but that no migration ever actually inserted -- `categories` only ever had
-- the 10 flat rows seeded by 001_initial_schema.sql, no children. That's why
-- register/retailer/category/page.tsx (which reads real categories+children)
-- has been showing zero subcategories, and why 014's icon UPDATEs are no-ops.
--
-- Source of truth for names/icons/slugs: PRODUCT_CATEGORIES in
-- src/lib/constants.ts, cross-checked against the slugs 014 already expects
-- (notably the 3-way 'accessories' collision across Fashion/Electronics/
-- Automotive, disambiguated there as accessories / accessories-tech /
-- car-accessories -- reused verbatim here so 014 lines up with real rows).
--
-- Idempotent: top-level INSERT uses ON CONFLICT (slug) DO NOTHING since 6 of
-- the 9 top-level slugs already exist from 001's seed (and may already be
-- referenced by stores.categories / products.category_id); subcategories are
-- looked up by parent slug so this runs the same regardless of which top
-- level rows pre-existed.

INSERT INTO categories (name, slug, icon, sort_order) VALUES
    ('Building & Construction', 'building-construction', '🏗️', 11),
    ('Agriculture & Farming', 'agriculture', '🌾', 12),
    ('Office & Stationery', 'office-supplies', '📎', 13)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (parent_id, name, slug, icon)
SELECT c.id, v.name, v.slug, v.icon
FROM categories c
JOIN (VALUES
    ('Cement & Concrete', 'cement', '🧱'),
    ('Blocks & Bricks', 'blocks', '🧱'),
    ('Iron Rods & Steel', 'rods', '🔩'),
    ('Roofing Materials', 'roofing', '🏠'),
    ('Plumbing & Pipes', 'plumbing', '🚰'),
    ('Electrical Supplies', 'electrical', '💡'),
    ('Tiles & Flooring', 'tiles', '🔲'),
    ('Paints & Finishes', 'paints', '🎨'),
    ('Doors & Windows', 'doors-windows', '🚪'),
    ('Tools & Hardware', 'hardware', '🔧')
) AS v(name, slug, icon) ON c.slug = 'building-construction'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (parent_id, name, slug, icon)
SELECT c.id, v.name, v.slug, v.icon
FROM categories c
JOIN (VALUES
    ('Rice, Beans & Grains', 'grains', '🍚'),
    ('Provisions & Essentials', 'provisions', '🛍️'),
    ('Fresh Produce', 'fresh-produce', '🥬'),
    ('Beverages & Drinks', 'beverages', '🥤'),
    ('Snacks & Confectionery', 'snacks', '🍪'),
    ('Cooking Oil & Seasonings', 'cooking-oil', '🫒'),
    ('Frozen Foods', 'frozen-foods', '🧊'),
    ('Dairy Products', 'dairy', '🥛')
) AS v(name, slug, icon) ON c.slug = 'food-groceries'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (parent_id, name, slug, icon)
SELECT c.id, v.name, v.slug, v.icon
FROM categories c
JOIN (VALUES
    ('Men''s Clothing', 'mens-clothing', '👔'),
    ('Women''s Clothing', 'womens-clothing', '👗'),
    ('Children''s Clothing', 'kids-clothing', '👶'),
    ('Shoes & Footwear', 'shoes', '👟'),
    ('Bags & Luggage', 'bags', '👜'),
    ('Accessories & Jewelry', 'accessories', '💍'),
    ('Fabrics & Textiles', 'fabrics', '🧵'),
    ('Traditional Wear', 'traditional', '🥻')
) AS v(name, slug, icon) ON c.slug = 'fashion'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (parent_id, name, slug, icon)
SELECT c.id, v.name, v.slug, v.icon
FROM categories c
JOIN (VALUES
    ('Mobile Phones & Tablets', 'phones', '📱'),
    ('Computers & Laptops', 'computers', '💻'),
    ('Phone & Computer Accessories', 'accessories-tech', '🎧'),
    ('Home Appliances', 'home-appliances', '🔌'),
    ('Kitchen Appliances', 'kitchen-appliances', '🍳'),
    ('Audio & Video Equipment', 'audio-video', '🔊'),
    ('Solar & Power Solutions', 'solar', '☀️')
) AS v(name, slug, icon) ON c.slug = 'electronics'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (parent_id, name, slug, icon)
SELECT c.id, v.name, v.slug, v.icon
FROM categories c
JOIN (VALUES
    ('Skincare & Cosmetics', 'skincare', '🧴'),
    ('Hair Care Products', 'haircare', '💇'),
    ('Pharmaceuticals & Medicine', 'pharmaceuticals', '💊'),
    ('Personal Care & Hygiene', 'personal-care', '🧼'),
    ('Fragrances & Perfumes', 'fragrances', '🌸'),
    ('Baby Care Products', 'baby-care', '🍼')
) AS v(name, slug, icon) ON c.slug = 'health-beauty'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (parent_id, name, slug, icon)
SELECT c.id, v.name, v.slug, v.icon
FROM categories c
JOIN (VALUES
    ('Furniture', 'furniture', '🛋️'),
    ('Kitchenware & Utensils', 'kitchenware', '🍽️'),
    ('Bedding & Linens', 'bedding', '🛏️'),
    ('Home Decor', 'decor', '🖼️'),
    ('Cleaning Supplies', 'cleaning', '🧹'),
    ('Garden & Outdoor', 'garden', '🌿'),
    ('Lighting & Fixtures', 'lighting', '💡')
) AS v(name, slug, icon) ON c.slug = 'home-garden'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (parent_id, name, slug, icon)
SELECT c.id, v.name, v.slug, v.icon
FROM categories c
JOIN (VALUES
    ('Spare Parts', 'spare-parts', '⚙️'),
    ('Tires & Tubes', 'tires', '🛞'),
    ('Oils & Lubricants', 'oils-lubricants', '🛢️'),
    ('Car Accessories', 'car-accessories', '🚙'),
    ('Batteries', 'batteries', '🔋')
) AS v(name, slug, icon) ON c.slug = 'automotive'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (parent_id, name, slug, icon)
SELECT c.id, v.name, v.slug, v.icon
FROM categories c
JOIN (VALUES
    ('Seeds & Seedlings', 'seeds', '🌱'),
    ('Fertilizers & Pesticides', 'fertilizers', '🧪'),
    ('Farm Tools & Equipment', 'farm-tools', '🚜'),
    ('Livestock Feed', 'livestock', '🐄'),
    ('Irrigation Supplies', 'irrigation', '💧')
) AS v(name, slug, icon) ON c.slug = 'agriculture'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (parent_id, name, slug, icon)
SELECT c.id, v.name, v.slug, v.icon
FROM categories c
JOIN (VALUES
    ('Stationery & Paper', 'stationery', '📝'),
    ('Office Furniture', 'office-furniture', '🪑'),
    ('Printing & Supplies', 'printing', '🖨️'),
    ('Office Electronics', 'office-electronics', '🖥️')
) AS v(name, slug, icon) ON c.slug = 'office-supplies'
ON CONFLICT (slug) DO NOTHING;
