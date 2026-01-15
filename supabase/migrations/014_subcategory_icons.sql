-- ==========================================
-- UPDATE: Subcategory Icons
-- Run this in Supabase SQL Editor
-- ==========================================

-- Building & Construction subcategories
UPDATE categories SET icon = '🧱' WHERE slug = 'cement';
UPDATE categories SET icon = '🧱' WHERE slug = 'blocks';
UPDATE categories SET icon = '🔩' WHERE slug = 'rods';
UPDATE categories SET icon = '🏠' WHERE slug = 'roofing';
UPDATE categories SET icon = '🚰' WHERE slug = 'plumbing';
UPDATE categories SET icon = '💡' WHERE slug = 'electrical';
UPDATE categories SET icon = '🔲' WHERE slug = 'tiles';
UPDATE categories SET icon = '🎨' WHERE slug = 'paints';
UPDATE categories SET icon = '🚪' WHERE slug = 'doors-windows';
UPDATE categories SET icon = '🔧' WHERE slug = 'hardware';

-- Food & Groceries subcategories
UPDATE categories SET icon = '🍚' WHERE slug = 'grains';
UPDATE categories SET icon = '🛍️' WHERE slug = 'provisions';
UPDATE categories SET icon = '🥬' WHERE slug = 'fresh-produce';
UPDATE categories SET icon = '🥤' WHERE slug = 'beverages';
UPDATE categories SET icon = '🍪' WHERE slug = 'snacks';
UPDATE categories SET icon = '🫒' WHERE slug = 'cooking-oil';
UPDATE categories SET icon = '🧊' WHERE slug = 'frozen-foods';
UPDATE categories SET icon = '🥛' WHERE slug = 'dairy';

-- Fashion & Apparel subcategories
UPDATE categories SET icon = '👔' WHERE slug = 'mens-clothing';
UPDATE categories SET icon = '👗' WHERE slug = 'womens-clothing';
UPDATE categories SET icon = '👶' WHERE slug = 'kids-clothing';
UPDATE categories SET icon = '👟' WHERE slug = 'shoes';
UPDATE categories SET icon = '👜' WHERE slug = 'bags';
UPDATE categories SET icon = '💍' WHERE slug = 'accessories';
UPDATE categories SET icon = '🧵' WHERE slug = 'fabrics';
UPDATE categories SET icon = '🥻' WHERE slug = 'traditional';

-- Electronics & Gadgets subcategories
UPDATE categories SET icon = '📱' WHERE slug = 'phones';
UPDATE categories SET icon = '💻' WHERE slug = 'computers';
UPDATE categories SET icon = '🎧' WHERE slug = 'accessories-tech';
UPDATE categories SET icon = '🔌' WHERE slug = 'home-appliances';
UPDATE categories SET icon = '🍳' WHERE slug = 'kitchen-appliances';
UPDATE categories SET icon = '🔊' WHERE slug = 'audio-video';
UPDATE categories SET icon = '☀️' WHERE slug = 'solar';

-- Health & Beauty subcategories
UPDATE categories SET icon = '🧴' WHERE slug = 'skincare';
UPDATE categories SET icon = '💇' WHERE slug = 'haircare';
UPDATE categories SET icon = '💊' WHERE slug = 'pharmaceuticals';
UPDATE categories SET icon = '🧼' WHERE slug = 'personal-care';
UPDATE categories SET icon = '🌸' WHERE slug = 'fragrances';
UPDATE categories SET icon = '🍼' WHERE slug = 'baby-care';

-- Home & Garden subcategories
UPDATE categories SET icon = '🛋️' WHERE slug = 'furniture';
UPDATE categories SET icon = '🍽️' WHERE slug = 'kitchenware';
UPDATE categories SET icon = '🛏️' WHERE slug = 'bedding';
UPDATE categories SET icon = '🖼️' WHERE slug = 'decor';
UPDATE categories SET icon = '🧹' WHERE slug = 'cleaning';
UPDATE categories SET icon = '🌿' WHERE slug = 'garden';
UPDATE categories SET icon = '💡' WHERE slug = 'lighting';

-- Automotive subcategories
UPDATE categories SET icon = '⚙️' WHERE slug = 'spare-parts';
UPDATE categories SET icon = '🛞' WHERE slug = 'tires';
UPDATE categories SET icon = '🛢️' WHERE slug = 'oils-lubricants';
UPDATE categories SET icon = '🚙' WHERE slug = 'car-accessories';
UPDATE categories SET icon = '🔋' WHERE slug = 'batteries';

-- Agriculture subcategories
UPDATE categories SET icon = '🌱' WHERE slug = 'seeds';
UPDATE categories SET icon = '🧪' WHERE slug = 'fertilizers';
UPDATE categories SET icon = '🚜' WHERE slug = 'farm-tools';
UPDATE categories SET icon = '🐄' WHERE slug = 'livestock';
UPDATE categories SET icon = '💧' WHERE slug = 'irrigation';

-- Office subcategories
UPDATE categories SET icon = '📝' WHERE slug = 'stationery';
UPDATE categories SET icon = '🪑' WHERE slug = 'office-furniture';
UPDATE categories SET icon = '🖨️' WHERE slug = 'printing';
UPDATE categories SET icon = '🖥️' WHERE slug = 'office-electronics';
