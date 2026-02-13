-- Add gallery_urls column to stores table for store pictures
ALTER TABLE stores ADD COLUMN IF NOT EXISTS gallery_urls JSONB DEFAULT '[]';
