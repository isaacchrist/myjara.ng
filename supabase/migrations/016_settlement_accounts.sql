-- Add settlement account fields to stores table for payment processing
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS account_name TEXT;

-- Add comment for documentation
COMMENT ON COLUMN stores.bank_name IS 'Bank name for settlement payments';
COMMENT ON COLUMN stores.account_number IS 'Bank account number for settlement payments';
COMMENT ON COLUMN stores.account_name IS 'Account holder name for settlement payments';
