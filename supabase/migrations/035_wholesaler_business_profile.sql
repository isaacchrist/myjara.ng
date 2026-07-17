-- Wholesaler registration was missing most of the business-legitimacy and
-- trading-profile data a real B2B onboarding needs -- the form only ever
-- collected a CAC document (no registration number/type), no tax ID, no
-- record of who signs for the business, no settlement info at signup, and
-- nothing about how the business actually trades (order minimums,
-- delivery capability, payment terms). users.rc_number/tax_id_number/
-- directors_info already exist (008_enhanced_kyc.sql) and are being wired
-- up by this pass; stores.bank_name/account_number/account_name already
-- exist (016) and are already the live settlement columns written by
-- profile.ts -- both are reused as-is here, no new columns needed for them.
--
-- Everything below is new: legal identity fields distinct from the
-- storefront name, an optional regulatory number for food/drug/cosmetic
-- sellers, and a trading profile (order volume, MOQ, delivery, payment
-- terms, catalog). SCUML and trade-reference collection were deliberately
-- left out of this pass -- SCUML only applies to a narrow set of
-- high-value goods categories this marketplace mostly doesn't carry, and
-- trade references need a repeatable name+contact sub-form that adds
-- meaningful form complexity for uncertain verification value. Revisit
-- either if it turns out to be needed.

ALTER TABLE stores ADD COLUMN IF NOT EXISTS legal_name TEXT; -- CAC-registered legal name, may differ from the storefront/trading name
ALTER TABLE stores ADD COLUMN IF NOT EXISTS registration_type TEXT CHECK (registration_type IN ('business_name', 'limited_company')); -- CAC Business Name (BN) vs full Limited Company (RC) -- changes what the registration number in users.rc_number actually is
ALTER TABLE stores ADD COLUMN IF NOT EXISTS nafdac_number TEXT; -- optional: only applicable to food/drug/cosmetic sellers, not validated against category

ALTER TABLE stores ADD COLUMN IF NOT EXISTS sales_model TEXT CHECK (sales_model IN ('b2b', 'b2c', 'both'));
ALTER TABLE stores ADD COLUMN IF NOT EXISTS expected_order_volume TEXT; -- bracket label, e.g. 'Under 50/mo', app-validated, not a DB enum (order-volume brackets are a UI/business concept, not a fixed domain)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS minimum_order_quantity TEXT; -- free-form ("50 units", "1 carton") rather than a bare integer -- MOQ is often unit-dependent
ALTER TABLE stores ADD COLUMN IF NOT EXISTS offers_delivery TEXT CHECK (offers_delivery IN ('delivery', 'pickup_only', 'both'));
ALTER TABLE stores ADD COLUMN IF NOT EXISTS delivery_coverage_area TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS payment_terms TEXT; -- e.g. 'COD', 'Net-30', 'Prepayment', 'Flexible' -- app-validated, not a DB enum, since terms phrasing may evolve
ALTER TABLE stores ADD COLUMN IF NOT EXISTS years_in_business INTEGER;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS catalog_url TEXT; -- optional product catalog / price list document
