-- ==========================================
-- SEED DATA: Categories & Subcategories
-- ==========================================

DO $$
DECLARE
  -- Variable declarations for Parent Category IDs
  v_building_id uuid;
  v_food_id uuid;
  v_fashion_id uuid;
  v_electronics_id uuid;
  v_health_id uuid;
  v_home_id uuid;
  v_auto_id uuid;
  v_agri_id uuid;
  v_office_id uuid;
BEGIN
  -- 1. Building & Construction
  INSERT INTO categories (name, slug, icon, sort_order) 
  VALUES ('Building & Construction', 'building-construction', '🏗️', 10)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_building_id;

  INSERT INTO categories (parent_id, name, slug, sort_order) VALUES
  (v_building_id, 'Cement & Concrete', 'cement', 1),
  (v_building_id, 'Blocks & Bricks', 'blocks', 2),
  (v_building_id, 'Iron Rods & Steel', 'rods', 3),
  (v_building_id, 'Roofing Materials', 'roofing', 4),
  (v_building_id, 'Plumbing & Pipes', 'plumbing', 5),
  (v_building_id, 'Electrical Supplies', 'electrical', 6),
  (v_building_id, 'Tiles & Flooring', 'tiles', 7),
  (v_building_id, 'Paints & Finishes', 'paints', 8),
  (v_building_id, 'Doors & Windows', 'doors-windows', 9),
  (v_building_id, 'Tools & Hardware', 'hardware', 10)
  ON CONFLICT (slug) DO NOTHING;

  -- 2. Food & Groceries
  INSERT INTO categories (name, slug, icon, sort_order) 
  VALUES ('Food & Groceries', 'food-groceries', '🛒', 20)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_food_id;

  INSERT INTO categories (parent_id, name, slug, sort_order) VALUES
  (v_food_id, 'Rice, Beans & Grains', 'grains', 1),
  (v_food_id, 'Provisions & Essentials', 'provisions', 2),
  (v_food_id, 'Fresh Produce', 'fresh-produce', 3),
  (v_food_id, 'Beverages & Drinks', 'beverages', 4),
  (v_food_id, 'Snacks & Confectionery', 'snacks', 5),
  (v_food_id, 'Cooking Oil & Seasonings', 'cooking-oil', 6),
  (v_food_id, 'Frozen Foods', 'frozen-foods', 7),
  (v_food_id, 'Dairy Products', 'dairy', 8)
  ON CONFLICT (slug) DO NOTHING;

  -- 3. Fashion & Apparel
  INSERT INTO categories (name, slug, icon, sort_order) 
  VALUES ('Fashion & Apparel', 'fashion', '👗', 30)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_fashion_id;

  INSERT INTO categories (parent_id, name, slug, sort_order) VALUES
  (v_fashion_id, 'Men''s Clothing', 'mens-clothing', 1),
  (v_fashion_id, 'Women''s Clothing', 'womens-clothing', 2),
  (v_fashion_id, 'Children''s Clothing', 'kids-clothing', 3),
  (v_fashion_id, 'Shoes & Footwear', 'shoes', 4),
  (v_fashion_id, 'Bags & Luggage', 'bags', 5),
  (v_fashion_id, 'Accessories & Jewelry', 'accessories', 6),
  (v_fashion_id, 'Fabrics & Textiles', 'fabrics', 7),
  (v_fashion_id, 'Traditional Wear', 'traditional', 8)
  ON CONFLICT (slug) DO NOTHING;

  -- 4. Electronics & Gadgets
  INSERT INTO categories (name, slug, icon, sort_order) 
  VALUES ('Electronics & Gadgets', 'electronics', '📱', 40)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_electronics_id;

  INSERT INTO categories (parent_id, name, slug, sort_order) VALUES
  (v_electronics_id, 'Mobile Phones & Tablets', 'phones', 1),
  (v_electronics_id, 'Computers & Laptops', 'computers', 2),
  (v_electronics_id, 'Phone & Computer Accessories', 'accessories-tech', 3),
  (v_electronics_id, 'Home Appliances', 'home-appliances', 4),
  (v_electronics_id, 'Kitchen Appliances', 'kitchen-appliances', 5),
  (v_electronics_id, 'Audio & Video Equipment', 'audio-video', 6),
  (v_electronics_id, 'Solar & Power Solutions', 'solar', 7)
  ON CONFLICT (slug) DO NOTHING;

  -- 5. Health & Beauty
  INSERT INTO categories (name, slug, icon, sort_order) 
  VALUES ('Health & Beauty', 'health-beauty', '💄', 50)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_health_id;

  INSERT INTO categories (parent_id, name, slug, sort_order) VALUES
  (v_health_id, 'Skincare & Cosmetics', 'skincare', 1),
  (v_health_id, 'Hair Care Products', 'haircare', 2),
  (v_health_id, 'Pharmaceuticals & Medicine', 'pharmaceuticals', 3),
  (v_health_id, 'Personal Care & Hygiene', 'personal-care', 4),
  (v_health_id, 'Fragrances & Perfumes', 'fragrances', 5),
  (v_health_id, 'Baby Care Products', 'baby-care', 6)
  ON CONFLICT (slug) DO NOTHING;

  -- 6. Home & Garden
  INSERT INTO categories (name, slug, icon, sort_order) 
  VALUES ('Home & Garden', 'home-garden', '🏠', 60)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_home_id;

  INSERT INTO categories (parent_id, name, slug, sort_order) VALUES
  (v_home_id, 'Furniture', 'furniture', 1),
  (v_home_id, 'Kitchenware & Utensils', 'kitchenware', 2),
  (v_home_id, 'Bedding & Linens', 'bedding', 3),
  (v_home_id, 'Home Decor', 'decor', 4),
  (v_home_id, 'Cleaning Supplies', 'cleaning', 5),
  (v_home_id, 'Garden & Outdoor', 'garden', 6),
  (v_home_id, 'Lighting & Fixtures', 'lighting', 7)
  ON CONFLICT (slug) DO NOTHING;

  -- 7. Automotive
  INSERT INTO categories (name, slug, icon, sort_order) 
  VALUES ('Automotive & Parts', 'automotive', '🚗', 70)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_auto_id;

  INSERT INTO categories (parent_id, name, slug, sort_order) VALUES
  (v_auto_id, 'Spare Parts', 'spare-parts', 1),
  (v_auto_id, 'Tires & Tubes', 'tires', 2),
  (v_auto_id, 'Oils & Lubricants', 'oils-lubricants', 3),
  (v_auto_id, 'Car Accessories', 'car-accessories', 4),
  (v_auto_id, 'Batteries', 'batteries', 5)
  ON CONFLICT (slug) DO NOTHING;

  -- 8. Agriculture
  INSERT INTO categories (name, slug, icon, sort_order) 
  VALUES ('Agriculture & Farming', 'agriculture', '🌾', 80)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_agri_id;

  INSERT INTO categories (parent_id, name, slug, sort_order) VALUES
  (v_agri_id, 'Seeds & Seedlings', 'seeds', 1),
  (v_agri_id, 'Fertilizers & Pesticides', 'fertilizers', 2),
  (v_agri_id, 'Farm Tools & Equipment', 'farm-tools', 3),
  (v_agri_id, 'Livestock Feed', 'livestock', 4),
  (v_agri_id, 'Irrigation Supplies', 'irrigation', 5)
  ON CONFLICT (slug) DO NOTHING;

  -- 9. Office
  INSERT INTO categories (name, slug, icon, sort_order) 
  VALUES ('Office & Stationery', 'office-supplies', '📎', 90)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_office_id;

  INSERT INTO categories (parent_id, name, slug, sort_order) VALUES
  (v_office_id, 'Stationery & Paper', 'stationery', 1),
  (v_office_id, 'Office Furniture', 'office-furniture', 2),
  (v_office_id, 'Printing & Supplies', 'printing', 3),
  (v_office_id, 'Office Electronics', 'office-electronics', 4)
  ON CONFLICT (slug) DO NOTHING;

END $$;
