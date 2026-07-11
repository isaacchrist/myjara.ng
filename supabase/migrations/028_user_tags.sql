-- Phase 1.4: short, unique, human-readable tags for every user
--
-- The `id` UUID stays the real identifier for every FK/RLS policy in the
-- system (unchanged, and deliberately kept opaque -- encoding business
-- meaning into it would fight its purpose as a stable key). `tag` is a new,
-- separate column purely for humans: searching for someone in chat, looking
-- up who filed a dispute, or finding a user in the admin panel without
-- quoting a raw UUID.
--
-- Generated as slug(full_name) + '-' + first 4 hex chars of the real id, so
-- the tag stays deterministically traceable back to the UUID it came from.
-- platform_admin users get an 'admin-' prefix. A BEFORE INSERT trigger
-- (not a replacement of the existing, historically-inconsistent
-- handle_new_user() -- see supabase/migrations/README.md) covers every
-- insert path uniformly: the auth trigger's customer signup, and the
-- explicit admin-client upserts in registerRetailer/registerBrand.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS tag TEXT UNIQUE;

CREATE OR REPLACE FUNCTION public.set_user_tag()
RETURNS TRIGGER AS $$
DECLARE
    base TEXT;
    candidate TEXT;
    suffix_len INT := 4;
BEGIN
    IF NEW.tag IS NOT NULL THEN
        RETURN NEW;
    END IF;

    base := (CASE WHEN NEW.role = 'platform_admin' THEN 'admin-' ELSE '' END)
        || COALESCE(NULLIF(regexp_replace(lower(COALESCE(NEW.full_name, '')), '[^a-z0-9]+', '-', 'g'), ''), 'user');
    base := trim(both '-' from base);

    LOOP
        candidate := base || '-' || substr(NEW.id::text, 1, suffix_len);
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE tag = candidate);
        suffix_len := suffix_len + 1;
        EXIT WHEN suffix_len > 12;
    END LOOP;

    NEW.tag := candidate;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_user_tag ON public.users;
CREATE TRIGGER trg_set_user_tag
    BEFORE INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.set_user_tag();

-- Backfill existing rows (the trigger only fires on new inserts). Uses the
-- full first hex group (8 chars) rather than the trigger's default 4 since
-- this runs as one bulk statement without the trigger's per-row collision
-- retry loop -- negligible collision risk at any realistic user count.
UPDATE public.users
SET tag = trim(both '-' from (
        (CASE WHEN role = 'platform_admin' THEN 'admin-' ELSE '' END)
        || COALESCE(NULLIF(regexp_replace(lower(COALESCE(full_name, '')), '[^a-z0-9]+', '-', 'g'), ''), 'user')
    )) || '-' || substr(id::text, 1, 8)
WHERE tag IS NULL;
