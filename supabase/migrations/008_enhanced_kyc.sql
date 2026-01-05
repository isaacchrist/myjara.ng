-- Migration 008: Add Enhanced KYC Columns (Rigorous)

-- Add Business Verification Fields to Users
-- We will store strict business info on the user profile since they are the "Subject" of verification for now.
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS rc_number TEXT,
ADD COLUMN IF NOT EXISTS tax_id_number TEXT,
ADD COLUMN IF NOT EXISTS directors_info JSONB DEFAULT '[]', -- List of directors
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS account_name TEXT,
ADD COLUMN IF NOT EXISTS policy_accepted_at TIMESTAMPTZ;
