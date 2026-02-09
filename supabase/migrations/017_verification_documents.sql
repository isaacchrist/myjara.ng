-- Add verification document columns to stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS id_card_url TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS cac_url TEXT;
