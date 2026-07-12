-- Admin-editable Privacy Policy / Terms of Service content.
--
-- /terms and /privacy have been dead links since registration was built
-- (register/page.tsx links to them, nothing renders there) -- actual legal
-- copy isn't something to fabricate, so this ships the admin tooling to
-- create/edit it instead: one row per (doc_type, audience) pair, where
-- audience lets a role-specific version (e.g. wholesaler-specific data
-- terms) override the 'global' fallback that everyone else sees.

CREATE TABLE legal_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doc_type TEXT NOT NULL CHECK (doc_type IN ('privacy', 'terms')),
    audience TEXT NOT NULL DEFAULT 'global' CHECK (audience IN ('global', 'customer', 'retailer', 'brand_admin')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (doc_type, audience)
);

ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Legal documents are publicly readable"
    ON legal_documents FOR SELECT
    USING (true);

-- No INSERT/UPDATE/DELETE policy: writes only ever go through the admin
-- server actions, which use the service-role client and bypass RLS.

-- Seed placeholder rows so /terms and /privacy render something instead of
-- 404ing, with an explicit marker that the real legal copy still needs to
-- be written by the site owner via /admin/legal.
INSERT INTO legal_documents (doc_type, audience, title, content) VALUES
    ('privacy', 'global', 'Privacy Policy', 'Placeholder -- edit this in the admin dashboard (Admin -> Legal Pages) before launch. This text is not real legal copy.'),
    ('terms', 'global', 'Terms of Service', 'Placeholder -- edit this in the admin dashboard (Admin -> Legal Pages) before launch. This text is not real legal copy.')
ON CONFLICT (doc_type, audience) DO NOTHING;
