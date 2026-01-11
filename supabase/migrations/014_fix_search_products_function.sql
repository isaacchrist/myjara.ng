-- Fix search_products function to properly handle city aggregation
-- This resolves server-side errors when using the search/explore page

DROP FUNCTION IF EXISTS search_products(TEXT, TEXT, UUID, DECIMAL, DECIMAL, INTEGER, INTEGER, INTEGER);

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
    SELECT 
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
        COALESCE(city_agg.cities, ARRAY[]::TEXT[]) AS cities
    FROM products p
    JOIN stores s ON p.store_id = s.id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true
    LEFT JOIN LATERAL (
        SELECT ARRAY_AGG(DISTINCT sl.city) AS cities
        FROM store_logistics sl
        WHERE sl.store_id = s.id AND sl.is_active = true
    ) city_agg ON true
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
    ORDER BY p.created_at DESC
    LIMIT page_limit
    OFFSET page_offset;
END;
$$ LANGUAGE plpgsql;
